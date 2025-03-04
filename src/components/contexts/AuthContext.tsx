import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  setWebSocketAccessToken,
} from "../../services/websocketServices";
import axiosInstance from "../../utils/axiosConfig";


interface User {
  id: number;
  email: string;
  phone: string;
  gmail_connected: boolean;
  // any other user properties…
}

interface AuthContextType {
  isConnected: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
    // const websocketUrl = `wss://api-test.supersami.com/ws/analysis-progress/?token=${accessToken}`;
    
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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axiosInstance.get("/api/auth/current-user/");
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, []);

  const loginWithPhone = async (phoneNumber: string) => {
    try {
      const response = await axiosInstance.post('/api/auth/authenticate-phone/', { phone_number: phoneNumber });
      const { access, refresh, message } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      console.log(message);
      // Optionally re-fetch the user after login
      const userResponse = await axiosInstance.get("/api/auth/current-user/");
      setCurrentUser(userResponse.data);
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
      console.log("Token login:", message);
      // Optionally re-fetch the user after login
      const userResponse = await axiosInstance.get("/api/auth/current-user/");
      setCurrentUser(userResponse.data);
      connectToWebSocket(); // Connect WebSocket after authentication
    } catch (error) {
      console.error('Authentication with token failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      await axiosInstance.post('/api/auth/logout/', { refresh: refreshToken });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      disconnectFromWebSocket();
      // Optionally, redirect to login page
      window.location.href = '/enter-phone';
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
        currentUser,
        setCurrentUser,
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
