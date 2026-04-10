import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { horizontalScale, verticalScale, moderateScale } from '../utils/scaling';

interface CustomInputProps extends TextInputProps {
  label: string;
  icon: string;
}

const CustomInput: React.FC<CustomInputProps> = ({ label, icon, secureTextEntry, ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const isPasswordField = secureTextEntry !== undefined;
  const secureText = isPasswordField ? !isPasswordVisible : undefined;
  const hasText = props.value !== undefined && props.value.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Icon name={icon} size={moderateScale(20)} color="#1565C0" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#AAA"
          secureTextEntry={secureText}
          {...props} 
        />
        {isPasswordField && hasText && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
            <Icon name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={moderateScale(20)} color="#AAA" />
          </TouchableOpacity>
        )}
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
  eyeIcon: {
    padding: moderateScale(5),
    marginLeft: horizontalScale(5),
  },
});

export default CustomInput;
