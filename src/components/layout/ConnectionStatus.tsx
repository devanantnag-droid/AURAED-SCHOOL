import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    function handleOnline() {
      setIsOnline(true);
      setShowBackOnline(true);
      hideTimer = setTimeout(() => setShowBackOnline(false), 3000);
    }
    function handleOffline() {
      setIsOnline(false);
      setShowBackOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-md">
        <WifiOff size={15} />
        You're offline — changes won't save until your connection is back.
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-md">
        <Wifi size={15} />
        Back online.
      </div>
    );
  }

  return null;
}
