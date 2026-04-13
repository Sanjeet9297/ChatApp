import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';
import BackButton from '../components/shared/BackButton';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  setDoc
} from '@react-native-firebase/firestore';
import { useAppSelector } from '../hooks/reduxHooks';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import storage from '@react-native-firebase/storage';
import { API_CONFIG } from '../config/api.config';

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat' | 'Call';

type Message = {
  id: string;
  text?: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  type: 'text' | 'image' | 'video' | 'file' | 'audio';
  fileUri?: string;
  fileName?: string;
  _rawDate?: Date;
};

type Props = {
  onNavigate: (screen: Screen, params?: any) => void;
  params?: any;
};

const ChatScreen: React.FC<Props> = ({ onNavigate, params }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAttachMenuVisible, setIsAttachMenuVisible] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = useAppSelector(state => state.user.user);
  const otherUser = params?.user;
  const db = getFirestore();

  const chatId = currentUser?.uid && otherUser?.uid
    ? [currentUser.uid, otherUser.uid].sort().join('_')
    : null;

  useEffect(() => {
    if (!currentUser?.uid || !otherUser?.uid) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const isBetweenUs =
          (data.senderId === currentUser.uid && data.receiverId === otherUser.uid) ||
          (data.senderId === otherUser.uid && data.receiverId === currentUser.uid);

        if (isBetweenUs) {
          const rawDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
          allMsgs.push({
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            receiverId: data.receiverId,
            type: data.type || 'text',
            fileUri: data.fileUri,
            fileName: data.fileName,
            timestamp: rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            _rawDate: rawDate,
          } as any);
        }
      });

      let groupedMsgs: any[] = [];
      let currentDateStr = '';

      allMsgs.forEach(msg => {
        const msgDateStr = (msg._rawDate || new Date()).toDateString();
        if (msgDateStr !== currentDateStr) {
          currentDateStr = msgDateStr;
          const today = new Date().toDateString();
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          let headerTitle = msgDateStr;
          if (msgDateStr === today) headerTitle = 'Today';
          else if (msgDateStr === yesterday) headerTitle = 'Yesterday';

          groupedMsgs.push({
            id: `date-${msgDateStr}`,
            isDateHeader: true,
            text: headerTitle,
          });
        }
        groupedMsgs.push(msg);
      });

      setMessages(groupedMsgs);
    }, (error) => {
      console.error("[Chat] Sync Error:", error);
    });

    let unsubTyping = () => { };
    if (chatId) {
      unsubTyping = onSnapshot(doc(db, 'chats', chatId), (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();
          if (data?.typing?.[otherUser.uid]) {
            setOtherUserTyping(true);
          } else {
            setOtherUserTyping(false);
          }
        }
      });
    }

    return () => {
      unsubscribe();
      unsubTyping();
    };
  }, [currentUser?.uid, otherUser?.uid, chatId]);

  const updateTypingStatus = async (typing: boolean) => {
    if (!chatId || !currentUser?.uid) return;
    try {
      await setDoc(doc(db, 'chats', chatId), {
        typing: { [currentUser.uid]: typing }
      }, { merge: true });
    } catch (e) {
      console.log('Error updating typing', e);
    }
  };

  const handleTyping = () => {
    updateTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 1500);
  };

  const handleChangeText = (text: string) => {
    setInputText(text);
    if (text.length > 0) {
      handleTyping();
    } else {
      updateTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || !currentUser || !otherUser) return;
    const textToSend = inputText;
    setInputText('');

    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      await addDoc(collection(db, 'messages'), {
        text: textToSend,
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        type: 'text',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("[Chat] Send failed:", error);
    }
  };

  const sendFileMessage = async (fileData: { uri: string, name: string, type: Message['type'], mimeType?: string }) => {
    if (!currentUser || !otherUser) return;
    try {
      setIsUploading(true);
      let downloadURL = fileData.uri;

      // Upload to PHP Server if it's a local file
      if (fileData.uri.startsWith('content://') || fileData.uri.startsWith('file://')) {
        const formData = new FormData();

        // Ensure URI is correctly formatted for Android
        let uri = fileData.uri;
        if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
          uri = 'file://' + uri;
        }

        formData.append('image', {
          uri: uri,
          type: fileData.mimeType || 'application/octet-stream',
          name: fileData.name || `file_${Date.now()}`,
        } as any);

        const uploadUrl = API_CONFIG.UPLOAD_URL;
        console.log("[Chat] Uploading file to:", uploadUrl);

        // Using XMLHttpRequest for better reliability on Android file uploads
        const result: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl);
          xhr.setRequestHeader('Accept', 'application/json');
          
          xhr.onload = () => {
            console.log("[Chat] Server Raw Response:", xhr.responseText);
            try {
              const res = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(res);
              } else {
                reject(new Error(res.message || res.error || `Upload failed with status ${xhr.status}`));
              }
            } catch (e) {
              reject(new Error("Server returned non-JSON response"));
            }
          };

          xhr.onerror = () => {
             console.error("[Chat] XHR Network Error Details:", xhr);
             reject(new Error("Network request failed. Please check if your PC firewall is open for port 8000."));
          };

          xhr.send(formData);
        });

        if (result.status === 'success' || result.url || result.data?.url) {
          downloadURL = result.url || result.data?.url || result.path;
          console.log("[Chat] Upload successful, URL:", downloadURL);
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      }

      // 2. Save message to Firestore with the uploaded file URL
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        type: fileData.type,
        fileUri: downloadURL,
        fileName: fileData.name,
        timestamp: serverTimestamp(),
      });

      console.log("[Chat] Message saved to Firestore");
    } catch (error) {
      console.error("[Chat] File send failed:", error);
      Alert.alert('Upload Error', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImagePicker = async () => {
    setIsAttachMenuVisible(false);
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      sendFileMessage({
        uri: asset.uri || '',
        name: asset.fileName || 'Image',
        type: 'image',
        mimeType: asset.type
      });
    }
  };

  const handleVideoPicker = async () => {
    setIsAttachMenuVisible(false);
    const result = await launchImageLibrary({
      mediaType: 'video',
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      sendFileMessage({
        uri: asset.uri || '',
        name: asset.fileName || 'Video',
        type: 'video',
        mimeType: asset.type
      });
    }
  };

  const handleFilePicker = async (fileType: 'doc' | 'txt' | 'audio' | 'gif') => {
    setIsAttachMenuVisible(false);
    try {
      let pickType: any = types.allFiles;
      if (fileType === 'audio') pickType = types.audio;
      if (fileType === 'doc') pickType = [types.pdf, types.doc, types.docx];
      if (fileType === 'txt') pickType = [types.plainText];
      if (fileType === 'gif') pickType = [types.images];

      const res = await pick({
        type: pickType,
      });

      if (res && res.length > 0) {
        sendFileMessage({
          uri: res[0].uri,
          name: res[0].name || 'File',
          type: fileType === 'audio' ? 'audio' : (fileType === 'gif' ? 'image' : 'file'),
          mimeType: res[0].type || undefined
        });
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        console.log('User cancelled the picker');
      } else {
        console.error('File pick error:', err);
      }
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    if (item.isDateHeader) {
      return (
        <View style={styles.dateHeaderContainer}>
          <Text style={styles.dateHeaderText}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.senderId === currentUser?.uid;

    const renderContent = () => {
      switch (item.type) {
        case 'image':
          return (
            <View>
              <Image
                source={{ uri: item.fileUri }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Icon name="expand-outline" size={moderateScale(18)} color="#FFF" />
              </View>
            </View>
          );
        case 'video':
          return (
            <View style={styles.fileCard}>
              <View style={[styles.fileIconContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : '#E3F0FF' }]}>
                <Icon name="videocam" size={moderateScale(28)} color={isMe ? "#FFF" : "#1565C0"} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, isMe ? styles.whiteText : styles.blackText]} numberOfLines={1}>
                  {item.fileName || 'Video'}
                </Text>
                <Text style={[styles.fileSubText, isMe ? styles.lightText : styles.grayText]}>Video File</Text>
              </View>
            </View>
          );
        case 'audio':
          return (
            <View style={styles.fileCard}>
              <View style={[styles.fileIconContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : '#FFE3E3' }]}>
                <Icon name="musical-notes" size={moderateScale(28)} color={isMe ? "#FFF" : "#FF5252"} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, isMe ? styles.whiteText : styles.blackText]} numberOfLines={1}>
                  {item.fileName || 'Audio'}
                </Text>
                <Text style={[styles.fileSubText, isMe ? styles.lightText : styles.grayText]}>Audio Clip</Text>
              </View>
            </View>
          );
        case 'file':
          return (
            <View style={styles.fileCard}>
              <View style={[styles.fileIconContainer, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : '#E8F5E9' }]}>
                <Icon name="document-text" size={moderateScale(28)} color={isMe ? "#FFF" : "#2E7D32"} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, isMe ? styles.whiteText : styles.blackText]} numberOfLines={1}>
                  {item.fileName || 'Document'}
                </Text>
                <Text style={[styles.fileSubText, isMe ? styles.lightText : styles.grayText]}>Document</Text>
              </View>
            </View>
          );
        default:
          return <Text style={[styles.messageText, isMe ? styles.whiteText : styles.blackText]}>{item.text}</Text>;
      }
    };

    const handlePressMessage = () => {
      if (item.type === 'image' && item.fileUri) {
        setViewingImage(item.fileUri);
      } else if (item.fileUri && (item.type === 'video' || item.type === 'file' || item.type === 'audio')) {
        Linking.openURL(item.fileUri).catch(err => {
          console.error("Failed to open URL:", err);
          Alert.alert("Error", "Could not open this file.");
        });
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePressMessage}
        style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble, item.type === 'image' && styles.imageBubble]}
      >
        {renderContent()}
        <Text style={[styles.timestamp, item.type === 'image' && styles.imageTimestamp]}>{item.timestamp}</Text>
      </TouchableOpacity>
    );
  };

  const AttachmentOption = ({ icon, color, label, onPress }: { icon: string, color: string, label: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={[styles.menuIconCircle, { backgroundColor: color }]}>
        <Icon name={icon} size={moderateScale(24)} color="#FFF" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const startCall = (type: 'audio' | 'video') => {
    onNavigate('Call', {
      user: otherUser,
      isCaller: true,
      callType: type,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <BackButton onPress={() => onNavigate('UserList')} />
        <Image source={{ uri: otherUser?.pic || otherUser?.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.name || 'User'}</Text>
          <Text style={[styles.headerStatus, otherUserTyping && { color: '#1565C0', fontStyle: 'italic', fontWeight: 'bold' }]}>
            {otherUserTyping ? 'typing...' : 'Online'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => startCall('audio')}>
            <Icon name="call" size={moderateScale(22)} color="#1565C0" style={{ marginRight: horizontalScale(15) }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => startCall('video')}>
            <Icon name="videocam" size={moderateScale(24)} color="#1565C0" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.emptyChatText}>No conversation yet</Text>
          </View>
        )}
      />

      {/* Full Screen Image Viewer Modal */}
      <Modal visible={!!viewingImage} transparent={true} animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity style={styles.imageViewerCloseBtn} onPress={() => setViewingImage(null)}>
            <Icon name="close" size={moderateScale(30)} color="#FFF" />
          </TouchableOpacity>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Attachment Menu Modal */}
      <Modal
        visible={isAttachMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAttachMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsAttachMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuGrid}>
              <AttachmentOption icon="image" color="#BF59CF" label="Images" onPress={handleImagePicker} />
              <AttachmentOption icon="musical-notes" color="#F15C6D" label="Audio" onPress={() => handleFilePicker('audio')} />
              <AttachmentOption icon="videocam" color="#4B77D1" label="Videos" onPress={handleVideoPicker} />
              <AttachmentOption icon="happy" color="#F79F1F" label="Gifs" onPress={() => handleFilePicker('gif')} />
              <AttachmentOption icon="document" color="#20BF6B" label="Documents" onPress={() => handleFilePicker('doc')} />
              <AttachmentOption icon="document-text" color="#2D98DA" label="txt" onPress={() => handleFilePicker('txt')} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        style={styles.inputArea}
      >
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => setIsAttachMenuVisible(true)}
        >
          <Icon name="add-outline" size={moderateScale(26)} color="#1565C0" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="New Message..."
          value={inputText}
          onChangeText={handleChangeText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Icon name="send" size={moderateScale(24)} color="#FFF" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: {
    height: verticalScale(70),
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 3,
  },
  headerAvatar: {
    width: horizontalScale(45),
    height: horizontalScale(45),
    borderRadius: horizontalScale(22.5),
    marginLeft: horizontalScale(10)
  },
  headerInfo: { flex: 1, marginLeft: horizontalScale(12) },
  headerName: { fontSize: moderateScale(18), fontWeight: 'bold', color: '#333' },
  headerStatus: { fontSize: moderateScale(13), color: '#4CAF50' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  messageList: { padding: moderateScale(15), paddingBottom: verticalScale(30) },
  messageBubble: {
    maxWidth: '80%',
    padding: moderateScale(12),
    borderRadius: moderateScale(20),
    marginBottom: verticalScale(12),
    elevation: 1
  },
  imageBubble: {
    padding: moderateScale(4),
    backgroundColor: '#FFF',
  },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#1565C0', borderBottomRightRadius: 2 },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 2 },
  messageText: { fontSize: moderateScale(16) },
  messageImage: {
    width: horizontalScale(220),
    height: verticalScale(150),
    borderRadius: moderateScale(15),
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(5),
    width: horizontalScale(200),
  },
  fileName: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#333',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
    width: horizontalScale(220),
    borderRadius: moderateScale(15),
  },
  fileIconContainer: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  fileInfo: {
    flex: 1,
  },
  fileSubText: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  imageOverlay: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: moderateScale(8),
    padding: moderateScale(4),
  },
  lightText: { color: 'rgba(255,255,255,0.7)' },
  grayText: { color: '#888' },
  whiteText: { color: '#FFF' },
  blackText: { color: '#333' },
  timestamp: {
    fontSize: moderateScale(10),
    alignSelf: 'flex-end',
    marginTop: verticalScale(4),
    color: 'rgba(0,0,0,0.3)'
  },
  imageTimestamp: {
    position: 'absolute',
    bottom: moderateScale(8),
    right: moderateScale(8),
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: moderateScale(10),
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  attachBtn: { padding: moderateScale(10) },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: moderateScale(25),
    paddingHorizontal: horizontalScale(15),
    paddingVertical: verticalScale(8),
    maxHeight: verticalScale(100),
    color: '#333',
    fontSize: moderateScale(15),
  },
  sendBtn: {
    width: horizontalScale(45),
    height: horizontalScale(45),
    borderRadius: horizontalScale(22.5),
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: horizontalScale(10)
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: moderateScale(16),
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingBottom: verticalScale(80),
  },
  menuContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: horizontalScale(15),
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuOption: {
    width: '30%',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  menuIconCircle: {
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(27.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  menuLabel: {
    fontSize: moderateScale(12),
    color: '#666',
    fontWeight: '500',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: verticalScale(40),
    right: horizontalScale(20),
    zIndex: 10,
    padding: moderateScale(10),
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: verticalScale(15),
  },
  dateHeaderText: {
    backgroundColor: '#EAEAEC',
    color: '#666',
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    fontSize: moderateScale(11),
    fontWeight: '600',
    overflow: 'hidden',
  },
});

export default ChatScreen;
