import React, { useState, useEffect } from 'react';
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
  serverTimestamp 
} from '@react-native-firebase/firestore';
import { useAppSelector } from '../hooks/reduxHooks';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker, { types } from 'react-native-document-picker';

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat' | 'Call';

type Message = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
};

type Props = {
  onNavigate: (screen: Screen, params?: any) => void;
  params?: any;
};

const ChatScreen: React.FC<Props> = ({ onNavigate, params }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAttachMenuVisible, setIsAttachMenuVisible] = useState(false);
  
  const currentUser = useAppSelector(state => state.user.user);
  const otherUser = params?.user; 
  const db = getFirestore();

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
          allMsgs.push({
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            receiverId: data.receiverId,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
          });
        }
      });
      setMessages(allMsgs);
    }, (error) => {
      console.error("[Chat] Sync Error:", error);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, otherUser?.uid]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || !currentUser || !otherUser) return;
    const textToSend = inputText;
    setInputText(''); 

    try {
      await addDoc(collection(db, 'messages'), {
        text: textToSend,
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("[Chat] Send failed:", error);
    }
  };

  const handleImagePicker = async () => {
    setIsAttachMenuVisible(false);
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
    });
    
    if (result.assets && result.assets.length > 0) {
      Alert.alert('Image Selected', result.assets[0].fileName || 'Image');
      // Later: Upload to Firebase Storage
    }
  };

  const handleVideoPicker = async () => {
    setIsAttachMenuVisible(false);
    const result = await launchImageLibrary({
      mediaType: 'video',
    });
    
    if (result.assets && result.assets.length > 0) {
      Alert.alert('Video Selected', result.assets[0].fileName || 'Video');
    }
  };

  const handleFilePicker = async (type: 'doc' | 'txt' | 'audio' | 'gif') => {
    setIsAttachMenuVisible(false);
    try {
      let pickType: any = types.allFiles;
      if (type === 'audio') pickType = types.audio;
      if (type === 'doc') pickType = [types.pdf, types.doc, types.docx];
      if (type === 'txt') pickType = [types.plainText];
      if (type === 'gif') pickType = [types.images];

      const res = await DocumentPicker.pick({
        type: pickType,
      });
      Alert.alert('File Selected', res[0].name || 'File');
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        console.error('File pick error:', err);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUser?.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isMe ? styles.whiteText : styles.blackText]}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <BackButton onPress={() => onNavigate('UserList')} />
        <Image source={{ uri: otherUser?.pic || otherUser?.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.name || 'User'}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        <View style={styles.headerActions}>
          <Icon name="call-outline" size={moderateScale(20)} color="#1565C0" style={{ marginRight: horizontalScale(15) }} />
          <TouchableOpacity onPress={() => onNavigate('Call', { user: otherUser })}>
            <Icon name="videocam-outline" size={moderateScale(20)} color="#1565C0" />
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
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
          <Icon name="send" size={moderateScale(24)} color="#FFF" />
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
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#1565C0', borderBottomRightRadius: 2 },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 2 },
  messageText: { fontSize: moderateScale(16) },
  whiteText: { color: '#FFF' },
  blackText: { color: '#333' },
  timestamp: { 
    fontSize: moderateScale(10), 
    alignSelf: 'flex-end', 
    marginTop: verticalScale(4), 
    color: 'rgba(0,0,0,0.3)' 
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
});

export default ChatScreen;
