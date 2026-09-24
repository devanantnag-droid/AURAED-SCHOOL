import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { supabase } from '@/lib/supabase';

export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';
export type BackendStatus = 'reachable' | 'unreachable' | 'checking';

export interface NetworkState {
  connected: boolean; // device reports a network interface is up
  connectionType: ConnectionType;
  backendStatus: BackendStatus; // whether Supabase itself actually responds
  lastCheckedAt: Date | null;
}

// A lightweight, short-timeout request against Supabase - this is what
// distinguishes "the phone thinks it's on wifi" from "the internet (and
// our backend specifically) is actually reachable", which the spec calls
// out explicitly: wifi-connected-but-no-internet must show as offline,
// not online.
async function pingBackend(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const { error } = await supabase.from('schools').select('id', { head: true, count: 'exact' }).limit(1).abortSignal(controller.signal);
    clearTimeout(timeout);
    return !error;
  } catch {
    return false;
  }
}

type Listener = (state: NetworkState) => void;

let currentState: NetworkState = {
  connected: true,
  connectionType: 'unknown',
  backendStatus: 'checking',
  lastCheckedAt: null,
};
const listeners = new Set<Listener>();
let initialized = false;

function notify() {
  listeners.forEach((l) => l(currentState));
}

async function refresh() {
  const status = await Network.getStatus();
  const connectionType: ConnectionType = status.connected
    ? status.connectionType === 'wifi'
      ? 'wifi'
      : status.connectionType === 'cellular'
        ? 'cellular'
        : 'unknown'
    : 'none';

  if (!status.connected) {
    currentState = { connected: false, connectionType: 'none', backendStatus: 'unreachable', lastCheckedAt: new Date() };
    notify();
    return;
  }

  currentState = { ...currentState, connected: true, connectionType, backendStatus: 'checking' };
  notify();

  const reachable = await pingBackend();
  currentState = { ...currentState, backendStatus: reachable ? 'reachable' : 'unreachable', lastCheckedAt: new Date() };
  notify();
}

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  refresh();
  Network.addListener('networkStatusChange', () => refresh());
  // Backend can go down (or come back) independent of the device's own
  // connectivity, so poll it periodically too, not just on network
  // interface changes.
  setInterval(refresh, 30_000);
}

export function retryNetworkCheck() {
  refresh();
}

export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(currentState);

  useEffect(() => {
    ensureInitialized();
    listeners.add(setState);
    setState(currentState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
