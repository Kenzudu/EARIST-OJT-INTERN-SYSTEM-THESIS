import { useRef, useCallback } from 'react';

/**
 * Custom hook for playing notification sounds
 * Usage: const playNotification = useNotificationSound();
 *        playNotification(); // Plays the sound
 */
export const useNotificationSound = () => {
    const audioRef = useRef(null);

    // Initialize audio on first use
    if (!audioRef.current) {
        audioRef.current = new Audio('/notification.wav');
        audioRef.current.preload = 'auto';
    }

    const playSound = useCallback(() => {
        console.log('🔇 Notification sound is disabled');

        // Sound disabled - no audio will play
        // if (audioRef.current) {
        //     // Reset to start if already playing
        //     audioRef.current.currentTime = 0;

        //     console.log('🔊 Audio element found, playing sound...');
        //     audioRef.current.play()
        //         .then(() => {
        //             console.log('✅ Notification sound played successfully!');
        //         })
        //         .catch(err => {
        //             console.error('❌ Could not play notification sound:', err);
        //             console.error('This might be due to browser autoplay policy. User needs to interact with page first.');
        //         });
        // } else {
        //     console.error('❌ Audio element not initialized!');
        // }
    }, []);

    return playSound;
};

export default useNotificationSound;
