import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
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
import { useGetOrders } from "@workspace/api-client-react";
import colors from "@/constants/colors";

export default function OrdersScreen() {
  const router = useRouter();
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const { data: orders, isLoading } = useGetOrders();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 16, borderBottomColor: c.border, backgroundColor: c.background },
        ]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: c.foreground }]}>Order History</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 60 }} />
      ) : !orders || orders.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="package" size={40} color={c.border} />
          <Text style={[styles.emptyTitle, { color: c.foreground }]}>No orders yet</Text>
          <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
            Purchase logos to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
            gap: 14,
          }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60)}>
              <View style={[styles.orderCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={[styles.orderId, { color: c.mutedForeground }]}>
                      Order #{item.id}
                    </Text>
                    <Text style={[styles.orderDate, { color: c.mutedForeground }]}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View>
                    <View style={[styles.statusBadge, { backgroundColor: "#22C55E20", borderColor: "#22C55E44" }]}>
                      <Text style={{ color: "#22C55E", fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
                        {item.status}
                      </Text>
                    </View>
                    <Text style={[styles.orderTotal, { color: c.foreground }]}>
                      ${parseFloat(item.totalAmount as unknown as string).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.itemsRow]}>
                  {item.items.slice(0, 4).map((oi) => (
                    <Image
                      key={oi.id}
                      source={{ uri: oi.product.imageUrl }}
                      style={[styles.thumbImage, { borderColor: c.border }]}
                      contentFit="cover"
                    />
                  ))}
                  {item.items.length > 4 && (
                    <View style={[styles.moreThumb, { backgroundColor: c.muted, borderColor: c.border }]}>
                      <Text style={[styles.moreText, { color: c.mutedForeground }]}>
                        +{item.items.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable
                  style={[styles.downloadBtn, { backgroundColor: c.muted, borderColor: c.border }]}
                >
                  <Feather name="download" size={14} color={c.primary} />
                  <Text style={[styles.downloadText, { color: c.primary }]}>Download Files</Text>
                </Pressable>
              </View>
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
  backBtn: { padding: 4 },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  itemsRow: {
    flexDirection: "row",
    gap: 8,
  },
  thumbImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
  },
  moreThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  downloadText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
