import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import store from './src/store';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import UserListScreen from './src/screens/UserListScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CallScreen from './src/screens/CallScreen';

type Screen = 'Splash' | 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat' | 'Profile' | 'Call';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Splash');
  const [screenParams, setScreenParams] = useState<any>(null);

  const handleSplashFinish = () => {
    setCurrentScreen('Login');
  };

  const handleNavigate = (screen: Screen, params?: any) => {
    setScreenParams(params || null);
    setCurrentScreen(screen);
  };

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <View style={styles.container}>
          {currentScreen === 'Splash' && (
            <SplashScreen onFinish={handleSplashFinish} />
          )}
          {currentScreen === 'Login' && (
            <LoginScreen onNavigate={handleNavigate} />
          )}
          {currentScreen === 'Signup' && (
            <SignupScreen onNavigate={handleNavigate} />
          )}
          {currentScreen === 'Home' && (
            <HomeScreen onNavigate={handleNavigate} />
          )}
          {currentScreen === 'UserList' && (
            <UserListScreen onNavigate={handleNavigate} />
          )}
          {currentScreen === 'Chat' && (
            <ChatScreen onNavigate={handleNavigate} params={screenParams} />
          )}
          {currentScreen === 'Profile' && (
            <ProfileScreen onNavigate={handleNavigate} />
          )}
          {currentScreen === 'Call' && (
            <CallScreen onNavigate={handleNavigate} params={screenParams} />
          )}
        </View>
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
