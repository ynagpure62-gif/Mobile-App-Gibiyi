// Import icons for UI elements like shopping bag, trash, etc.
import { Feather } from "@expo/vector-icons";
// Import optimized image component
import { Image } from "expo-image";
// Import haptics for device vibration feedback
import * as Haptics from "expo-haptics";
// Import routing hooks from expo-router
import { useRouter } from "expo-router";
// Import core React library
import React from "react";
// Import React Native components
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
// Import animations and transitions
import Animated, { FadeInDown } from "react-native-reanimated";
// Import safe area context to avoid device notches
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Import API helper to get the base URL for images
import { getBaseUrl } from "@workspace/api-client-react";
// Import custom color palette
import colors from "@/constants/colors";
// Import cart context hooks for accessing cart data
import { useCart } from "@/contexts/CartContext";

// Define the Cart Screen component
export default function CartScreen() {
  // Use the dark theme colors
  const c = colors.dark;
  // Get screen safe area margins
  const insets = useSafeAreaInsets();
  // Get navigation router instance
  const router = useRouter();
  // Destructure state and actions from the CartContext
  const { items, removeItem, totalAmount, itemCount } = useCart();

  // Calculate dynamic top padding, accounting for platform-specific differences (web vs mobile)
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  // Render an empty state view if there are no items in the cart
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

  // Render the main cart view if items are present
  return (
    // Main wrapper container taking up full screen
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header section displaying the title and total item count */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Cart</Text>
        <Text style={[styles.count, { color: c.mutedForeground }]}>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* List of items in the cart */}
      <FlatList
        data={items}
        // Unique key for each item to help React efficiently update the list
        keyExtractor={(item) => item.id.toString()}
        // Add padding at the bottom so the last items aren't hidden behind the footer
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 + 200 : insets.bottom + 200 },
        ]}
        // Render each individual cart item
        renderItem={({ item, index }) => (
          // Animate the item appearance with a slight delay based on its index
          <Animated.View entering={FadeInDown.delay(index * 60)}>
            {/* Container for a single cart item */}
            <View style={[styles.cartItem, { backgroundColor: c.card, borderColor: c.border }]}>
              {/* Product Image */}
              <Image
                source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${getBaseUrl() || ""}${item.imageUrl}` }}
                style={styles.itemImage}
                contentFit="contain"
              />
              {/* Product Details (Title, Subtitle, Price) */}
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: c.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.itemSubtitle, { color: c.mutedForeground }]}>
                  Digital Download
                </Text>
                <Text style={[styles.itemPrice, { color: c.primary }]}>
                  ₹{item.price.toFixed(2)}
                </Text>
              </View>
              {/* Button to remove the item from the cart */}
              <Pressable
                style={[styles.removeBtn, { backgroundColor: c.muted }]}
                onPress={() => {
                  removeItem(item.id);
                  // Provide light vibration feedback upon removal
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {/* Trash icon for the remove button */}
                <Feather name="trash-2" size={16} color={c.destructive} />
              </Pressable>
            </View>
          </Animated.View>
        )}
      />

      {/* Footer section anchored at the bottom displaying total amount and checkout button */}
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
        {/* Row showing the total price */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: c.mutedForeground }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: c.foreground }]}>
            ₹{totalAmount.toFixed(2)}
          </Text>
        </View>
        {/* Checkout Button */}
        <Pressable
          style={[styles.checkoutBtn, { backgroundColor: c.primary }]}
          onPress={() => {
            // Provide medium vibration feedback when proceeding to checkout
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Navigate to the checkout screen
            router.push("/checkout" as any);
          }}
        >
          {/* Credit card icon for the checkout button */}
          <Feather name="credit-card" size={18} color="#FFF" />
          <Text style={styles.checkoutBtnText}>Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Style definitions for the component
const styles = StyleSheet.create({
  // Container for the screen header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  // Text style for the screen title
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  // Text style for the item count indicator
  count: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  // Container style for the list of cart items
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  // Wrapper for each individual cart item
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    gap: 12,
    padding: 10,
  },
  // Image styling within a cart item
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  // Information container next to the image
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  // Title styling for the cart item
  itemTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  // Subtitle styling (e.g., "Digital Download")
  itemSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  // Price text styling
  itemPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  // Remove button wrapper
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // Bottom fixed footer container
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    gap: 14,
  },
  // Layout for the total label and amount
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Label for the total price ("Total")
  totalLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  // Numerical value for the total price
  totalAmount: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  // The checkout button styling
  checkoutBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  // Text styling for checkout button
  checkoutBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  // Container for the empty state view
  empty: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  // Icon styling in the empty state
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  // Title text for empty state ("Cart is empty")
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  // Description text for empty state
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  // Button to browse logos from the empty state
  browseBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  // Text inside the browse button
  browseBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
