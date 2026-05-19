import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { getBaseUrl, type Product } from "@workspace/api-client-react";
import { useCart } from "@/contexts/CartContext";
import colors from "@/constants/colors";

interface ProductCardProps {
  product: Product;
  onWishlistToggle?: (product: Product) => void;
  isWishlisted?: boolean;
  size?: "normal" | "large";
}

export function ProductCard({
  product,
  onWishlistToggle,
  isWishlisted = false,
  size = "normal",
}: ProductCardProps) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const c = colors.dark;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const inCart = isInCart(product.id);
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;

  const handlePress = () => {
    router.push(`/product/${product.id}` as any);
  };

  const handleCart = (e: any) => {
    e.stopPropagation?.();
    if (!inCart) {
      addItem({ id: product.id, title: product.title, price, imageUrl: product.imageUrl });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isLarge = size === "large";

  const resolvedImageUrl = product.imageUrl.startsWith("http")
    ? product.imageUrl
    : `${getBaseUrl() || ""}${product.imageUrl}`;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: c.card,
            borderColor: c.border,
            width: isLarge ? 220 : 160,
          },
        ]}
      >
        <View style={[styles.imageContainer, { height: isLarge ? 180 : 140 }]}>
          <Image
            source={{ uri: resolvedImageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={300}
          />
          {product.featured && (
            <View style={[styles.featuredBadge, { backgroundColor: c.primary }]}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          {onWishlistToggle && (
            <Pressable
              style={[styles.wishlistBtn, { backgroundColor: c.background + "CC" }]}
              onPress={(e) => {
                e.stopPropagation?.();
                onWishlistToggle(product);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather
                name="heart"
                size={14}
                color={isWishlisted ? "#EF4444" : c.mutedForeground}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>
            {product.title}
          </Text>
          <Text style={[styles.category, { color: c.mutedForeground }]}>
            {product.category}
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.price, { color: c.primary }]}>
              ₹{price.toFixed(2)}
            </Text>
            <Pressable
              style={[
                styles.cartBtn,
                {
                  backgroundColor: inCart ? c.muted : c.primary,
                  borderColor: inCart ? c.border : "transparent",
                },
              ]}
              onPress={handleCart}
            >
              <Feather
                name={inCart ? "check" : "shopping-bag"}
                size={12}
                color={inCart ? c.mutedForeground : "#FFF"}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 10,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  category: {
    fontSize: 11,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
  },
  cartBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
