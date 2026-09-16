import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Supabase redirects invite/password-reset links to the app's Site URL with
// #access_token=...&type=invite (or type=recovery) in the URL hash. The
// Supabase client (detectSessionInUrl: true) consumes and strips that hash
// almost immediately, so we capture the flow type here, before anything
// else runs, and stash it for the router to read.
const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
const flowType = hashParams.get('type');
if (flowType === 'invite' || flowType === 'recovery') {
  sessionStorage.setItem('auraed_auth_flow', flowType);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
