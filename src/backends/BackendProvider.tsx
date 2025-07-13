import { createContext, useContext, ReactNode } from 'react';
import { AppBackend } from '../types/AppBackend';
import { NativeBackend } from './NativeBackend';
import { MockBackend } from './MockBackend';

const BackendContext = createContext<AppBackend | null>(null);

interface BackendProviderProps {
  children: ReactNode;
  forceBackend?: 'native' | 'mock';
}

function createBackend(type?: 'native' | 'mock'): AppBackend {
  // Force specific backend if specified
  if (type === 'native') {
    return new NativeBackend();
  }
  if (type === 'mock') {
    return new MockBackend();
  }

  // Auto-detect environment with multiple checks
  const isTauri = typeof window !== 'undefined' && (
    window.__TAURI__ || 
    (window as any).__TAURI_METADATA__ || 
    (window as any).__TAURI_PLUGIN_OPENER__ ||
    // Check for Tauri-specific APIs
    (window as any).__TAURI_INVOKE__
  );
  
  console.log('🔍 Environment detection:', {
    hasWindow: typeof window !== 'undefined',
    hasTauri: !!(window as any)?.__TAURI__,
    hasTauriMetadata: !!(window as any)?.__TAURI_METADATA__,
    hasTauriInvoke: !!(window as any).__TAURI_INVOKE__,
    isTauri
  });
  
  // Force NativeBackend for testing (temporary)
  const forceNative = true; // Set to true to force NativeBackend
  
  if (isTauri || forceNative) {
    console.log('✅ Using NativeBackend (Tauri environment detected or forced)');
    return new NativeBackend();
  } else {
    console.log('⚠️ Using MockBackend (Web environment detected)');
    return new MockBackend();
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