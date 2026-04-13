import { Platform } from 'react-native';
import { API_CONFIG } from '../src/config/api.config';
import apiClient from './apiClient';

/**
 * All User Related Endpoints
 */
export const registerUser = async (userData: any): Promise<any> => {
    return await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData, {
        headers: {
            'ngrok-skip-browser-warning': 'true',
        }
    });
};

export const loginUser = async (credentials: any): Promise<any> => {
    return await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
};

export const fetchUsers = async (search = ""): Promise<any> => {
    return await apiClient.get(`${API_CONFIG.ENDPOINTS.USER.LIST}?search=${search}`);
};

/**
 * Upload Image to PHP/Laravel Backend
 */
export const uploadImage = async (imageUri: string, fileName: string, mimeType: string): Promise<any> => {
    const formData = new FormData();
    
    // React Native specific FormData structure
    formData.append('image', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        type: mimeType || 'image/jpeg',
        name: fileName || `upload_${Date.now()}.jpg`,
    } as any);

    try {
        const uploadUrl = API_CONFIG.UPLOAD_URL;
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                // IMPORTANT: Do NOT set Content-Type header manually for FormData
            },
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || result.error || 'Upload failed');
        }

        return result;
    } catch (error) {
        console.error("Upload Error:", error);
        throw error;
    }
};
