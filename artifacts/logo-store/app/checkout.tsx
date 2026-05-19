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
  TextInput,
  View,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useCreateOrder, getGetOrdersQueryKey, getBaseUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

export default function CheckoutScreen() {
  const router = useRouter();
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const { items, totalAmount, clearCart } = useCart();
  const qc = useQueryClient();

  const [success, setSuccess] = useState(false);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const createOrder = useCreateOrder();

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const upiId = "7721806826@pthdfc";
  const payeeName = "Gibiyi Store";
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=Gibiyi_Store_Order`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;

  const handleOpenUPI = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const supported = await Linking.canOpenURL(upiString);
      if (supported) {
        await Linking.openURL(upiString);
      } else {
        Alert.alert(
          "UPI App Not Found",
          "Direct payments launch karne ke liye koi UPI App (GPay, PhonePe, Paytm) nahi mila. Kripya QR Code ko scan karein.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("UPI launch error:", error);
      Alert.alert(
        "Error",
        "Could not open UPI app. Please scan the QR Code instead.",
        [{ text: "OK" }]
      );
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Kripya Payment Screenshot select karne ke liye gallery/photo access permission grant karein."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshot(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Screenshot select karne me koi dikkat aayi. Kripya gallery permissions check karein.");
    }
  };

  const handlePurchase = async () => {
    const cleanUtr = utr.trim();
    setUtrError(null);

    if (!cleanUtr) {
      setUtrError("Wrong or invalid format. Enter Valid 12-digit UPI UTR or Bank Transaction Number");
      return;
    }

    const utrRegex = /^[A-Za-z0-9]{12,22}$/;
    if (!utrRegex.test(cleanUtr)) {
      setUtrError("Wrong or invalid format. Enter Valid 12-digit UPI UTR or Bank Transaction Number");
      return;
    }

    if (!screenshot) {
      Alert.alert("Required", "Kripya payment ka screenshot upload karein.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmitting(true);

    try {
      // 1. Get current auth session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;

      // 2. Prepare and send screenshot/UTR details to email checkout
      const formData = new FormData();
      formData.append("utr", utr);
      formData.append("items", JSON.stringify(items.map((i) => i.title)));

      if (Platform.OS === "web") {
        try {
          const response = await fetch(screenshot);
          const blob = await response.blob();
          formData.append("screenshot", blob, "screenshot.jpg");
        } catch (e) {
          console.error("Error creating web blob:", e);
          formData.append("screenshot", screenshot);
        }
      } else {
        const filename = screenshot.split("/").pop() || "screenshot.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("screenshot", {
          uri: screenshot,
          name: filename,
          type,
        } as any);
      }

      const baseUrl = getBaseUrl();
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let savedScreenshotUrl: string | null = null;
      try {
        const emailRes = await fetch(`${baseUrl || ""}/api/email-checkout`, {
          method: "POST",
          body: formData,
          headers,
        });

        if (emailRes.ok) {
          const emailData = await emailRes.json();
          if (emailData.screenshotUrl) {
            // Save the relative URL to the DB for portability
            savedScreenshotUrl = emailData.screenshotUrl;
          }
        } else {
          console.warn("Failed to submit email payment details, proceeding to register database order");
        }
      } catch (e) {
        console.warn("Email checkout route unreachable, proceeding to register database order:", e);
      }

      // 3. Create the order record in the database so it is saved in "Order History" for downloads
      await createOrder.mutateAsync({
        data: {
          utr: cleanUtr,
          screenshotUrl: savedScreenshotUrl,
          items: items.map((item) => ({
            productId: item.id,
            price: item.price,
          })),
        },
      });

      // 4. Clear orders query cache to fetch the new order on the order history screen
      qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });

      clearCart();
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || "There was an error submitting your order. Duplicate payments or invalid UTR is not allowed.";
      
      // If the error message mentions UTR or duplicate, set it directly underneath the textbox
      if (errMsg.toLowerCase().includes("utr") || errMsg.toLowerCase().includes("payment") || errMsg.toLowerCase().includes("duplicate")) {
        setUtrError("Wrong or invalid format. Enter Valid 12-digit UPI UTR or Bank Transaction Number");
      } else {
        Alert.alert("Order Submission Failed", errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
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
              source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${getBaseUrl() || ""}${item.imageUrl}` }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemTitle, { color: c.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.itemSub, { color: c.mutedForeground }]}>Digital Download</Text>
            </View>
            <Text style={[styles.itemPrice, { color: c.primary }]}>₹{item.price.toFixed(2)}</Text>
          </Animated.View>
        ))}

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: c.mutedForeground }]}>Subtotal</Text>
          <Text style={[styles.totalValue, { color: c.foreground }]}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: c.mutedForeground }]}>Processing Fee</Text>
          <Text style={[styles.totalValue, { color: c.foreground }]}>₹0.00</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.grandLabel, { color: c.foreground }]}>Total</Text>
          <Text style={[styles.grandValue, { color: c.primary }]}>₹{totalAmount.toFixed(2)}</Text>
        </View>

        <View style={[styles.secureNote, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name="shield" size={16} color="#22C55E" />
          <Text style={[styles.secureText, { color: c.mutedForeground }]}>
            Secure checkout. Instant delivery after payment.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: c.foreground, marginTop: 24 }]}>Payment Method</Text>

        {/* 1. Direct Pay via App */}
        {Platform.OS !== "web" && (
          <Pressable
            style={[styles.upiPayBtn, { backgroundColor: c.primary }]}
            onPress={handleOpenUPI}
          >
            <Feather name="zap" size={18} color="#FFF" />
            <Text style={styles.upiPayBtnText}>⚡ Pay via UPI App (GPay/PhonePe/Paytm)</Text>
          </Pressable>
        )}

        {/* 2. UPI Account Info Card */}
        <View style={[styles.upiDetailsCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.upiDetailsTitle, { color: c.foreground }]}>UPI Account Details</Text>
          <View style={styles.upiDetailsRow}>
            <Text style={[styles.upiDetailsLabel, { color: c.mutedForeground }]}>UPI ID: </Text>
            <Text style={[styles.upiDetailsValue, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{upiId}</Text>
          </View>
          <View style={styles.upiDetailsRow}>
            <Text style={[styles.upiDetailsLabel, { color: c.mutedForeground }]}>Name: </Text>
            <Text style={[styles.upiDetailsValue, { color: c.foreground }]}>{payeeName}</Text>
          </View>
          <View style={styles.upiDetailsRow}>
            <Text style={[styles.upiDetailsLabel, { color: c.mutedForeground }]}>Amount: </Text>
            <Text style={[styles.upiDetailsValue, { color: c.foreground, fontFamily: "Inter_700Bold" }]}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* 3. Scan QR Code to Pay */}
        <Text style={[styles.sectionTitle, { color: c.foreground, marginTop: 24 }]}>Scan QR Code to Pay</Text>
        <View style={[styles.qrContainer, { backgroundColor: "#FFFFFF", borderColor: c.border }]}>
          <Image 
            source={{ uri: qrCodeUrl }} 
            style={styles.actualQrImage} 
            contentFit="contain"
          />
          <Text style={{ color: "#080810", fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 12, textAlign: "center" }}>
            Auto-configured for ₹{totalAmount.toFixed(2)}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: c.foreground, marginTop: 24 }]}>Payment Details</Text>
        
        <Text style={[styles.inputLabel, { color: c.foreground }]}>UTR / Transaction ID</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.card, borderColor: utrError ? "#EF4444" : c.border, color: c.foreground }]}
          placeholder="Enter 12-digit UTR number"
          placeholderTextColor={c.mutedForeground}
          value={utr}
          onChangeText={(text) => {
            setUtr(text);
            if (utrError) setUtrError(null);
          }}
        />
        {utrError && (
          <Text style={{ color: "#EF4444", fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 4, marginBottom: 16, marginLeft: 2, lineHeight: 16 }}>
            ⚠️ {utrError}
          </Text>
        )}

        <Text style={[styles.inputLabel, { color: c.foreground }]}>Payment Screenshot</Text>
        <Pressable
          style={[styles.uploadBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={pickImage}
        >
          {screenshot ? (
            <Image source={{ uri: screenshot }} style={styles.uploadedImage} contentFit="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Feather name="upload-cloud" size={24} color={c.mutedForeground} />
              <Text style={[styles.uploadText, { color: c.mutedForeground }]}>Upload Screenshot</Text>
            </View>
          )}
        </Pressable>
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
            { backgroundColor: c.primary, opacity: isSubmitting ? 0.7 : 1 },
          ]}
          onPress={handlePurchase}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Feather name="lock" size={18} color="#FFF" />
              <Text style={styles.purchaseBtnText}>
                Pay ₹{totalAmount.toFixed(2)}
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
  qrContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actualQrImage: {
    width: 250,
    height: 250,
    borderRadius: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  uploadBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    height: 120,
    overflow: "hidden",
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
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
  upiPayBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  upiPayBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  upiDetailsCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  upiDetailsTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  upiDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upiDetailsLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  upiDetailsValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
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
