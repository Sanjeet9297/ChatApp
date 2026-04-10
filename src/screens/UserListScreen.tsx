import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';
import BackButton from '../components/shared/BackButton';
import { getFirestore, collection, onSnapshot, getDocs } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat';

type User = {
  uid: string;
  name: string;
  email: string;
  pic?: string;
  isOnline?: boolean;
};

type Props = {
  onNavigate: (screen: Screen, params?: any) => void;
};

const UserListScreen: React.FC<Props> = ({ onNavigate }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;

  React.useEffect(() => {
    console.log("[UserList] Connecting to Cloud Firestore...");
    
    const processSnapshot = (querySnapshot: any) => {
      console.log("[UserList] Processing data. Count:", querySnapshot.size);
      const userList: User[] = [];
      querySnapshot.forEach((documentSnapshot: any) => {
        const userData = documentSnapshot.data() as User;
        const userUid = userData.uid || documentSnapshot.id;
        
        if (userUid !== currentUser?.uid) {
          userList.push({
            ...userData,
            uid: userUid,
          });
        }
      });
      setUsers(userList);
      setLoading(false);
    };

    // 1. Immediate One-Time Fetch
    const fetchOnce = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        processSnapshot(snapshot);
      } catch (err) {
        console.error("[UserList] Force fetch failed:", err);
      }
    };

    fetchOnce();

    // 2. Real-time Subscription
    const subscriber = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        processSnapshot(snapshot);
      }, 
      (error) => {
        console.error("[UserList] Subscription error:", error);
        setLoading(false);
      }
    );

    return () => subscriber();
  }, [currentUser?.uid, db]);

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => onNavigate('Chat', { user: item })}
    >
      <View>
        <Image source={{ uri: item.pic || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg' }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.isOnline ? 'Online' : item.email}</Text>
      </View>
      <Icon name="chevron-forward-outline" size={moderateScale(20)} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <BackButton onPress={() => onNavigate('Home')} />
        <Text style={styles.headerTitle}>Select User</Text>
        <View style={{ width: horizontalScale(36) }} />
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.emptyContainer}>
             <Text style={styles.emptyText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found in Firestore.</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.uid}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: verticalScale(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  listContent: {
    padding: moderateScale(10),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(15),
    backgroundColor: '#FFF',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(10),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
    width: horizontalScale(55),
    height: horizontalScale(55),
    borderRadius: horizontalScale(27.5),
    backgroundColor: '#EEE',
  },
  userInfo: {
    flex: 1,
    marginLeft: horizontalScale(15),
  },
  userName: {
    fontSize: moderateScale(17),
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: moderateScale(13),
    color: '#888',
    marginTop: verticalScale(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#888',
    textAlign: 'center',
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
});

export default UserListScreen;
