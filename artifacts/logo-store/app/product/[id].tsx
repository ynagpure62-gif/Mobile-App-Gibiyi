// Import vector icons for UI elements
import { Feather } from "@expo/vector-icons";
// Import optimized image component from expo
import { Image } from "expo-image";
// Import haptics for device vibration feedback
import * as Haptics from "expo-haptics";
// Import gradient component for styling
import { LinearGradient } from "expo-linear-gradient";
// Import router hooks to handle navigation and get URL parameters
import { useLocalSearchParams, useRouter } from "expo-router";
// Import React and hooks
import React, { useState } from "react";
// Import core UI components from React Native
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
// Import animated components for smooth transitions
import Animated, { FadeInDown } from "react-native-reanimated";
// Import hook to handle device safe areas (notches, etc.)
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Import API hooks for fetching products and managing the wishlist
import {
  useGetProduct,
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
  getBaseUrl,
} from "@workspace/api-client-react";
// Import React Query hook for caching and data invalidation
import { useQueryClient } from "@tanstack/react-query";
// Import predefined color theme
import colors from "@/constants/colors";
// Import cart context to manage shopping cart state
import { useCart } from "@/contexts/CartContext";

// Main Product Detail Screen Component
export default function ProductDetailScreen() {
  // Extract the product ID from the route parameters
  const { id } = useLocalSearchParams();
  // Get the router instance for navigation
  const router = useRouter();
  // Set the color theme reference
  const c = colors.dark;
  // Get safe area insets to pad screen edges
  const insets = useSafeAreaInsets();
  // Get cart functions and state from the CartContext
  const { addItem, isInCart } = useCart();
  // Get the query client to invalidate caches
  const qc = useQueryClient();

  // Parse the ID string to an integer
  const productId = parseInt(id as string);
  // Fetch product data and loading state using the API client
  const { data: product, isLoading } = useGetProduct(productId);
  // Fetch the user's wishlist
  const { data: wishlist } = useGetWishlist();

  // Mutations to add or remove an item from the wishlist
  const addWishlist = useAddToWishlist();
  const removeWishlist = useRemoveFromWishlist();

  // Check if the current product is already in the user's wishlist
  const isWishlisted = wishlist?.some((p) => p.id === productId) ?? false;
  // Check if the current product is already in the cart
  const inCart = product ? isInCart(product.id) : false;

  // Parse the product price safely, defaulting to 0
  const price =
    product
      ? typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price
      : 0;

  // Handler to toggle the wishlist state
  const toggleWishlist = () => {
    if (!product) return;
    
    if (isWishlisted) {
      // If it's already in the wishlist, remove it and invalidate the query cache
      removeWishlist.mutate(
        { productId: product.id },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) },
      );
    } else {
      // If it's not in the wishlist, add it and invalidate the query cache
      addWishlist.mutate(
        { data: { productId: product.id } },
        { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) },
      );
    }
    // Provide light haptic feedback to the user
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handler to add the current product to the cart
  const handleAddToCart = () => {
    if (!product) return;
    // Call the addItem function from CartContext with product details
    addItem({ id: product.id, title: product.title, price, imageUrl: product.imageUrl });
    // Provide medium haptic feedback to the user
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Render a loading spinner while fetching product data
  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  // Render an error message if the product cannot be found
  if (!product) {
    return (
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <Text style={[styles.errorText, { color: c.mutedForeground }]}>Product not found</Text>
      </View>
    );
  }

  // Calculate top padding to accommodate platform-specific headers and safe areas
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    // Main container view with full screen height and dynamic background color
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Top Navigation Bar with Back and Wishlist buttons */}
      <View style={[styles.navBar, { paddingTop: topPadding + 8 }]}>
        {/* Back Button */}
        <Pressable style={[styles.navBtn, { backgroundColor: c.card }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={c.foreground} />
        </Pressable>
        {/* Wishlist Toggle Button */}
        <Pressable
          style={[styles.navBtn, { backgroundColor: c.card }]}
          onPress={toggleWishlist}
        >
          {/* Change heart icon color depending on whether it's wishlisted */}
          <Feather name="heart" size={20} color={isWishlisted ? "#EF4444" : c.mutedForeground} />
        </Pressable>
      </View>

      {/* Main Scrollable Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Product Image Wrapper */}
        <View style={styles.imageWrapper}>
          <Image
            // Format image URI properly by prepending base URL if it's a relative path
            source={{ uri: product.imageUrl.startsWith("http") ? product.imageUrl : `${getBaseUrl() || ""}${product.imageUrl}` }}
            style={styles.heroImage}
            contentFit="contain"
          />
          {/* Gradient overlay at the bottom of the image for a smooth transition */}
          <LinearGradient
            colors={["transparent", c.background]}
            style={styles.imageGradient}
          />
        </View>

        {/* Animated Container for Product Information */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.content}>
          {/* Badges for Product Category and Style */}
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: c.primary + "22", borderColor: c.primary + "44" }]}>
              <Text style={[styles.badgeText, { color: c.primary }]}>{product.category}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: c.muted, borderColor: c.border }]}>
              <Text style={[styles.badgeText, { color: c.mutedForeground }]}>{product.style}</Text>
            </View>
          </View>

          {/* Product Title */}
          <Text style={[styles.title, { color: c.foreground }]}>{product.title}</Text>

          {/* Popularity / Download Count */}
          <View style={styles.popularityRow}>
            <Feather name="trending-up" size={14} color={c.accent} />
            <Text style={[styles.popularity, { color: c.accent }]}>
              {product.popularity} downloads
            </Text>
          </View>

          {/* Product Description */}
          <Text style={[styles.description, { color: c.mutedForeground }]}>
            {product.description}
          </Text>

          {/* Additional Information Box (Download details, Formats, License) */}
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

      {/* Fixed Footer for Price and Add to Cart Action */}
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
        {/* Price Display */}
        <View>
          <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Price</Text>
          <Text style={[styles.price, { color: c.foreground }]}>₹{price.toFixed(2)}</Text>
        </View>
        {/* Add to Cart Button */}
        <Pressable
          style={[styles.addBtn, { backgroundColor: inCart ? c.muted : c.primary }]}
          onPress={handleAddToCart}
          disabled={inCart}
        >
          {/* Dynamic icon depending on cart status */}
          <Feather name={inCart ? "check" : "shopping-bag"} size={18} color={inCart ? c.mutedForeground : "#FFF"} />
          <Text style={[styles.addBtnText, { color: inCart ? c.mutedForeground : "#FFF" }]}>
            {inCart ? "In Cart" : "Add to Cart"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Style definitions for the component layout and visuals
const styles = StyleSheet.create({
  // Center the loading indicator
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Typography for error states
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  // Floating top navigation bar layout
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
  // Circular navigation buttons (back, heart)
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // Container for the hero image at the top
  imageWrapper: {
    width: "100%",
    height: 360,
    position: "relative",
  },
  // Styling for the hero product image
  heroImage: {
    width: "100%",
    height: "100%",
  },
  // Gradient that overlays the bottom of the hero image
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  // Main padding for the textual content
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Horizontal list of badges
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  // Individual pill-shaped badge style
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  // Typography for badge text
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  // Main product title typography
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  // Container for the popularity/downloads text
  popularityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  // Typography for popularity text
  popularity: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  // Detailed product description styling
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    marginBottom: 16,
  },
  // Box for additional digital info
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  // Individual row inside the info box
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // Text for the info box features
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  // Fixed footer for price and add-to-cart action
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
  // Tiny label above the numerical price
  priceLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  // Huge numerical price styling
  price: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  // Call to action button for adding item
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  // Text styling for the add button
  addBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
