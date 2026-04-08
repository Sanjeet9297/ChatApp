import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  isLoading,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1565C0',
    height: verticalScale(55),
    borderRadius: moderateScale(15),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    marginTop: verticalScale(10),
  },
  text: {
    color: '#FFFFFF',
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    letterSpacing: horizontalScale(0.5),
  },
});

export default CustomButton;
