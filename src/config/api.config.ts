import { Platform } from 'react-native';

// Using localhost with 'adb reverse' via USB is the MOST stable way
const DEV_HOST = "localhost"; 
const PORT = "8000";
const API_PORT = "5000";

export const API_CONFIG = {
    // Both now use localhost because of adb reverse
    BASE_URL: `http://${DEV_HOST}:${API_PORT}`, 
    UPLOAD_URL: `http://${DEV_HOST}:${PORT}/upload-image`,

    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/user/login',
            REGISTER: '/api/user',
        },
        USER: {
            LIST: '/api/user',
        },
        // We use the full URL above or construct it here
        UPLOAD: '/upload-image',
    },
};
