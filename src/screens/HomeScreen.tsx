import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from '../utils/scaling';
import { useAppSelector, useAppDispatch } from '../hooks/reduxHooks';
import { logout } from '../store/slices/userSlice';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  getDoc,
  doc,
  updateDoc,
  where,
  orderBy
} from '@react-native-firebase/firestore';

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat' | 'Profile';

type Props = {
  onNavigate: (screen: any, params?: any) => void;
};

type ChatUser = {
  uid: string;
  name: string;
  avatar?: string;
  pic?: string;
  isOnline: boolean;
  lastMessage?: string;
};

const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const user = useAppSelector(state => state.user.user);
  const [recentChats, setRecentChats] = React.useState<ChatUser[]>([]);
  const [onlineCount, setOnlineCount] = React.useState(0);
  const db = getFirestore();

  React.useEffect(() => {
    if (!user?.uid) return;

    // 1. Mark me as Online
    updateDoc(doc(db, 'users', user.uid), { isOnline: true });

    // 2. Count Online Users
    const qOnline = query(collection(db, 'users'), where('isOnline', '==', true));
    const unsubOnline = onSnapshot(qOnline, (snap) => {
      setOnlineCount(snap.size);
    });

    // 3. Get Recent Chats (Aggregated from messages)
    const qMsgs = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubMsgs = onSnapshot(qMsgs, async (snap) => {
      const chatPartnerIds = new Set<string>();
      snap.forEach(msgDoc => {
        const data = msgDoc.data();
        if (data.senderId === user.uid) chatPartnerIds.add(data.receiverId);
        if (data.receiverId === user.uid) chatPartnerIds.add(data.senderId);
      });

      const partners: ChatUser[] = [];
      for (const partnerId of Array.from(chatPartnerIds)) {
        const pDoc = await getDoc(doc(db, 'users', partnerId));
        if (pDoc.exists()) {
          const pData = pDoc.data();
          partners.push({
            uid: partnerId,
            name: pData.name || 'User',
            avatar: pData.avatar || pData.pic,
            isOnline: pData.isOnline || false,
          });
        }
      }
      setRecentChats(partners);
    });

    return () => {
      unsubOnline();
      unsubMsgs();
      if (user?.uid) updateDoc(doc(db, 'users', user.uid), { isOnline: false });
    };
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Custom App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.greeting}>Connectify</Text>
        <TouchableOpacity style={styles.profileIcon} onPress={() => onNavigate('Profile')}>
          {(user?.avatar || user?.pic) ? (
            <Image
              source={{ uri: user.avatar || user.pic }}
              style={styles.avatarImage}
            />
          ) : (
            <Icon
              name="person-circle"
              size={moderateScale(32)}
              color="#1565C0"
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Icon name="chatbubbles" size={moderateScale(50)} color="#1565C0" />
          <Text style={styles.welcomeTitle}>Hello, {user?.name?.split(' ')[0]}!</Text>
          <Text style={styles.welcomeSub}>Ready to connect with your friends?</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{recentChats.length}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statOnlineRow}>
              <View style={styles.onlinePulse} />
              <Text style={[styles.statNum, { color: '#4CAF50' }]}>{onlineCount}</Text>
            </View>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          <TouchableOpacity onPress={() => onNavigate('UserList')}>
            <Text style={styles.seeAll}>Find More</Text>
          </TouchableOpacity>
        </View>

        {recentChats.length > 0 ? (
          recentChats.map((item) => (
            <TouchableOpacity
              key={item.uid}
              style={styles.chatItem}
              onPress={() => onNavigate('Chat', { user: item })}
            >
              <View>
                <Image
                  source={{ uri: item.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' }}
                  style={styles.chatAvatar}
                />
                {item.isOnline && <View style={styles.onlineBadge} />}
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatStatus}>{item.isOnline ? 'Active Now' : 'Offline'}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="chatbubble-outline" size={40} color="#DDD" />
            <Text style={styles.emptyText}>No recent chats yet.</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.mainAction}
          onPress={() => onNavigate('UserList')}
        >
          <Icon name="add" size={moderateScale(24)} color="#FFFFFF" />
          <Text style={styles.actionText}>New Message</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  appBar: {
    height: verticalScale(60),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#1565C0',
    flex: 1,
  },
  profileIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
  },
  avatarImage: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    borderWidth: 1.5,
    borderColor: '#1565C0',
  },
  scrollContent: {
    padding: moderateScale(20),
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(30),
    alignItems: 'center',
    marginBottom: verticalScale(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  welcomeTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginTop: verticalScale(15),
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: moderateScale(15),
    color: '#888',
    textAlign: 'center',
    marginTop: verticalScale(8),
    lineHeight: moderateScale(22),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(30),
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    width: '30%',
    borderRadius: moderateScale(15),
    padding: moderateScale(15),
    alignItems: 'center',
    elevation: 1,
  },
  statNum: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#1565C0',
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#AAA',
    marginTop: verticalScale(4),
  },
  mainAction: {
    backgroundColor: '#1565C0',
    borderRadius: moderateScale(15),
    height: verticalScale(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginLeft: horizontalScale(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
    marginTop: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#1565C0',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  chatItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(15),
    marginBottom: verticalScale(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  chatAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  chatInfo: {
    flex: 1,
    marginLeft: horizontalScale(15),
  },
  chatName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#333',
  },
  chatStatus: {
    fontSize: moderateScale(13),
    color: '#888',
    marginTop: 2,
  },
  onlinePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statOnlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    color: '#AAA',
    marginTop: 10,
    fontSize: moderateScale(14),
  },
});

export default HomeScreen;
