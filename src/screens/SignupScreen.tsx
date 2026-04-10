import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';
import BackButton from '../components/shared/BackButton';
import { useAppDispatch } from '../hooks/reduxHooks';
import { setUser, setLoading, User } from '../store/slices/userSlice';
import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat';

type Props = {
  onNavigate: (screen: Screen, params?: any) => void;
};

const SignupScreen: React.FC<Props> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));
    try {
      const auth = getAuth();
      const db = getFirestore();

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // 2. Store additional data in Firestore
      const userData: User = {
        uid,
        name,
        email,
        createdAt: serverTimestamp() as any,
      };

      await setDoc(doc(db, 'users', uid), userData);

      // 3. Update Redux Store
      dispatch(setUser(userData));
      dispatch(setLoading(false));
      setIsLoading(false);

      Alert.alert('Success', 'Account created successfully!');
      onNavigate('Home');
    } catch (error: any) {
      console.error('SIGNUP_ERROR:', error);
      setIsLoading(false);
      dispatch(setLoading(false));

      let msg = 'Registration failed.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'That email address is already in use!';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'That email address is invalid!';
      } else if (error.message) {
        msg = error.message;
      }

      Alert.alert('Registration Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.backBtnContainer}>
          <BackButton onPress={() => onNavigate('Login')} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and stay connected with your friends</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Full Name"
            icon="person-outline"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <CustomInput
            label="Email"
            icon="mail-outline"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <CustomInput
            label="Confirm Password"
            icon="shield-checkmark-outline"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>

          <CustomButton
            title="Create Account"
            onPress={handleSignup}
            isLoading={isLoading}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { padding: moderateScale(30), flexGrow: 1 },
  backBtnContainer: {
    marginBottom: verticalScale(24),
    alignSelf: 'flex-start',
  },
  header: { marginBottom: verticalScale(32) },
  title: { fontSize: moderateScale(32), fontWeight: 'bold', color: '#1A1A2E' },
  subtitle: {
    fontSize: moderateScale(15),
    color: '#888',
    marginTop: verticalScale(6),
    lineHeight: moderateScale(22)
  },
  form: { width: '100%' },
  termsText: {
    fontSize: moderateScale(13),
    color: '#AAA',
    marginVertical: verticalScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20)
  },
  termsLink: { color: '#1565C0', fontWeight: '600' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(28),
    marginBottom: verticalScale(20)
  },
  footerText: {
    color: '#888',
    fontSize: moderateScale(15)
  },
  linkText: {
    color: '#1565C0',
    fontSize: moderateScale(15),
    fontWeight: 'bold'
  },
});

export default SignupScreen;
