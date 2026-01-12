// notificationAudio.ts

type SoundMap = Record<string, string>;

/**
 * Notification sound sources
 * NOTE:
 * - These base64 sounds are VALID short WAV placeholders
 * - Replace any premium sound with higher-quality WAV/MP3 later if desired
 */
export const NOTIFICATION_SOUNDS: SoundMap = {
    'achievement': '/Notification bells/mixkit-achievement-bell-600.wav',
    'bell-933': '/Notification bells/mixkit-bell-notification-933.wav',
    'cooking-ding': '/Notification bells/mixkit-cooking-bell-ding-1791.wav',
    'cowbell': '/Notification bells/mixkit-cowbell-sharp-hit-1743.wav',
    'happy-bells': '/Notification bells/mixkit-happy-bells-notification-937.wav',
    'service-bell': '/Notification bells/mixkit-service-bell-931.wav',
    'typewriter-bell': '/Notification bells/mixkit-typewriter-return-bell-1368.wav',
    'uplifting-bells': '/Notification bells/mixkit-uplifting-bells-notification-938.wav',
};

/**
 * Audio cache to prevent recreation on every play
 */
const audioCache: Record<string, HTMLAudioElement> = {};

const getAudio = (key: string, src: string) => {
    if (!audioCache[key]) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.8;
        audioCache[key] = audio;
    }

    // Allow rapid consecutive plays
    audioCache[key].currentTime = 0;
    return audioCache[key];
};

/**
 * Play notification sound directly
 */
export const playNotificationSound = (effect: string = 'bell-933', customSrc?: string) => {
    try {
        const src = customSrc || NOTIFICATION_SOUNDS[effect] || NOTIFICATION_SOUNDS['bell-933'];
        const audio = getAudio(customSrc ? 'custom' : effect, src);

        audio.play().catch(err => {
            // Browser autoplay restrictions
            console.warn('Audio playback blocked:', err);
        });
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};

/**
 * Play notification sound respecting user settings
 */
export const playNotificationWithSettings = (userId: string) => {
    try {
        const stored = localStorage.getItem(`user_settings_${userId}`);

        if (!stored) {
            playNotificationSound('bell-933');
            return;
        }

        const settings = JSON.parse(stored);

        if (
            settings.notification_enabled !== false &&
            settings.sound_enabled !== false
        ) {
            // Check for custom user-uploaded sound first
            if (settings.custom_sound_data) {
                playNotificationSound('custom', settings.custom_sound_data);
            } else {
                playNotificationSound(settings.sound_effect || 'bell-933');
            }
        }
    } catch (error) {
        console.error('Error playing sound with settings:', error);
        playNotificationSound('bell-933');
    }
};
