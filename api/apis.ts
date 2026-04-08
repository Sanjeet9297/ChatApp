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
