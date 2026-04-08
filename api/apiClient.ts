import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import store, { RootState } from "../src/store";
import { clearStorage } from "../src/utils/asyncStorage";
import logger from "../src/utils/logger";
import { logoutUser } from "../src/utils/utils";
import { API_CONFIG } from "../src/config/api.config";
import Toast from "react-native-toast-message";

const apiInstance = (): AxiosInstance => {
    const api: AxiosInstance = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        // 30s timeout to avoid requests hanging indefinitely
        timeout: 30000,
        headers: {
            'ngrok-skip-browser-warning': 'true',
        },
    });

    // @ts-ignore - axiosRetry types can sometimes be finicky with different axios versions
    axiosRetry(api, { retries: 2 });

    api.interceptors.request.use(async (config: any) => {
        const state: RootState = store.getState();

        // Attempt to get token from user slice (user object contains the token)
        const accessToken = state.user?.user?.token;

        if (accessToken) {
            config.headers.authorization = `Bearer ${accessToken}`;
        } else {
            // Don't warn for public auth endpoints (login, signup, etc.)
            const publicEndpoints = [
                API_CONFIG.ENDPOINTS.AUTH.LOGIN,
                API_CONFIG.ENDPOINTS.AUTH.REGISTER,
            ];

            const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

            if (!isPublic && __DEV__) {
                console.warn("No access token found in store for request:", config.url);
            }
        }

        return config;
    });

    api.interceptors.response.use(
        (response: any) => {
            // logger.log("RESPONSE", response);
            return response.data;
        },
        (error: any) => {
            console.log("INTERCEPTOR ERROR:", error);

            // Network Error Handler
            if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
                console.log("NETWORK ERROR - Target:", API_CONFIG.BASE_URL);
                Toast.show({
                    type: "error",
                    text1: "Connection Failed",
                    text2: `Cannot reach ${API_CONFIG.BASE_URL}. Check your ngrok or internet.`,
                    visibilityTime: 6000,
                });
            }

            if (error.response) {
                console.log("SERVER ERROR STATUS:", error.response.status);
                console.log("SERVER ERROR DATA:", JSON.stringify(error.response.data, null, 2));
            }

            if (error.response?.data?.detail === "Invalid Token") {
                clearStorage();
            }

            // Handle session expiry — auto logout and redirect to login
            const msg = error.response?.data?.message ?? "";
            const isSessionExpired =
                msg === "Unauthorized" ||
                msg === "Token invalidated by logout, please login again" ||
                msg === "Token expired, please login again";

            if (isSessionExpired) {
                Toast.show({
                    type: "error",
                    text1: "Session Expired",
                    text2: "Please log in again to continue.",
                    visibilityTime: 3000,
                });
                setTimeout(() => {
                    logoutUser(store?.dispatch);
                }, 1500);
            }

            if (error.response?.data?.message) {
                error.message = error.response.data.message;
            } else if (typeof error.response?.data === 'string') {
                error.message = error.response.data;
            }

            logger.log("ERROR", error.message);
            throw error;
        }
    );

    return api;
};

const apiClient: AxiosInstance = apiInstance();

export default apiClient;
