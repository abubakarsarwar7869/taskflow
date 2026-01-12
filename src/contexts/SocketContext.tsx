import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { socketService } from '@/lib/socket';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const handleConnect = () => {
            setConnected(true);
            setSocket(socketService.getSocket());
        };

        const handleDisconnect = () => {
            setConnected(false);
            setSocket(null);
        };

        // Initial check
        const currentSocket = socketService.getSocket();
        if (currentSocket) {
            setSocket(currentSocket);
            setConnected(currentSocket.connected);
        }

        // Since socketService might not have the socket yet, we listen for events if possible
        // or just rely on the fact that AuthContext will trigger connections

        // We can't easily listen to internal events of socketService without adding listeners to its socket
        // So we'll poll or check periodically, or better, add event listeners to the socket once it exists
        const interval = setInterval(() => {
            const s = socketService.getSocket();
            if (s) {
                if (!socket) {
                    setSocket(s);
                    setConnected(s.connected);

                    s.on('connect', handleConnect);
                    s.on('disconnect', handleDisconnect);
                }
            } else if (socket) {
                setSocket(null);
                setConnected(false);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
            }
        };
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
