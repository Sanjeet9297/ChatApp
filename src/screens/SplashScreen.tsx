import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';

const LOGO_SIZE = verticalScale(180);

type Props = {
  onFinish: () => void;
};

const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Animatable.View animation="bounceIn" duration={1500} style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Icon name="chatbubbles" size={LOGO_SIZE / 2.2} color="#FFFFFF" />
        </View>
        <Animatable.Text animation="fadeInUp" delay={500} style={styles.appName}>
          Connectify
        </Animatable.Text>
        <Animatable.Text animation="fadeInUp" delay={800} style={styles.tagline}>
          Seamless Conversations, Simplified
        </Animatable.Text>
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={1200} style={styles.footer}>
        <Text style={styles.footerText}>Stay connected, stay close ✨</Text>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    borderWidth: moderateScale(2),
    borderColor: 'rgba(255,255,255,0.4)',
  },
  appName: {
    fontSize: moderateScale(42),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: verticalScale(2) },
    textShadowRadius: moderateScale(10),
  },
  tagline: {
    fontSize: moderateScale(13),
    color: 'rgba(255,255,255,0.85)',
    marginTop: verticalScale(10),
    letterSpacing: horizontalScale(1.5),
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: verticalScale(40),
  },
  footerText: {
    fontSize: moderateScale(13),
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
});

export default SplashScreen;
