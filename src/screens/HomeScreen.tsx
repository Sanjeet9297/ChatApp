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

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat' | 'Profile';

type Props = {
  onNavigate: (screen: Screen, params?: any) => void;
};

const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const user = useAppSelector(state => state.user.user);
  const dispatch = useAppDispatch();

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeCard}>
          <Icon name="happy-outline" size={moderateScale(60)} color="#1565C0" />
          <Text style={styles.welcomeTitle}>
            Welcome, {user?.name || 'Home'}!
          </Text>
          <Text style={styles.welcomeSub}>
            You have successfully logged into your Chat App.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.mainAction}
          onPress={() => onNavigate('UserList')}
        >
          <Icon
            name="chatbubble-ellipses-outline"
            size={moderateScale(24)}
            color="#FFFFFF"
          />
          <Text style={styles.actionText}>Start New Conversation</Text>
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
});

export default HomeScreen;
