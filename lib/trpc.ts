import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // If we're on web, use the origin
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Prioritize Explicit Environment Variable (often port 3000 for backend)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log('[tRPC] Using Environment Base URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    // If we're using Expo Router API routes, we hit Metro. 
    // But if we have a separate backend, we hit 4000.
    const isTunnel = host.includes('ngrok') || host.includes('expo.direct');
    const baseUrl = isTunnel ? `https://${host}` : `http://${host}:4000`; // Fallback to 4000 for separate backend
    console.log('[tRPC] Calculated Base URL (hostUri):', baseUrl);
    return baseUrl;
  }

  return 'http://localhost:4000';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
