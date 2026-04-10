import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
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
import CallManager from './src/components/CallManager';

type Screen = 'Splash' | 'Login' | 'Signup' | 'Home' | 'UserList' | 'Chat' | 'Profile' | 'Call';

function App() {
  const [stack, setStack] = useState<Screen[]>(['Splash']);
  const [screenParams, setScreenParams] = useState<any>(null);

  const currentScreen = stack[stack.length - 1];

  useEffect(() => {
    const backAction = () => {
      // If we are on the 'root' screens (Splash, Login, Home), let the app exit
      if (stack.length <= 1 || currentScreen === 'Login' || currentScreen === 'Home') {
        return false; // False means "Don't intercept, proceed with default exit"
      }
      
      // Otherwise, go back one step
      handleBack();
      return true; // True means "We handled it, don't exit"
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [stack, currentScreen]);

  const handleSplashFinish = () => {
    setStack(['Login']);
  };

  const handleNavigate = (screen: Screen | 'BackToChat', params?: any) => {
    setScreenParams(params || null);
    
    // If going to Home or Login, we reset the stack for a fresh start
    if (screen === 'Home' || screen === 'Login') {
      setStack([screen]);
    } else if (screen === 'BackToChat') {
      setStack(prev => {
        const newStack = prev.filter(s => s !== 'Call');
        if (newStack[newStack.length - 1] !== 'Chat') {
          newStack.push('Chat');
        }
        return newStack;
      });
    } else {
      setStack(prev => [...prev, screen]);
    }
  };

  const handleBack = () => {
    if (stack.length > 1) {
      setStack(prev => prev.slice(0, -1));
    }
  };

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <CallManager onNavigate={handleNavigate}>
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
        </CallManager>
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
