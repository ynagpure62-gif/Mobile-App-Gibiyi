import {
  Inter_400Regular,
  // Regular weight for the Inter font
  Inter_500Medium,
  // Medium weight for the Inter font
  Inter_600SemiBold,
  // Semi-bold weight for the Inter font
  Inter_700Bold,
  // Bold weight for the Inter font
  useFonts,
  // A hook to load custom fonts into the app
} from "@expo-google-fonts/inter";
// End of font imports

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Import React Query to manage and cache data from the server
import { Stack, useRouter, useSegments } from "expo-router";
// Import navigation tools to switch between screens and track the current page
import * as SplashScreen from "expo-splash-screen";
// Import a tool to keep the splash screen visible while the app loads
import React, { useEffect, useState } from "react";
// Import React and hooks for managing state and side effects
import { GestureHandlerRootView } from "react-native-gesture-handler";
// Import a wrapper for handling touch gestures across the app
import { KeyboardProvider } from "react-native-keyboard-controller";
// Import a tool to manage how the app responds when the keyboard opens
import { SafeAreaProvider } from "react-native-safe-area-context";
// Import a tool to handle screen notches and bottom bars
import { Platform } from "react-native";
// Import Platform to check if we are on Web, iOS, or Android
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
// Import functions to configure the API client's address and security tokens
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Import a safety wrapper that catches app crashes and shows a nice error page
import { CartProvider } from "@/contexts/CartContext";
// Import a tool to share shopping cart data across the whole app
import { supabase } from "@/lib/supabase";
// Import the Supabase client for database and user login
import { Session } from "@supabase/supabase-js";
// Import the type definition for a user's login session

SplashScreen.preventAutoHideAsync();
// Tell the app not to hide the splash screen yet; we will hide it manually later

const queryClient = new QueryClient({
  // Create a new client to handle server data requests
  defaultOptions: {
    // Set some default rules for all data requests
    queries: {
      // Rules for fetching data
      staleTime: 1000 * 60 * 5, // 5 minutes tak data cache rahega
      // Keep data fresh in memory for 5 minutes
      gcTime: 1000 * 60 * 30,    // 30 minutes tak memory mein rahega
      // Keep data in memory for 30 minutes before cleaning up
    },
    // End of queries config
  },
  // End of default options
});
// End of QueryClient setup

const getBaseUrl = () => {
  // A function to determine the server's web address
  let domain = process.env.EXPO_PUBLIC_DOMAIN || "localhost:8080";
  // Get the domain from settings, or use a default one
  if (Platform.OS === "android" && domain.includes("localhost")) {
    // If on Android emulator and using localhost
    domain = domain.replace("localhost", "10.0.2.2");
    // Use the special IP address that allows the emulator to talk to the computer
  }
  // End of Android check
  return domain.includes("localhost") || domain.includes("10.0.2.2")
    // Check if we are in a development mode
    ? `http://${domain}`
    // Use http for local development
    : `https://${domain}`;
    // Use https for real servers
};
// End of getBaseUrl function

setBaseUrl(getBaseUrl());
// Set the API client to use the calculated server address

// Configure the API client to use the Supabase session token
setAuthTokenGetter(async () => {
  // Tell the API client how to get the login token for requests
  const { data } = await supabase.auth.getSession();
  // Fetch the current login session from Supabase
  return data.session?.access_token || null;
  // Return the secret token if the user is logged in, or null if not
});
// End of token getter setup

