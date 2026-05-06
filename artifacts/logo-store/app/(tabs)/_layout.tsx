import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";

export default function TabLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { itemCount } = useCart();
  const c = colors.dark;

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : c.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: c.border,
          elevation: 0,
          ...(isWeb ? { height: 60 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border }]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={22} />
            ) : (
              <Feather name="search" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: c.primary, fontSize: 10 },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bag" tintColor={color} size={22} />
            ) : (
              <Feather name="shopping-bag" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
