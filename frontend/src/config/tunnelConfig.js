/**
 * Tunnel Configuration
 * Automatically detects and uses the current ngrok or cloudflared URL
 * This makes the app portable across different PCs and tunnel restarts
 */

// Manual ngrok URL - Update this if auto-detection fails
// Leave empty for auto-detection
const MANUAL_NGROK_URL = 'https://nine-loops-report.loca.lt';

// Function to get the current public URL from ngrok API
export const getNgrokUrl = async () => {
    // If manual URL is set, use it
    if (MANUAL_NGROK_URL) {
        console.log('✅ Using manual ngrok URL:', MANUAL_NGROK_URL);
        return MANUAL_NGROK_URL;
    }

    try {
        // Try to fetch from ngrok API
        const response = await fetch('http://localhost:4040/api/tunnels', {
            method: 'GET',
            mode: 'cors',
        });

        const data = await response.json();
        const httpsTunnel = data.tunnels.find(tunnel => tunnel.proto === 'https');

        if (httpsTunnel && httpsTunnel.public_url) {
            console.log('✅ Ngrok URL auto-detected:', httpsTunnel.public_url);
            // Store in sessionStorage for reuse
            sessionStorage.setItem('ngrokUrl', httpsTunnel.public_url);
            return httpsTunnel.public_url;
        }
    } catch (error) {
        console.warn('⚠️ Ngrok API not accessible (CORS or not running):', error.message);

        // Try to get from sessionStorage as fallback
        const cachedUrl = sessionStorage.getItem('ngrokUrl');
        if (cachedUrl) {
            console.log('ℹ️ Using cached ngrok URL:', cachedUrl);
            return cachedUrl;
        }
    }
    return null;
};

// Function to get the public URL (ngrok or fallback to current window location)
export const getPublicUrl = async () => {
    // Try to get ngrok URL first
    const ngrokUrl = await getNgrokUrl();
    if (ngrokUrl) {
        return ngrokUrl;
    }

    // Fallback to current window location (for local testing or deployed apps)
    const fallbackUrl = `${window.location.protocol}//${window.location.host}`;
    console.log('ℹ️ Using fallback URL (localhost):', fallbackUrl);
    return fallbackUrl;
};

// Generate QR code URL for student evaluation
export const generateQRCodeUrl = async (qrToken) => {
    const baseUrl = await getPublicUrl();
    const fullUrl = `${baseUrl}/public/student/${qrToken}`;
    console.log('🔗 Generated QR Code URL:', fullUrl);
    return fullUrl;
};

// Helper function to manually set ngrok URL (can be called from browser console)
export const setNgrokUrl = (url) => {
    sessionStorage.setItem('ngrokUrl', url);
    console.log('✅ Ngrok URL manually set:', url);
    window.location.reload();
};

export default {
    getNgrokUrl,
    getPublicUrl,
    generateQRCodeUrl,
    setNgrokUrl
};
