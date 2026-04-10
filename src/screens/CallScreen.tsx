import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from '@react-native-firebase/firestore';
import { useAppSelector } from '../hooks/reduxHooks';

const APP_ID = '248782893c04415aab5258e24ed9a17c';

type Props = {
  onNavigate: (screen: any, params?: any) => void;
  params?: any;
};

const CallScreen: React.FC<Props> = ({ onNavigate, params }) => {
  const { isCaller, user: otherUser, callType } = params;
  
  const currentUser = useAppSelector(state => state.user.user);
  const db = getFirestore();
  
  // Create a predictable unique channel ID for the new call
  const [channelId] = useState(params.channelId || `call_${currentUser?.uid}_${Date.now()}`);

  const agoraEngine = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callStatus, setCallStatus] = useState<'ringing' | 'accepted' | 'rejected' | 'ended'>(isCaller ? 'ringing' : 'accepted');

  useEffect(() => {
    if (isCaller) {
      setDoc(doc(db, 'calls', channelId), {
        callerId: currentUser?.uid || 'unknown',
        callerName: currentUser?.name || 'User',
        callerAvatar: currentUser?.pic || currentUser?.avatar || null,
        calleeId: otherUser?.uid || 'unknown',
        status: 'ringing',
        type: callType || 'video',
      }).catch(e => console.log('Error creating call doc', e));
    }

    const unsub = onSnapshot(doc(db, 'calls', channelId), (docSnap) => {
      if (docSnap.exists()) {
        const st = docSnap.data()?.status;
        setCallStatus(st);
        if (st === 'rejected' || st === 'ended') {
          Alert.alert('Call', `The call was ${st}.`);
          endCallLocally();
        }
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setupVideoSDKEngine();
    return () => {
      agoraEngine.current?.unregisterEventHandler({});
      agoraEngine.current?.release();
    };
  }, []);

  const getPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const setupVideoSDKEngine = async () => {
    try {
      await getPermission();
      const engine = createAgoraRtcEngine();
      agoraEngine.current = engine;

      engine.initialize({
        appId: APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('[Agora] Joined channel success!');
          setJoined(true);
        },
        onUserJoined: (_con, uid) => {
          console.log('[Agora] Remote user joined: ', uid);
          setRemoteUid(uid);
        },
        onUserOffline: (_con, uid) => {
          console.log('[Agora] Remote user left: ', uid);
          setRemoteUid(0);
          leaveChannel(); // Auto leave when remote leaves
        },
        onLeaveChannel: () => {
          setJoined(false);
          setRemoteUid(0);
        },
        onError: (err, msg) => {
          console.error('[Agora] Error: ', err, msg);
          if (err === 109) {
            Alert.alert('Agora Error', 'Token expired or invalid. Your Agora project probably requires a Token! Switch it to Testing Mode.');
          } else if (err === 17) {
            Alert.alert('Agora Error', 'Join channel rejected. Check your App ID or network.');
          }
        },
        onConnectionStateChanged: (state, reason) => {
           console.log('[Agora] Connection State: ', state, ' Reason: ', reason);
        }
      });

      if (callType === 'video') {
        engine.enableVideo();
        engine.startPreview();
      } else {
        engine.disableVideo();
        engine.enableAudio();
      }

      engine.joinChannel('', channelId, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: callType === 'video',
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
    } catch (e) {
      console.log('[Agora] Error:', e);
      Alert.alert('Error', 'Could not start the call engine.');
    }
  };

  const endCallLocally = () => {
    agoraEngine.current?.leaveChannel();
    // Navigate back to the specific user's chat room safely
    if (otherUser) {
      onNavigate('BackToChat', { user: otherUser });
    } else {
      onNavigate('UserList');
    }
  };

  const leaveChannel = async () => {
    try {
      if (callStatus !== 'ended' && callStatus !== 'rejected') {
        await updateDoc(doc(db, 'calls', channelId), { status: 'ended' });
      }
    } catch (e) {
      console.log('Error updating status', e);
    }
    endCallLocally();
  };

  const toggleMute = () => {
    agoraEngine.current?.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const switchCamera = () => {
    agoraEngine.current?.switchCamera();
    setIsFrontCamera(!isFrontCamera);
  };

  return (
    <View style={styles.container}>
      {/* Remote Video (Background) */}
      <View style={styles.remoteVideoContainer}>
        {remoteUid !== 0 && callType === 'video' ? (
          <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.remoteVideo} />
        ) : (
          <View style={styles.placeholderContainer}>
             <Text style={styles.placeholderText}>
              {callStatus === 'ringing' ? `Calling ${otherUser?.name}...` : (joined && remoteUid === 0 ? `Waiting for ${otherUser?.name}...` : `${otherUser?.name}`)}
            </Text>
            {callType === 'audio' && (
               <Icon name="person-circle-outline" size={120} color="#555" style={{ marginTop: 20 }} />
            )}
          </View>
        )}
      </View>

      {/* Local Video (Floating) */}
      {callType === 'video' && (
        <View style={styles.localVideoContainer}>
          <RtcSurfaceView canvas={{ uid: 0 }} style={styles.localVideo} />
        </View>
      )}

      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.userName}>{otherUser?.name}</Text>
        <Text style={styles.statusText}>{remoteUid !== 0 ? '00:00' : (callStatus === 'ringing' ? 'Ringing...' : 'Connecting...')}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, isMuted && styles.activeBtn]} onPress={toggleMute}>
          <Icon name={isMuted ? 'mic-off' : 'mic'} size={30} color={isMuted ? '#FFF' : '#333'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={leaveChannel}>
          <Icon name="call" size={30} color="#FFF" />
        </TouchableOpacity>

        {callType === 'video' && (
          <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
            <Icon name="camera-reverse" size={30} color="#333" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#252545',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideoContainer: {
    position: 'absolute',
    top: verticalScale(50),
    right: horizontalScale(20),
    width: horizontalScale(110),
    height: verticalScale(160),
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 10,
  },
  localVideo: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: verticalScale(60),
    left: horizontalScale(20),
  },
  userName: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  statusText: {
    fontSize: moderateScale(16),
    color: '#CCC',
    marginTop: 5,
  },
  controls: {
    position: 'absolute',
    bottom: verticalScale(50),
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlBtn: {
    width: moderateScale(65),
    height: moderateScale(65),
    borderRadius: moderateScale(32.5),
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  activeBtn: {
    backgroundColor: '#FF5252',
  },
  endCallBtn: {
    backgroundColor: '#FF5252',
    transform: [{ rotate: '135deg' }],
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
});

export default CallScreen;
