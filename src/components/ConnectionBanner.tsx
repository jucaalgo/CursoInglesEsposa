import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

type ConnectionState = 'online' | 'offline' | 'checking';

const ConnectionBanner: React.FC = () => {
    const [connection, setConnection] = useState<ConnectionState>('online');
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => { setConnection('online'); setTimeout(() => setShowBanner(false), 2000); };
        const handleOffline = () => { setConnection('offline'); setShowBanner(true); };

        const checkConnection = () => {
            if (navigator.onLine) {
                setConnection('online');
                setShowBanner(false);
            } else {
                setConnection('offline');
                setShowBanner(true);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const interval = setInterval(checkConnection, 30000);
        checkConnection();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const handleRetry = () => {
        setConnection('checking');
        setTimeout(() => {
            if (navigator.onLine) {
                setConnection('online');
                setShowBanner(false);
            } else {
                setConnection('offline');
            }
        }, 2000);
    };

    if (!showBanner) return null;

    const isOnline = connection === 'online';

    return (
        <div className="fixed top-0 left-0 right-0 z-[60]">
            <div className={`flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium ${
                isOnline
                    ? 'bg-green-600/90 text-white'
                    : connection === 'checking'
                    ? 'bg-yellow-600/90 text-white'
                    : 'bg-red-600/90 text-white'
            }`}>
                {isOnline ? (
                    <>
                        <Wifi className="w-4 h-4" />
                        <span>Connection restored</span>
                    </>
                ) : connection === 'checking' ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking connection...</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span>You're offline. Some features may be limited.</span>
                        <button
                            onClick={handleRetry}
                            className="ml-2 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            Retry
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConnectionBanner;
