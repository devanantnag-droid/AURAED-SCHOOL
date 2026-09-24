import { useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, RotateCw } from 'lucide-react';
import { useNetworkState, retryNetworkCheck } from '@/lib/networkStatus';

export function NetworkIndicator() {
  const state = useNetworkState();
  const [open, setOpen] = useState(false);

  const isFullyOnline = state.connected && state.backendStatus === 'reachable';
  const isServerIssue = state.connected && state.backendStatus === 'unreachable';

  const Icon = !state.connected ? WifiOff : isServerIssue ? AlertTriangle : Wifi;
  const color = isFullyOnline
    ? 'text-green-600 dark:text-green-400'
    : isServerIssue
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className={`rounded-md p-1.5 ${color}`} aria-label="Connection status">
        <Icon size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-16 z-50 rounded-md border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-72">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Connection status</p>

            <div className="mb-2 flex items-center gap-2 text-sm">
              <Icon size={16} className={color} />
              <span className={color}>
                {!state.connected ? 'Offline' : isServerIssue ? 'Server temporarily unavailable' : 'Online'}
              </span>
            </div>

            <p className="text-xs text-gray-500">
              Internet: {!state.connected ? 'Not available' : 'Available'}
              {state.connected && ` (${state.connectionType === 'wifi' ? 'Wi-Fi' : state.connectionType === 'cellular' ? 'Mobile data' : 'Connected'})`}
            </p>
            <p className="text-xs text-gray-500">
              Server: {state.backendStatus === 'checking' ? 'Checking…' : state.backendStatus === 'reachable' ? 'Reachable' : 'Not reachable'}
            </p>
            {state.lastCheckedAt && (
              <p className="mt-1 text-xs text-gray-400">Last checked: {state.lastCheckedAt.toLocaleTimeString()}</p>
            )}

            {!isFullyOnline && (
              <button
                onClick={() => retryNetworkCheck()}
                className="mt-3 flex items-center gap-1.5 rounded-md bg-primary-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-800"
              >
                <RotateCw size={13} />
                Retry
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
