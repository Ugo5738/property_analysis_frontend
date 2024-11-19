import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
} from "../../services/websocketServices";

interface AuthContextType {
  isConnected: boolean;
  connectToWebSocket: () => void;
  disconnectFromWebSocket: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const userPhoneNumber = localStorage.getItem('userPhoneNumber');

  const connectToWebSocket = () => {
    if (!userPhoneNumber) {
      // Handle missing phone number (e.g., redirect to input page)
      return;
    }
    // Remove the '+' sign from the phone number
    const sanitizedPhoneNumber = userPhoneNumber.replace('+', '');
    // const websocketUrl = `ws://localhost:8000/analysis-progress/${userPhoneNumber}`;
    const websocketUrl = `wss://3.238.8.99/ws/analysis-progress/${sanitizedPhoneNumber}/`;

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
    connectToWebSocket();
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
