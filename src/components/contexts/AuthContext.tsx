import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  setWebSocketAccessToken,
} from "../../services/websocketServices";
import axiosInstance from "../../utils/axiosConfig";


interface AuthContextType {
  isConnected: boolean;
  connectToWebSocket: () => void;
  disconnectFromWebSocket: () => void;
  loginWithPhone: (phoneNumber: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  // const userPhoneNumber = localStorage.getItem('userPhoneNumber');

  const connectToWebSocket = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.error('Access token not found. Cannot connect to WebSocket.');
      return;
    }
    setWebSocketAccessToken(accessToken); // Pass token to WebSocket service
    
    // const websocketUrl = `ws://localhost:8000/ws/analysis-progress/?token=${accessToken}`;
    const websocketUrl = `wss://api.supersami.com/ws/analysis-progress/?token=${accessToken}`;
    
    connectWebSocket(websocketUrl)
      .then(() => {
        setIsConnected(true);
        console.log("WebSocket connected successfully");
      })
      .catch((error) => {
        console.error("Failed to connect WebSocket:", error);
      });
  };

  const disconnectFromWebSocket = () => {
    disconnectWebSocket();
    setIsConnected(false);
  };

  const loginWithPhone = async (phoneNumber: string) => {
    try {
      const response = await axiosInstance.post('/api/auth/authenticate-phone/', { phone_number: phoneNumber });
      const { access, refresh, message } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      console.log(message);
      connectToWebSocket(); // Connect WebSocket after login
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithToken = async (token: string) => {
    try {
      const response = await axiosInstance.post('/api/auth/authenticate-token/', { token });
      const { access, refresh, message } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      console.log(message);
      connectToWebSocket(); // Connect WebSocket after authentication
    } catch (error) {
      console.error('Authentication with token failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout/'); // Implement logout endpoint in backend
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      disconnectFromWebSocket();
      // Optionally, redirect to login page
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      connectToWebSocket();
    }
    return () => {
      disconnectFromWebSocket();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isConnected,
        connectToWebSocket,
        disconnectFromWebSocket,
        loginWithPhone,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthContext };
