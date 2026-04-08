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
  VideoViewSetupMode,
} from 'react-native-agora';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';

const APP_ID = '248782893c04415aab5258e24ed9a17c';

type Props = {
  onNavigate: (screen: any) => void;
  params?: any;
};

const CallScreen: React.FC<Props> = ({ onNavigate, params }) => {
  const agoraEngine = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // In a real app, channelId would be unique for the chat (e.g., chatDocId)
  const channelId = params?.channelId || 'test_channel';
  const otherUser = params?.user || { name: 'User' };

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
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('[Agora] Joined successfully', connection.channelId);
          setJoined(true);
        },
        onUserJoined: (connection, remoteUid, elapsed) => {
          console.log('[Agora] Remote user joined', remoteUid);
          setRemoteUid(remoteUid);
        },
        onUserOffline: (connection, remoteUid, reason) => {
          console.log('[Agora] Remote user left', remoteUid);
          setRemoteUid(0);
        },
        onLeaveChannel: (connection, stats) => {
          console.log('[Agora] Left channel');
          setJoined(false);
          setRemoteUid(0);
        },
      });

      engine.enableVideo();
      engine.startPreview();

      // Join the channel
      engine.joinChannel('', channelId, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    } catch (e) {
      console.log('[Agora] Error:', e);
      Alert.alert('Error', 'Could not start the call engine.');
    }
  };

  const leaveChannel = () => {
    agoraEngine.current?.leaveChannel();
    onNavigate('Chat'); // Fixed navigation call
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
        {remoteUid !== 0 ? (
          <RtcSurfaceView
            canvas={{ uid: remoteUid }}
            style={styles.remoteVideo}
          />
        ) : (
          <View style={styles.placeholderContainer}>
             <Text style={styles.placeholderText}>
              {joined ? `Waiting for ${otherUser.name}...` : 'Connecting...'}
            </Text>
          </View>
        )}
      </View>

      {/* Local Video (Floating) */}
      <View style={styles.localVideoContainer}>
        {joined && (
          <RtcSurfaceView
            canvas={{ uid: 0 }}
            style={styles.localVideo}
          />
        )}
      </View>

      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.userName}>{otherUser.name}</Text>
        <Text style={styles.statusText}>{remoteUid !== 0 ? 'In Call' : 'Calling...'}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, isMuted && styles.activeBtn]} onPress={toggleMute}>
          <Icon name={isMuted ? 'mic-off' : 'mic'} size={30} color={isMuted ? '#FFF' : '#333'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={leaveChannel}>
          <Icon name="call" size={30} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
          <Icon name="camera-reverse" size={30} color="#333" />
        </TouchableOpacity>
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
