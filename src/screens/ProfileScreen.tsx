import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';
import BackButton from '../components/shared/BackButton';
import { useAppSelector, useAppDispatch } from '../hooks/reduxHooks';
import { logout } from '../store/slices/userSlice';
import { getAuth, signOut } from '@react-native-firebase/auth';

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat' | 'Profile';

type Props = {
  onNavigate: (screen: Screen, params?: any) => void;
};

const ProfileScreen: React.FC<Props> = ({ onNavigate }) => {
  const user = useAppSelector(state => state.user.user);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      dispatch(logout());
      onNavigate('Login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => onNavigate('Home')} />
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: moderateScale(24) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          {(user?.avatar || user?.pic) ? (
            <Image
              source={{ uri: user.avatar || user.pic }}
              style={styles.avatarLarge}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={moderateScale(60)} color="#1565C0" />
            </View>
          )}
          <Text style={styles.nameText}>{user?.name || 'User'}</Text>
          <Text style={styles.emailText}>{user?.email || 'email@example.com'}</Text>
          
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Icon name="person-outline" size={moderateScale(20)} color="#666" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.name || 'Guest User'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Icon name="mail-outline" size={moderateScale(20)} color="#666" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
                <Icon name="shield-checkmark-outline" size={moderateScale(20)} color="#666" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Account ID</Text>
              <Text style={styles.infoValue}>{user?.uid || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <TouchableOpacity style={styles.menuItem}>
                <Icon name="notifications-outline" size={moderateScale(22)} color="#1565C0" />
                <Text style={styles.menuText}>Notifications</Text>
                <Icon name="chevron-forward" size={moderateScale(18)} color="#CCC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Icon name="lock-closed-outline" size={moderateScale(22)} color="#1565C0" />
                <Text style={styles.menuText}>Privacy</Text>
                <Icon name="chevron-forward" size={moderateScale(18)} color="#CCC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Icon name="help-circle-outline" size={moderateScale(22)} color="#1565C0" />
                <Text style={styles.menuText}>Help & Support</Text>
                <Icon name="chevron-forward" size={moderateScale(18)} color="#CCC" />
            </TouchableOpacity>
        </View>

        {/* Logout Button at the bottom */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out-outline" size={moderateScale(22)} color="#FF5252" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  header: {
    height: verticalScale(60),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(15),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: moderateScale(5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  scrollContent: {
    padding: moderateScale(20),
    paddingBottom: verticalScale(40),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(25),
    alignItems: 'center',
    marginBottom: verticalScale(20),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  avatarLarge: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 3,
    borderColor: '#E3F0FF',
    marginBottom: verticalScale(15),
  },
  avatarPlaceholder: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  nameText: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  emailText: {
    fontSize: moderateScale(14),
    color: '#888',
    marginTop: verticalScale(5),
  },
  editBtn: {
    marginTop: verticalScale(15),
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(8),
    backgroundColor: '#E3F0FF',
    borderRadius: moderateScale(20),
  },
  editBtnText: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: moderateScale(13),
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(15),
    padding: moderateScale(15),
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: verticalScale(15),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  infoIconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(10),
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(15),
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: '#AAA',
  },
  infoValue: {
    fontSize: moderateScale(15),
    color: '#333',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    flex: 1,
    marginLeft: horizontalScale(15),
    fontSize: moderateScale(15),
    color: '#333',
  },
  logoutBtn: {
    backgroundColor: '#FFEAEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(15),
    borderRadius: moderateScale(15),
    marginTop: verticalScale(10),
  },
  logoutBtnText: {
    color: '#FF5252',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: horizontalScale(10),
  },
  versionText: {
    textAlign: 'center',
    color: '#CCC',
    marginTop: verticalScale(20),
    fontSize: moderateScale(12),
  },
});

export default ProfileScreen;
