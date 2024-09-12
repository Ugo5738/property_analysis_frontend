import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();

  const connectToWebSocket = () => {
    // const websocketUrl = `ws://localhost:8000/ws/analysis-progress/`;
    const websocketUrl = `ws://3.238.8.99:8000/ws/analysis-progress/`;
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
  }, [location.pathname]);

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