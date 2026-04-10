import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { useAppSelector } from '../hooks/reduxHooks';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc } from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import { verticalScale, horizontalScale, moderateScale } from '../utils/scaling';

type Props = {
  onNavigate: (screen: any, params?: any) => void;
  children: React.ReactNode;
};

const CallManager: React.FC<Props> = ({ onNavigate, children }) => {
  const currentUser = useAppSelector(state => state.user.user);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const db = getFirestore();

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Listen for incoming calls
    const callsRef = collection(db, 'calls');
    const q = query(callsRef, where('calleeId', '==', currentUser.uid), where('status', '==', 'ringing'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        setIncomingCall({ ...callDoc.data(), id: callDoc.id });
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'accepted' });
      onNavigate('Call', {
        channelId: incomingCall.id,
        user: { name: incomingCall.callerName, uid: incomingCall.callerId, pic: incomingCall.callerAvatar },
        callType: incomingCall.type,
        isCaller: false,
      });
      setIncomingCall(null);
    } catch (error) {
      console.log('Error accepting call', error);
    }
  };

  const handleReject = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'rejected' });
      setIncomingCall(null);
    } catch (error) {
      console.log('Error rejecting call', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}

      <Modal visible={!!incomingCall} transparent animationType="slide">
        <View style={styles.incomingContainer}>
          <View style={styles.topSection}>
            <Image
              source={{ uri: incomingCall?.callerAvatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' }}
              style={styles.avatar}
            />
            <Text style={styles.callerName}>{incomingCall?.callerName || 'Someone'}</Text>
            <Text style={styles.statusText}>
              Incoming {incomingCall?.type === 'video' ? 'Video' : 'Audio'} Call...
            </Text>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.actionBlock} onPress={handleReject}>
               <View style={[styles.actionBtn, styles.declineBtn]}>
                 <Icon name="close" size={35} color="#FFF" />
               </View>
               <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBlock} onPress={handleAccept}>
               <View style={[styles.actionBtn, styles.acceptBtn]}>
                 <Icon name={incomingCall?.type === 'video' ? 'videocam' : 'call'} size={30} color="#FFF" />
               </View>
               <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  incomingContainer: {
    flex: 1,
    backgroundColor: '#1E1E2C', // Dark theme for calling
    justifyContent: 'space-between',
    paddingVertical: verticalScale(80),
  },
  topSection: {
    alignItems: 'center',
    marginTop: verticalScale(40),
  },
  avatar: {
    width: horizontalScale(120),
    height: horizontalScale(120),
    borderRadius: horizontalScale(60),
    marginBottom: verticalScale(20),
    borderWidth: 2,
    borderColor: '#4CAF50', // Green border
  },
  callerName: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: verticalScale(10),
  },
  statusText: {
    fontSize: moderateScale(16),
    color: '#A0A0A0',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: horizontalScale(40),
    marginBottom: verticalScale(40),
  },
  actionBlock: {
     alignItems: 'center',
  },
  actionBtn: {
    width: horizontalScale(70),
    height: horizontalScale(70),
    borderRadius: horizontalScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  declineBtn: {
    backgroundColor: '#FF3B30',
  },
  acceptBtn: {
    backgroundColor: '#34C759',
  },
  btnText: {
    color: '#FFF',
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default CallManager;
