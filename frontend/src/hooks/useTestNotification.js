// TEMPORARY TEST FILE - DELETE AFTER TESTING
// This will help us understand what's happening

import { useEffect } from 'react';
import useNotificationSound from './useNotificationSound';

export const useTestNotification = () => {
    const playNotification = useNotificationSound();

    useEffect(() => {
        console.log('🧪 TEST: Setting up test notification every 5 seconds');

        let count = 0;
        const testInterval = setInterval(() => {
            count++;
            console.log(`🧪 TEST ${count}: Playing notification sound...`);
            playNotification();
        }, 5000); // Every 5 seconds

        return () => clearInterval(testInterval);
    }, [playNotification]);
};

export default useTestNotification;
