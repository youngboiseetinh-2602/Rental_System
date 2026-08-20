import { Client } from '@stomp/stompjs';
import { WEBSOCKET_URL } from '../constants/config';
import { getValidAccessToken } from './authService';

let stompClient = null;
let connectionPromise = null;
let resolveConnection = null;
let rejectConnection = null;

const subscriptionRegistry = new Map();
const connectionListeners = new Set();

function subscriptionEntries() {
    return Array.from(subscriptionRegistry.values())
        .flatMap((entries) => Array.from(entries));
}

function attachSubscription(client, entry) {
    if (
        client !== stompClient
        || !client.connected
        || !entry.active
        || entry.subscription
    ) {
        return;
    }

    entry.subscription = client.subscribe(entry.destination, entry.callback);
}

function resubscribe(client) {
    subscriptionEntries().forEach((entry) => {
        entry.subscription = null;
        attachSubscription(client, entry);
    });
}

function settleConnected(client) {
    if (client !== stompClient) return;

    resubscribe(client);
    connectionListeners.forEach((listener) => {
        try {
            listener();
        } catch (error) {
            console.error('Lỗi khi đồng bộ lại STOMP:', error);
        }
    });
    resolveConnection?.(client);
    connectionPromise = null;
    resolveConnection = null;
    rejectConnection = null;
}

function settleConnectionError(client, error) {
    if (client !== stompClient) return;

    rejectConnection?.(error);
    connectionPromise = null;
    resolveConnection = null;
    rejectConnection = null;
}

function createStompClient() {
    const client = new Client({
        brokerURL: WEBSOCKET_URL,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    client.beforeConnect = async () => {
        try {
            const token = await getValidAccessToken();
            client.connectHeaders = {
                Authorization: `Bearer ${token}`,
            };
        } catch (error) {
            settleConnectionError(client, error);
            if (client === stompClient) {
                stompClient = null;
            }
            client.deactivate().catch(() => {});
        }
    };
    client.onConnect = () => settleConnected(client);
    client.onStompError = (frame) => {
        const error = new Error(
            frame.headers.message || 'Máy chủ WebSocket từ chối kết nối.',
        );
        console.error('Lỗi STOMP:', error.message, frame.body);
        settleConnectionError(client, error);
    };
    client.onWebSocketClose = () => {
        if (client !== stompClient) return;
        subscriptionEntries().forEach((entry) => {
            entry.subscription = null;
        });
    };

    return client;
}

function waitUntilConnected(client) {
    if (client.connected) {
        return Promise.resolve(client);
    }

    if (!connectionPromise) {
        connectionPromise = new Promise((resolve, reject) => {
            resolveConnection = resolve;
            rejectConnection = reject;
        });
    }

    if (!client.active) {
        client.activate();
    }

    return connectionPromise;
}

export const getStompClient = async () => {
    if (!stompClient) {
        stompClient = createStompClient();
    }

    return waitUntilConnected(stompClient);
};

export function subscribeStomp(destination, callback) {
    const entry = {
        destination,
        callback,
        active: true,
        subscription: null,
    };
    const entries = subscriptionRegistry.get(destination) || new Set();
    entries.add(entry);
    subscriptionRegistry.set(destination, entries);

    getStompClient()
        .then((client) => attachSubscription(client, entry))
        .catch((error) => {
            console.error(`Không thể đăng ký STOMP ${destination}:`, error);
        });

    return () => {
        entry.active = false;
        entry.subscription?.unsubscribe();
        entry.subscription = null;
        entries.delete(entry);
        if (entries.size === 0) {
            subscriptionRegistry.delete(destination);
        }
    };
}

export function subscribeStompConnections(listener) {
    connectionListeners.add(listener);
    return () => connectionListeners.delete(listener);
}

export const disconnectStompClient = () => {
    const client = stompClient;
    stompClient = null;

    rejectConnection?.(new Error('Kết nối WebSocket đã đóng.'));
    connectionPromise = null;
    resolveConnection = null;
    rejectConnection = null;
    subscriptionEntries().forEach((entry) => {
        entry.subscription = null;
    });

    if (client) {
        return client.deactivate();
    }

    return Promise.resolve();
};