export default function RootLayout() {
  // The main layout component that wraps the entire app
  const [session, setSession] = useState<Session | null>(null);
  // Create state to hold the current user's login session
  const [authInitialized, setAuthInitialized] = useState(false);
  // Create state to track if we have finished checking the user's login status
  const segments = useSegments();
  // Get an array of the current URL path parts
  const router = useRouter();
  // Get the router instance to change screens

  const [fontsLoaded, fontError] = useFonts({
    // Load the custom Inter font family
    Inter_400Regular,
    // Load regular font
    Inter_500Medium,
    // Load medium font
    Inter_600SemiBold,
    // Load semi-bold font
    Inter_700Bold,
    // Load bold font
  });
  // End of font loading

  useEffect(() => {
    // A function that runs once when the app starts
    // Check initial session with error handling
    supabase.auth.getSession()
      // Ask Supabase if there is a user already logged in
      .then(({ data: { session } }) => {
        // If the check finishes successfully
        setSession(session);
        // Save the user's session in our state
      })
      // End of success handler
      .catch((err) => {
        // If there is an error during the login check
        console.error("Auth initialization error:", err);
        // Log the error to the console
      })
      // End of error handler
      .finally(() => {
        // After either success or error
        setAuthInitialized(true);
        // Mark the authentication check as finished
      });
      // End of session check

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Set up a listener for when the user logs in or out
      setSession(session);
      // Update the session state whenever it changes
      
      // Clear cache on sign in/out to ensure fresh data for the user
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        // If the user's login status changed
        queryClient.clear();
        // Clear all cached data to prevent seeing another user's info
      }
      // End of cache clear check

      if (event === "PASSWORD_RECOVERY") {
        // If the user is trying to reset their password
        router.replace("/(auth)/reset-password");
        // Send them to the password reset screen
      }
      // End of password recovery check
    });
    // End of auth listener setup

    return () => subscription.unsubscribe();
    // Stop listening for changes when this layout is destroyed
  }, []);
  // Empty dependency array means this only runs once

  useEffect(() => {
    // A function that runs whenever the session or screen changes
    if (!authInitialized) return;
    // Do nothing until we have finished checking if the user is logged in

    const inAuthGroup = segments[0] === "(auth)";
    // Check if the user is currently on a login or signup screen
    const isResettingPassword = segments[1] === "reset-password";
    // Check if the user is currently on the password reset screen

    // Only redirect if the router is qualified
    if (!session && !inAuthGroup) {
      // If the user is NOT logged in and is NOT on a login screen
      router.replace("/(auth)/sign-in");
      // Send them to the sign-in screen
    } else if (session && inAuthGroup && !isResettingPassword) {
      // If the user IS logged in but is still on a login screen
      router.replace("/(tabs)");
      // Send them to the main app dashboard
    }
    // End of redirection logic
  }, [session, segments, authInitialized]);
  // Re-run this whenever session, segments, or initialization status changes

  useEffect(() => {
    // A function to hide the splash screen when ready
    if ((fontsLoaded || fontError) && authInitialized) {
      // If fonts are loaded (or failed) and login check is done
      SplashScreen.hideAsync();
      // Finally hide the splash screen and show the app
    }
    // End of splash hide check
  }, [fontsLoaded, fontError, authInitialized]);
  // Re-run when fonts or login check status changes

  // if (!fontsLoaded && !fontError) return null;
  // If auth fails to initialize for some reason, we still want to show the UI
  // so the user can at least see the ErrorBoundary or Login screen.

  const content = (
    // Define the main content of the app (the screen stacks)
    <Stack screenOptions={{ headerShown: false }}>
      {/* Configure navigation with a stack of screens, and hide the top headers */}
      <Stack.Screen name="(tabs)" />
      {/* The main dashboard screens with bottom tabs */}
      <Stack.Screen name="(auth)" />
      {/* The login, signup, and forgot password screens */}
      <Stack.Screen
        name="product/[id]"
        // The screen for viewing a specific product's details
        options={{ headerShown: false, presentation: "card" }}
        // Show as a regular card slide
      />
      {/* End of product screen */}
      <Stack.Screen
        name="checkout"
        // The screen for making a purchase
        options={{ headerShown: false, presentation: "modal" }}
        // Show as a modal popup from the bottom
      />
      {/* End of checkout screen */}
      <Stack.Screen
        name="orders"
        // The screen for viewing order history
        options={{ headerShown: false }}
        // Hide the top header
      />
      {/* End of orders screen */}
      <Stack.Screen
        name="wishlist"
        // The screen for viewing saved items
        options={{ headerShown: false }}
        // Hide the top header
      />
      {/* End of wishlist screen */}
    </Stack>
    // End of Stack
  );
  // End of content definition

  return (
    // Return the final UI structure
    <SafeAreaProvider>
      {/* Wrap everything to handle screen notches and safe areas */}
      <ErrorBoundary>
        {/* Wrap everything to catch crashes and show an error screen */}
        <QueryClientProvider client={queryClient}>
          {/* Provide the data fetching client to the whole app */}
          <CartProvider>
            {/* Provide the shopping cart data to the whole app */}
            <GestureHandlerRootView style={{ flex: 1 }}>
              {/* Enable touch gestures like swiping and dragging */}
              {Platform.OS === "web" ? (
                // If we are on the web
                content
                // Just show the content
              ) : (
                // If we are on mobile
                <KeyboardProvider>{content}</KeyboardProvider>
                // Wrap content with a keyboard manager for mobile devices
              )}
              {/* End of platform check */}
            </GestureHandlerRootView>
            {/* End of GestureHandler */}
          </CartProvider>
          {/* End of CartProvider */}
        </QueryClientProvider>
        {/* End of QueryClientProvider */}
      </ErrorBoundary>
      {/* End of ErrorBoundary */}
    </SafeAreaProvider>
    // End of SafeAreaProvider
  );
  // End of return
}
// End of RootLayout function

