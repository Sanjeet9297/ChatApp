import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../utils/scaling';

interface BackButtonProps {
  onPress: () => void;
  color?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, color = '#1565C0' }) => {
  const handlePress = () => {
    console.log('Back pressed');
    onPress();
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handlePress} 
      activeOpacity={0.7}
    >
      <Icon name="arrow-back" size={moderateScale(28)} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BackButton;
