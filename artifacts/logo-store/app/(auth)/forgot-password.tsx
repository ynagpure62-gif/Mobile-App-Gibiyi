import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const c = colors.dark;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true);
    // Use resetPasswordForEmail to send a reset link to the user
    // The redirect URL should be handled by Expo deep linking
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "gibiyi://reset-password",
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background, flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={24} color={c.foreground} />
      </Pressable>

      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: c.primary + "20" }]}>
          <Feather name="lock" size={32} color={c.primary} />
        </View>
      </View>

      <Text style={[styles.title, { color: c.foreground }]}>Forgot Password</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      {!submitted ? (
        <>
          <Text style={[styles.label, { color: c.mutedForeground }]}>Email address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={c.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={[styles.button, { backgroundColor: c.primary, opacity: (!email || loading) ? 0.5 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleResetPassword();
            }}
            disabled={!email || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </Pressable>
        </>
      ) : (
        <View style={styles.successContainer}>
          <View style={[styles.successBadge, { backgroundColor: "#22C55E20" }]}>
            <Feather name="check" size={20} color="#22C55E" />
            <Text style={[styles.successText, { color: "#22C55E" }]}>Link Sent!</Text>
          </View>
          <Text style={[styles.successMessage, { color: c.mutedForeground }]}>
            We've sent a password reset link to <Text style={{ color: c.foreground, fontWeight: "600" }}>{email}</Text>. Please check your inbox.
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: c.primary, marginTop: 12 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  backBtn: {
    marginBottom: 32,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    width: "100%",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  successContainer: {
    alignItems: "center",
    gap: 16,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  successText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  successMessage: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
});
