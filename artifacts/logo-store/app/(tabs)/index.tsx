import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import {
  useGetFeaturedProducts,
  useGetProducts,
  useGetCategories,
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import colors from "@/constants/colors";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@workspace/api-client-react";

const STYLE_FILTERS = ["All", "Geometric", "Minimal", "Abstract", "Fluid"];

export default function HomeScreen() {
  const router = useRouter();
  const c = colors.dark;
  const scheme = "dark";
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [selectedStyle, setSelectedStyle] = useState("All");

  const { data: featured, isLoading: featuredLoading } = useGetFeaturedProducts();
  const { data: categories } = useGetCategories();
  const { data: allProducts, isLoading: productsLoading } = useGetProducts(
    selectedStyle !== "All" ? { style: selectedStyle } : {},
  );
  const { data: wishlist } = useGetWishlist();

  const addWishlist = useAddToWishlist();
  const removeWishlist = useRemoveFromWishlist();

  const wishlistedIds = new Set(wishlist?.map((p) => p.id) ?? []);

  const handleWishlistToggle = useCallback(
    (product: Product) => {
      if (wishlistedIds.has(product.id)) {
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
    },
    [wishlistedIds, addWishlist, removeWishlist, qc],
  );

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <ScrollView
      style={{ backgroundColor: c.background, flex: 1 }}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={
          scheme === "dark"
            ? ["#1A0A2E", "#080810", "#080810"]
            : ["#EDE9FE", "#FFFFFF", "#FFFFFF"]
        }
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: c.mutedForeground }]}>
              Good morning
            </Text>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>
              Discover Logos
            </Text>
          </View>
          <Pressable
            style={[styles.searchBtn, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => router.push("/(tabs)/explore" as any)}
          >
            <Feather name="search" size={20} color={c.mutedForeground} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Featured */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Featured</Text>
          <Pressable onPress={() => router.push("/(tabs)/explore" as any)}>
            <Text style={[styles.seeAll, { color: c.primary }]}>See all</Text>
          </Pressable>
        </View>
        {featuredLoading ? (
          <ActivityIndicator color={c.primary} style={{ marginVertical: 40 }} />
        ) : (
          <FlatList
            data={featured ?? []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInRight.delay(index * 80)}>
                <ProductCard
                  product={item}
                  size="large"
                  isWishlisted={wishlistedIds.has(item.id)}
                  onWishlistToggle={handleWishlistToggle}
                />
              </Animated.View>
            )}
          />
        )}
      </View>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.foreground, paddingHorizontal: 20 }]}>
            Categories
          </Text>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12 }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.categoryChip, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => router.push(`/(tabs)/explore?category=${item.slug}` as any)}
              >
                <Feather name={item.iconName as any} size={14} color={c.primary} />
                <Text style={[styles.categoryText, { color: c.foreground }]}>{item.name}</Text>
                <Text style={[styles.categoryCount, { color: c.mutedForeground }]}>
                  {item.productCount}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Browse by Style */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.foreground, paddingHorizontal: 20 }]}>
          Browse
        </Text>
        <FlatList
          data={STYLE_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 8 }}
          renderItem={({ item }) => {
            const active = selectedStyle === item;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? c.primary : c.card,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
                onPress={() => setSelectedStyle(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? "#FFF" : c.mutedForeground },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />

        <View style={{ height: 12 }} />

        {productsLoading ? (
          <ActivityIndicator color={c.primary} style={{ marginVertical: 40 }} />
        ) : (
          <FlatList
            data={allProducts ?? []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 60)}>
                <ProductCard
                  product={item}
                  isWishlisted={wishlistedIds.has(item.id)}
                  onWishlistToggle={handleWishlistToggle}
                />
              </Animated.View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  categoryCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
