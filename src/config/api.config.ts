import { Platform } from 'react-native';

export const API_CONFIG = {
    BASE_URL: Platform.OS === 'android' ? 'http://192.168.68.117:5000' : 'http://localhost:5000',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/user/login',
            REGISTER: '/api/user',
        },
        USER: {
            LIST: '/api/user',
        }
    }
};
