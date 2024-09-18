let socket: WebSocket | null = null;
let connectedPromise: Promise<void> | null = null;
const messageListeners: Array<(message: any) => void> = [];

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
      if (error instanceof Event) {
        console.error('Error details:', (error.target as WebSocket).url);
      }
      reject(error);
      connectedPromise = null;
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        messageListeners.forEach(callback => callback(message));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
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
  messageListeners.push(callback);
};

export const removeMessageListener = (callback: (message: any) => void): void => {
  const index = messageListeners.indexOf(callback);
  if (index !== -1) {
    messageListeners.splice(index, 1);
  }
};
