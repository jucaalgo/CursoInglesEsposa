import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabase';

type ConnectionState = 'online' | 'offline' | 'checking';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cxkgdalprrmttsxudznw.supabase.co';

const ConnectionBanner: React.FC = () => {
    const [connection, setConnection] = useState<ConnectionState>('online');
    const [showBanner, setShowBanner] = useState(false);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        const handleOnline = () => { setConnection('online'); setTimeout(() => setShowBanner(false), 2000); };
        const handleOffline = () => { setConnection('offline'); setShowBanner(true); };

        // Periodic connectivity check (every 30s)
        const checkConnection = async () => {
            if (!navigator.onLine) {
                setConnection('offline');
                setShowBanner(true);
                return;
            }

            // Si el usuario no está autenticado, solo usa navigator.onLine para evitar 401
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setConnection('online');
                return;
            }

            try {
                setConnection('checking');
                const resp = await fetch(SUPABASE_URL + '/rest/v1/', {
                    method: 'HEAD',
                    cache: 'no-store',
                });
                setConnection(resp.ok ? 'online' : 'offline');
                if (!resp.ok) setShowBanner(true);
                else setTimeout(() => setShowBanner(false), 2000);
            } catch {
                setConnection('offline');
                setShowBanner(true);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const interval = setInterval(checkConnection, 30000);

        // Initial check
        checkConnection();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            const resp = await fetch(SUPABASE_URL + '/rest/v1/', {
                method: 'HEAD', cache: 'no-store',
            });
            if (resp.ok) {
                setConnection('online');
                setShowBanner(false);
            }
        } catch { /* still offline */ }
        setRetrying(false);
    };

    if (!showBanner) return null;

    const isOnline = connection === 'online';

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
                isOnline ? 'translate-y-0' : 'translate-y-0'
            }`}
        >
            <div
                className={`flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium ${
                    isOnline
                        ? 'bg-green-600/90 text-white'
                        : connection === 'checking'
                        ? 'bg-yellow-600/90 text-white'
                        : 'bg-red-600/90 text-white'
                }`}
            >
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
                            disabled={retrying}
                            className="ml-2 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                        >
                            {retrying ? '...' : 'Retry'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConnectionBanner;
