import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";

export default function CartScreen() {
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, removeItem, totalAmount, itemCount } = useCart();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (itemCount === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: c.background, paddingTop: topPadding + 40 }]}>
        <View style={[styles.emptyIcon, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="shopping-bag" size={36} color={c.mutedForeground} />
        </View>
        <Text style={[styles.emptyTitle, { color: c.foreground }]}>Cart is empty</Text>
        <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
          Browse logos and add them to your cart
        </Text>
        <Pressable
          style={[styles.browseBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push("/(tabs)/explore" as any)}
        >
          <Text style={styles.browseBtnText}>Browse Logos</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Cart</Text>
        <Text style={[styles.count, { color: c.mutedForeground }]}>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 + 200 : insets.bottom + 200 },
        ]}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60)}>
            <View style={[styles.cartItem, { backgroundColor: c.card, borderColor: c.border }]}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: c.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.itemSubtitle, { color: c.mutedForeground }]}>
                  Digital Download
                </Text>
                <Text style={[styles.itemPrice, { color: c.primary }]}>
                  ${item.price.toFixed(2)}
                </Text>
              </View>
              <Pressable
                style={[styles.removeBtn, { backgroundColor: c.muted }]}
                onPress={() => {
                  removeItem(item.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather name="trash-2" size={16} color={c.destructive} />
              </Pressable>
            </View>
          </Animated.View>
        )}
      />

      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.background,
            borderTopColor: c.border,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90,
          },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: c.mutedForeground }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: c.foreground }]}>
            ${totalAmount.toFixed(2)}
          </Text>
        </View>
        <Pressable
          style={[styles.checkoutBtn, { backgroundColor: c.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/checkout" as any);
          }}
        >
          <Feather name="credit-card" size={18} color="#FFF" />
          <Text style={styles.checkoutBtnText}>Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    gap: 12,
    padding: 10,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  itemSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    gap: 14,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  checkoutBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  checkoutBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  browseBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  browseBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
