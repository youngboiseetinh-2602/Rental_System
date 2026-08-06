import { Client } from '@stomp/stompjs';
import { WEBSOCKET_URL } from '../constants/config';
import { getValidAccessToken } from './authService';

let stompClient = null;

export const getStompClient = async () => {
    if (stompClient && stompClient.active) {
        return stompClient;
    }

    const token = await getValidAccessToken();

    stompClient = new Client({
        brokerURL: WEBSOCKET_URL,
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    return new Promise((resolve, reject) => {
        stompClient.onConnect = () => {
            resolve(stompClient);
        };
        stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
            reject(frame);
        };
        stompClient.activate();
    });
};

export const disconnectStompClient = () => {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }
};
