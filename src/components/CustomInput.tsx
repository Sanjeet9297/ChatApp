import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';

interface CustomInputProps extends TextInputProps {
  label: string;
  icon: string;
}

const CustomInput: React.FC<CustomInputProps> = ({ label, icon, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Icon name={icon} size={moderateScale(20)} color="#1565C0" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#AAA"
          {...props} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(18),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(8),
    marginLeft: horizontalScale(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E3F0FF',
    paddingHorizontal: horizontalScale(15),
    height: verticalScale(55),
  },
  icon: {
    marginRight: horizontalScale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    color: '#333',
  },
});

export default CustomInput;
