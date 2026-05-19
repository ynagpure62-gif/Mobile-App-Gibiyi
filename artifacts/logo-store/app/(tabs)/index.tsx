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
import * as Haptics from "expo-haptics";
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

const STYLE_OPTIONS_HOME = [
  { id: "wordmark", title: "Wordmark", icon: "type" },
  { id: "pictorial", title: "Pictorial", icon: "image" },
  { id: "abstract", title: "Abstract", icon: "triangle" },
  { id: "letterform", title: "Letterform", icon: "bold" },
  { id: "emblem", title: "Emblem", icon: "shield" },
  { id: "character", title: "Mascot", icon: "smile" },
  { id: "web2", title: "Web 2.0", icon: "activity" },
];

const STYLE_FILTERS = ["All", "Geometric", "Minimal", "Abstract", "Fluid"];

export default function HomeScreen() {
  const router = useRouter();
  const c = colors.dark;
  const scheme = "dark";
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [selectedStyle, setSelectedStyle] = useState("All");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Sabhi hooks ko upar rakhte hain taaki order na bigde
  const { data: featured, isLoading: featuredLoading, error: featuredError } = useGetFeaturedProducts();
  const { data: categories } = useGetCategories();
  const { data: allProducts, isLoading: productsLoading, error: productsError } = useGetProducts(
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

  // Error check hooks ke baad
  if (featuredError || productsError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.background }}>
        <Text style={{ color: "red", marginBottom: 10, fontSize: 18, fontWeight: 'bold' }}>Backend Not Connected</Text>
        <Text style={{ color: c.mutedForeground, textAlign: "center", padding: 20 }}>
          Make sure your API server is running on Port 8080.
        </Text>
        <Pressable
          onPress={() => qc.invalidateQueries()}
          style={{ backgroundColor: c.primary, padding: 12, borderRadius: 8, marginTop: 10 }}
        >
          <Text style={{ color: "white", fontWeight: '600' }}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

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
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.headerLogo}
              contentFit="contain"
            />
            <View>
              <Text style={[styles.greeting, { color: c.mutedForeground }]}>
                {greeting}
              </Text>
              <Text style={[styles.headerTitle, { color: c.foreground }]}>
                Discover Gibiyi
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.searchBtn, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => router.push("/(tabs)/explore" as any)}
          >
            <Feather name="search" size={20} color={c.mutedForeground} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Custom Logo Design Services Banner */}
      <Animated.View 
        entering={FadeInDown.delay(100)}
        style={[styles.customLogoBanner, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <LinearGradient
          colors={["rgba(124, 58, 237, 0.12)", "rgba(79, 70, 229, 0.03)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.customLogoGradient}
        >
          <View style={styles.customLogoHeader}>
            <View style={styles.customLogoInfo}>
              <View style={styles.premiumBadge}>
                <Feather name="star" size={10} color="#F59E0B" />
                <Text style={styles.premiumBadgeText}>PREMIUM CUSTOM SERVICE</Text>
              </View>
              <Text style={[styles.customLogoTitle, { color: c.foreground }]}>
                Custom Logo Design
              </Text>
              <Text style={[styles.customLogoSubtitle, { color: c.mutedForeground }]}>
                Order a unique logo tailored to your brand goals by professional designers.
              </Text>
            </View>
            <Pressable
              style={[styles.customLogoButton, { backgroundColor: c.primary }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/custom-logo" as any);
              }}
            >
              <Text style={styles.customLogoButtonText}>Start</Text>
              <Feather name="arrow-right" size={13} color="#FFF" style={{ marginLeft: 3 }} />
            </Pressable>
          </View>

          {/* Logo Types Section */}
          <View style={styles.logoTypesSection}>
            <Text style={[styles.logoTypesTitle, { color: c.mutedForeground }]}>
              Customize by selecting a style below:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.logoTypesScroll}
            >
              {STYLE_OPTIONS_HOME.map((style) => (
                <Pressable
                  key={style.id}
                  style={[styles.logoTypeItem, { backgroundColor: "rgba(255, 255, 255, 0.03)", borderColor: c.border }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({
                      pathname: "/custom-logo" as any,
                      params: { initialStyle: style.id }
                    });
                  }}
                >
                  <View style={styles.logoTypeIconBg}>
                    <Feather name={style.icon as any} size={15} color="#A78BFA" />
                  </View>
                  <Text style={[styles.logoTypeLabel, { color: c.foreground }]}>
                    {style.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </LinearGradient>
      </Animated.View>

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "#FFFFFF",
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  customLogoBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 12,
  },
  customLogoGradient: {
    padding: 18,
  },
  customLogoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  customLogoInfo: {
    flex: 1,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 6,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  customLogoTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  customLogoSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  customLogoButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  customLogoButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  logoTypesSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 14,
  },
  logoTypesTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logoTypesScroll: {
    gap: 8,
  },
  logoTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoTypeIconBg: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124, 58, 237, 0.15)",
  },
  logoTypeLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
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
