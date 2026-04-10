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
import { useAppDispatch } from '../hooks/reduxHooks';
import { setUser, setLoading, User } from '../store/slices/userSlice';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type Screen = 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat';

type Props = {
  onNavigate: (screen: Screen, params?: any) => void;
};

const LoginScreen: React.FC<Props> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const db = getFirestore();
  const auth = getAuth();

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '691761421299-iij6jnftdhp9gk7ukuncok1d6cteu5dr.apps.googleusercontent.com', // Get this from Firebase Console
    });
  }, []);

  const onGoogleButtonPress = async () => {
    try {
      setIsLoading(true);
      // 1. Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 2. Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) throw new Error('No ID token found');

      // 3. Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // 4. Sign-in the user with the credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      // 5. Check/Create user in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      let userData: User;
      if (!userDoc.exists()) {
        userData = {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          pic: user.photoURL || '',
          isOnline: true,
        };
        await setDoc(doc(db, 'users', user.uid), userData);
      } else {
        userData = userDoc.data() as User;
        await updateDoc(doc(db, 'users', user.uid), { isOnline: true });
      }

      dispatch(setUser(userData));
      onNavigate('Home');
    } catch (error: any) {
      console.error('GOOGLE_LOGIN_ERROR:', error);
      Alert.alert('Google Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));
    try {
      const auth = getAuth();
      const db = getFirestore();

      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // 2. Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;

        // 3. Save to Redux Store
        dispatch(setUser(userData));
        dispatch(setLoading(false));
        setIsLoading(false);

        onNavigate('Home');
      } else {
        throw new Error('User data not found in Firestore.');
      }
    } catch (error: any) {
      setIsLoading(false);
      dispatch(setLoading(false));
      console.error('LOGIN_ERROR:', error);

      let msg = 'Login failed.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'That email address is invalid!';
      } else if (error.message) {
        msg = error.message;
      }

      Alert.alert('Login Failed', msg);
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Icon name="chatbubbles" size={moderateScale(48)} color="#1565C0" />
          </View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue your conversations</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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

          <TouchableOpacity style={styles.forgotPass}>
            <Text style={styles.forgotPassText}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Login"
            onPress={handleLogin}
            isLoading={isLoading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={onGoogleButtonPress}>
              <Icon name="logo-google" size={moderateScale(24)} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Icon name="logo-facebook" size={moderateScale(24)} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Icon name="logo-apple" size={moderateScale(24)} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate('Signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: {
    padding: moderateScale(30),
    flexGrow: 1,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(36)
  },
  iconWrap: {
    width: horizontalScale(90),
    height: horizontalScale(90),
    borderRadius: horizontalScale(45),
    backgroundColor: '#E3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: '#1A1A2E'
  },
  subtitle: {
    fontSize: moderateScale(15),
    color: '#888',
    marginTop: verticalScale(6),
    textAlign: 'center'
  },
  form: { width: '100%' },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(6)
  },
  forgotPassText: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: moderateScale(14)
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(20)
  },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: {
    marginHorizontal: horizontalScale(12),
    color: '#AAA',
    fontSize: moderateScale(13)
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: horizontalScale(16)
  },
  socialBtn: {
    width: horizontalScale(58),
    height: horizontalScale(58),
    borderRadius: horizontalScale(29),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(30)
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

export default LoginScreen;
