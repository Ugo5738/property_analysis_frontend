let socket: WebSocket | null = null;
let connectedPromise: Promise<void> | null = null;

export const connectWebSocket = (url: string): Promise<void> => {
  if (connectedPromise) {
    return connectedPromise;
  }

  connectedPromise = new Promise((resolve, reject) => {
    socket = new WebSocket(url);

    socket.onopen = () => {
      // console.log('WebSocket connected');
      resolve();
    };

    socket.onclose = () => {
      // console.log('WebSocket disconnected');
      socket = null;
      connectedPromise = null;
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(error);
      connectedPromise = null;
    };
  });

  return connectedPromise;
};

export const disconnectWebSocket = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
};

export const isWebSocketConnected = (): boolean => {
  return socket !== null && socket.readyState === WebSocket.OPEN;
};

export const sendMessage = (message: object): void => {
  if (isWebSocketConnected()) {
    socket!.send(JSON.stringify(message));
  } else {
    console.error('WebSocket is not open');
    throw new Error('WebSocket is not open');
  }
};

export const onMessage = (callback: (message: any) => void): void => {
  if (socket) {
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        callback(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  } else {
    console.error('WebSocket is not initialized');
    throw new Error('WebSocket is not initialized');
  }
};
