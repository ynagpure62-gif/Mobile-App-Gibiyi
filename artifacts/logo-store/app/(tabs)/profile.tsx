import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetOrders } from "@workspace/api-client-react";
import colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

const MENU_ITEMS = [
  { icon: "package", label: "Order History", route: "/orders" },
  { icon: "heart", label: "Wishlist", route: "/wishlist" },
  { icon: "edit", label: "Custom Logo Design", route: "/custom-logo" },
];

export default function ProfileScreen() {
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { data: orders } = useGetOrders();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const totalSpent = orders?.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount as unknown as string),
    0,
  ) ?? 0;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in" as any);
  };

  const email = user?.email ?? "";
  const initials = email ? email[0].toUpperCase() : "U";
  const displayName = email ? email.split("@")[0] : "User";

  return (
    <ScrollView
      style={{ backgroundColor: c.background, flex: 1 }}
      contentContainerStyle={{
        paddingTop: topPadding + 16,
        paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: c.foreground }]}>
          {displayName}
        </Text>
        <Text style={[styles.email, { color: c.mutedForeground }]}>
          {email}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.statValue, { color: c.foreground }]}>
            {orders?.length ?? 0}
          </Text>
          <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Purchases</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.statValue, { color: c.foreground }]}>
            ₹{totalSpent.toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Total Spent</Text>
        </View>
      </View>

      <View style={[styles.menu, { backgroundColor: c.card, borderColor: c.border }]}>
        {MENU_ITEMS.map((item, idx) => (
          <Pressable
            key={item.route}
            style={[
              styles.menuItem,
              idx < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(item.route as any);
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: c.muted }]}>
              <Feather name={item.icon as any} size={18} color={c.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: c.foreground }]}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={c.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.signOutBtn, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleSignOut();
        }}
      >
        <Feather name="log-out" size={18} color={c.destructive} />
        <Text style={[styles.signOutText, { color: c.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  menu: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
