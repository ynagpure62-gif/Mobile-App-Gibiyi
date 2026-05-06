import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetWishlist,
  useRemoveFromWishlist,
  useAddToWishlist,
  getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Product } from "@workspace/api-client-react";
import colors from "@/constants/colors";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistScreen() {
  const router = useRouter();
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: wishlist, isLoading } = useGetWishlist();
  const removeWishlist = useRemoveFromWishlist();
  const addWishlist = useAddToWishlist();

  const handleToggle = useCallback(
    (product: Product) => {
      const isInWishlist = wishlist?.some((p) => p.id === product.id);
      if (isInWishlist) {
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
    },
    [wishlist, removeWishlist, addWishlist, qc],
  );

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 16, borderBottomColor: c.border, backgroundColor: c.background },
        ]}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: c.foreground }]}>Wishlist</Text>
        <Text style={[styles.count, { color: c.mutedForeground }]}>
          {wishlist?.length ?? 0}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 60 }} />
      ) : !wishlist || wishlist.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="heart" size={40} color={c.border} />
          <Text style={[styles.emptyTitle, { color: c.foreground }]}>Wishlist is empty</Text>
          <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
            Tap the heart icon on any logo to save it
          </Text>
          <Pressable
            style={[styles.browseBtn, { backgroundColor: c.primary }]}
            onPress={() => router.replace("/(tabs)/" as any)}
          >
            <Text style={styles.browseBtnText}>Browse Logos</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
          ]}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60)} style={styles.gridItem}>
              <ProductCard
                product={item}
                isWishlisted
                onWishlistToggle={handleToggle}
              />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  count: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  browseBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  browseBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  grid: {
    padding: 14,
    paddingTop: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  gridItem: {
    flex: 1,
    alignItems: "center",
  },
});
