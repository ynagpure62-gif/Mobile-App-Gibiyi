import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetProduct,
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const { addItem, isInCart } = useCart();
  const qc = useQueryClient();

  const productId = parseInt(id as string);
  const { data: product, isLoading } = useGetProduct(productId);
  const { data: wishlist } = useGetWishlist();

  const addWishlist = useAddToWishlist();
  const removeWishlist = useRemoveFromWishlist();

  const isWishlisted = wishlist?.some((p) => p.id === productId) ?? false;
  const inCart = product ? isInCart(product.id) : false;

  const price =
    product
      ? typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price
      : 0;

  const toggleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      removeWishlist.mutate(
        { productId: product.id },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) },
      );
    } else {
      addWishlist.mutate(
        { data: { productId: product.id } },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) },
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product.id, title: product.title, price, imageUrl: product.imageUrl });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <Text style={[styles.errorText, { color: c.mutedForeground }]}>Product not found</Text>
      </View>
    );
  }

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.navBar, { paddingTop: topPadding + 8 }]}>
        <Pressable style={[styles.navBtn, { backgroundColor: c.card }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={c.foreground} />
        </Pressable>
        <Pressable
          style={[styles.navBtn, { backgroundColor: c.card }]}
          onPress={toggleWishlist}
        >
          <Feather name="heart" size={20} color={isWishlisted ? "#EF4444" : c.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", c.background]}
            style={styles.imageGradient}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(100)} style={styles.content}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: c.primary + "22", borderColor: c.primary + "44" }]}>
              <Text style={[styles.badgeText, { color: c.primary }]}>{product.category}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: c.muted, borderColor: c.border }]}>
              <Text style={[styles.badgeText, { color: c.mutedForeground }]}>{product.style}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: c.foreground }]}>{product.title}</Text>

          <View style={styles.popularityRow}>
            <Feather name="trending-up" size={14} color={c.accent} />
            <Text style={[styles.popularity, { color: c.accent }]}>
              {product.popularity} downloads
            </Text>
          </View>

          <Text style={[styles.description, { color: c.mutedForeground }]}>
            {product.description}
          </Text>

          {product.tags.length > 0 && (
            <View style={styles.tags}>
              {product.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: c.muted, borderColor: c.border }]}>
                  <Text style={[styles.tagText, { color: c.mutedForeground }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.infoBox, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.infoRow}>
              <Feather name="download" size={16} color={c.primary} />
              <Text style={[styles.infoText, { color: c.foreground }]}>Instant digital download</Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="file" size={16} color={c.primary} />
              <Text style={[styles.infoText, { color: c.foreground }]}>SVG, PNG, PDF formats</Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="shield" size={16} color={c.primary} />
              <Text style={[styles.infoText, { color: c.foreground }]}>Commercial license included</Text>
            </View>
          </View>
        </Animated.View>
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
        <View>
          <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Price</Text>
          <Text style={[styles.price, { color: c.foreground }]}>${price.toFixed(2)}</Text>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: inCart ? c.muted : c.primary }]}
          onPress={handleAddToCart}
          disabled={inCart}
        >
          <Feather name={inCart ? "check" : "shopping-bag"} size={18} color={inCart ? c.mutedForeground : "#FFF"} />
          <Text style={[styles.addBtnText, { color: inCart ? c.mutedForeground : "#FFF" }]}>
            {inCart ? "In Cart" : "Add to Cart"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    width: "100%",
    height: 360,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  popularityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  popularity: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    marginBottom: 16,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  price: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
