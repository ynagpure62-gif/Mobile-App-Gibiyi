import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useCreateOrder, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";

export default function CheckoutScreen() {
  const router = useRouter();
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const { items, totalAmount, clearCart } = useCart();
  const qc = useQueryClient();

  const [success, setSuccess] = useState(false);
  const createOrder = useCreateOrder();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    createOrder.mutate(
      {
        data: {
          items: items.map((item) => ({ productId: item.id, price: item.price })),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          clearCart();
          setSuccess(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (err) => {
          console.error(err);
        },
      },
    );
  };

  if (success) {
    return (
      <View style={[styles.success, { backgroundColor: c.background }]}>
        <View style={[styles.successIcon, { backgroundColor: "#22C55E20", borderColor: "#22C55E44" }]}>
          <Feather name="check" size={40} color="#22C55E" />
        </View>
        <Text style={[styles.successTitle, { color: c.foreground }]}>Order Complete!</Text>
        <Text style={[styles.successText, { color: c.mutedForeground }]}>
          Your logos are ready to download. Check your order history for download links.
        </Text>
        <Pressable
          style={[styles.doneBtn, { backgroundColor: c.primary }]}
          onPress={() => {
            router.push("/orders" as any);
          }}
        >
          <Text style={styles.doneBtnText}>View Orders</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)/" as any)}>
          <Text style={[styles.homeLink, { color: c.mutedForeground }]}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.navBar, { paddingTop: topPadding + 8, backgroundColor: c.background }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={24} color={c.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: c.foreground }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 + 120 : insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Order Summary</Text>
        {items.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(index * 60)}
            style={[styles.orderItem, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: c.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.itemSub, { color: c.mutedForeground }]}>Digital Download</Text>
            </View>
            <Text style={[styles.itemPrice, { color: c.primary }]}>${item.price.toFixed(2)}</Text>
          </Animated.View>
        ))}

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: c.mutedForeground }]}>Subtotal</Text>
          <Text style={[styles.totalValue, { color: c.foreground }]}>${totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: c.mutedForeground }]}>Processing Fee</Text>
          <Text style={[styles.totalValue, { color: c.foreground }]}>$0.00</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.grandLabel, { color: c.foreground }]}>Total</Text>
          <Text style={[styles.grandValue, { color: c.primary }]}>${totalAmount.toFixed(2)}</Text>
        </View>

        <View style={[styles.secureNote, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="shield" size={16} color="#22C55E" />
          <Text style={[styles.secureText, { color: c.mutedForeground }]}>
            Secure checkout. Instant delivery after payment.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.background,
            borderTopColor: c.border,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16,
          },
        ]}
      >
        <Pressable
          style={[
            styles.purchaseBtn,
            { backgroundColor: c.primary, opacity: createOrder.isPending ? 0.7 : 1 },
          ]}
          onPress={handlePurchase}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Feather name="lock" size={18} color="#FFF" />
              <Text style={styles.purchaseBtnText}>
                Pay ${totalAmount.toFixed(2)}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  navTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  grandLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  grandValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  secureText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  purchaseBtn: {
    height: 56,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  purchaseBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  success: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  successText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  doneBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  doneBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  homeLink: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
