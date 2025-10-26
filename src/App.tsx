// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense } from 'react';
import NostrProvider from '@/components/NostrProvider';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { NWCProvider } from '@/contexts/NWCContext';
import { DMProvider, type DMConfig } from '@/contexts/DMContext';
import { AppConfig } from '@/contexts/AppContext';
import { PROTOCOL_MODE } from '@/lib/dmConstants';
import AppRouter from './AppRouter';

const head = createHead({
  plugins: [
    InferSeoMetaPlugin(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  theme: "light",
  relayUrl: "wss://relay.ditto.pub",
};

const presetRelays = [
  { url: 'wss://relay.ditto.pub', name: 'Ditto' },
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://relay.primal.net', name: 'Primal' },
];

const dmConfig: DMConfig = {
  // Enable or disable DMs entirely
  enabled: true, // Set to false to completely disable messaging functionality
  
  // Choose one protocol mode:
  // PROTOCOL_MODE.NIP04_ONLY - Force NIP-04 (legacy) only
  // PROTOCOL_MODE.NIP17_ONLY - Force NIP-17 (private) only
  // PROTOCOL_MODE.NIP04_OR_NIP17 - Allow users to choose between NIP-04 and NIP-17 (defaults to NIP-17)
  protocolMode: PROTOCOL_MODE.NIP04_OR_NIP17,
};

export function App() {
  return (
    <UnheadProvider head={head}>
      <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig} presetRelays={presetRelays}>
        <QueryClientProvider client={queryClient}>
          <NostrLoginProvider storageKey='nostr:login'>
            <NostrProvider>
              <NWCProvider>
                <DMProvider config={dmConfig}>
                  <TooltipProvider>
                    <Toaster />
                    <Suspense>
                      <AppRouter />
                    </Suspense>
                  </TooltipProvider>
                </DMProvider>
              </NWCProvider>
            </NostrProvider>
          </NostrLoginProvider>
        </QueryClientProvider>
      </AppProvider>
    </UnheadProvider>
  );
}

export default App;
