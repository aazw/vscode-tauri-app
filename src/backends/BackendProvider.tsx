import { createContext, useContext, ReactNode } from 'react';
import { AppBackend } from '../types/AppBackend';
import { NativeBackend } from './NativeBackend';
import { MockBackend } from './MockBackend';
import { WebBackend } from './WebBackend';

const BackendContext = createContext<AppBackend | null>(null);

interface BackendProviderProps {
  children: ReactNode;
  forceBackend?: 'native' | 'mock' | 'web';
}

function createBackend(type?: 'native' | 'mock' | 'web'): AppBackend {
  // Force specific backend if specified
  if (type === 'native') {
    return new NativeBackend();
  }
  if (type === 'mock') {
    return new MockBackend();
  }
  if (type === 'web') {
    return new WebBackend();
  }

  // Auto-detect environment
  const isTauri = typeof window !== 'undefined' && window.__TAURI__;
  
  if (isTauri) {
    return new NativeBackend();
  } else {
    // For web development, use WebBackend with SQLite
    return new WebBackend();
  }
}

export function BackendProvider({ children, forceBackend }: BackendProviderProps) {
  const backend = createBackend(forceBackend);

  return (
    <BackendContext.Provider value={backend}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend(): AppBackend {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
}

// Type augmentation for Tauri
declare global {
  interface Window {
    __TAURI__: any;
  }
}