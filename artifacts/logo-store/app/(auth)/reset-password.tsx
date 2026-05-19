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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const c = colors.dark;
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    // Use updateUser to set the new password
    // This works if the user has already been authenticated via the recovery link
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your password has been updated successfully.", [
        { text: "OK", onPress: () => router.replace("/(auth)/sign-in") }
      ]);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background, flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: c.primary + "20" }]}>
          <Feather name="shield" size={32} color={c.primary} />
        </View>
      </View>

      <Text style={[styles.title, { color: c.foreground }]}>Reset Password</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
        Please enter your new password below.
      </Text>

      <Text style={[styles.label, { color: c.mutedForeground }]}>New Password</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.input, styles.passwordInput, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Min 6 characters"
          placeholderTextColor={c.mutedForeground}
          secureTextEntry={!showPassword}
        />
        <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={c.mutedForeground} />
        </Pressable>
      </View>

      <Text style={[styles.label, { color: c.mutedForeground }]}>Confirm New Password</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm your password"
        placeholderTextColor={c.mutedForeground}
        secureTextEntry={!showPassword}
      />

      <Pressable
        style={[styles.button, { backgroundColor: c.primary, opacity: (!password || !confirmPassword || loading) ? 0.5 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleUpdatePassword();
        }}
        disabled={!password || !confirmPassword || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace("/(auth)/sign-in")} style={styles.cancelBtn}>
        <Text style={[styles.cancelText, { color: c.mutedForeground }]}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
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
  passwordWrapper: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeBtn: {
    position: "absolute",
    right: 16,
    top: 17,
  },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  cancelBtn: {
    marginTop: 24,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
