import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetProducts,
  useGetCategories,
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Product } from "@workspace/api-client-react";
import colors from "@/constants/colors";
import { ProductCard } from "@/components/ProductCard";

const SORT_OPTIONS = [
  { label: "Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low", value: "price_asc" },
  { label: "Price: High", value: "price_desc" },
];

export default function ExploreScreen() {
  const scheme = "dark";
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    (params.category as string) || "",
  );
  const [selectedSort, setSelectedSort] = useState("popular");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams: Record<string, string> = { sort: selectedSort };
  if (selectedCategory) queryParams["category"] = selectedCategory;
  if (debouncedSearch) queryParams["search"] = debouncedSearch;

  const { data: products, isLoading } = useGetProducts(queryParams);
  const { data: categories } = useGetCategories();
  const { data: wishlist } = useGetWishlist();

  const addWishlist = useAddToWishlist();
  const removeWishlist = useRemoveFromWishlist();

  const wishlistedIds = new Set(wishlist?.map((p) => p.id) ?? []);

  const handleWishlistToggle = (product: Product) => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Explore</Text>
        <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: c.foreground }]}
            placeholder="Search logos..."
            placeholderTextColor={c.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={c.mutedForeground} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={[{ id: 0, name: "All", slug: "all" }, ...(categories ?? [])]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
          renderItem={({ item }) => {
            const active = (selectedCategory === item.slug) || (item.slug === 'all' && !selectedCategory);
            return (
              <Pressable
                style={[
                  styles.chip,
                  { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border },
                ]}
                onPress={() => setSelectedCategory(item.slug === 'all' ? '' : item.slug)}
              >
                <Text style={[styles.chipText, { color: active ? "#FFF" : c.mutedForeground }]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />

        <FlatList
          data={SORT_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          renderItem={({ item }) => {
            const active = selectedSort === item.value;
            return (
              <Pressable
                style={[
                  styles.sortChip,
                  { borderColor: active ? c.accent : c.border },
                ]}
                onPress={() => setSelectedSort(item.value)}
              >
                <Text style={[styles.chipText, { color: active ? c.accent : c.mutedForeground }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 60 }} />
      ) : !products || products.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="search" size={40} color={c.border} />
          <Text style={[styles.emptyText, { color: c.mutedForeground }]}>No logos found</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 },
          ]}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                isWishlisted={wishlistedIds.has(item.id)}
                onWishlistToggle={handleWishlistToggle}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  grid: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  gridItem: {
    flex: 1,
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
