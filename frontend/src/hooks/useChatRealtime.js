import { useContext } from 'react';
import ChatRealtimeContext from '../contexts/ChatRealtimeContext';

function useChatRealtime() {
    const context = useContext(ChatRealtimeContext);

    if (context === undefined) {
        throw new Error(
            'useChatRealtime phải được sử dụng bên trong ChatRealtimeProvider.',
        );
    }

    return context;
}

export default useChatRealtime;
