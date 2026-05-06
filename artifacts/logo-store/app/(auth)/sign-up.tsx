import { useSignUp } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const c = colors.dark;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (!url.startsWith("http")) router.replace("/(tabs)/" as any);
        },
      });
    }
  };

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: c.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logoImage}
            contentFit="cover"
          />
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>Verify Email</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          We sent a code to {email}
        </Text>

        <Text style={[styles.label, { color: c.mutedForeground }]}>Verification Code</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
          value={code}
          onChangeText={setCode}
          placeholder="Enter 6-digit code"
          placeholderTextColor={c.mutedForeground}
          keyboardType="numeric"
        />
        {errors?.fields?.code && (
          <Text style={styles.error}>{errors.fields.code.message}</Text>
        )}

        <Pressable
          style={[styles.button, { backgroundColor: c.primary, opacity: fetchStatus === "fetching" ? 0.5 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleVerify();
          }}
          disabled={fetchStatus === "fetching"}
        >
          {fetchStatus === "fetching" ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </Pressable>

        <Pressable onPress={() => signUp.verifications.sendEmailCode()}>
          <Text style={[styles.resend, { color: c.primary }]}>Resend code</Text>
        </Pressable>
        <View nativeID="clerk-captcha" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.background, flex: 1 }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logoImage}
          contentFit="cover"
        />
      </View>

      <Text style={[styles.title, { color: c.foreground }]}>Create Account</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
        Join LogoStore to browse and download premium logos
      </Text>

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
      {errors?.fields?.emailAddress && (
        <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>
      )}

      <Text style={[styles.label, { color: c.mutedForeground }]}>Password</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[
            styles.input,
            styles.passwordInput,
            { backgroundColor: c.input, borderColor: c.border, color: c.foreground },
          ]}
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 8 characters"
          placeholderTextColor={c.mutedForeground}
          secureTextEntry={!showPassword}
        />
        <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={c.mutedForeground} />
        </Pressable>
      </View>
      {errors?.fields?.password && (
        <Text style={styles.error}>{errors.fields.password.message}</Text>
      )}

      <Pressable
        style={[
          styles.button,
          { backgroundColor: c.primary, opacity: (!email || !password || fetchStatus === "fetching") ? 0.5 : 1 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleSubmit();
        }}
        disabled={!email || !password || fetchStatus === "fetching"}
      >
        {fetchStatus === "fetching" ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: c.mutedForeground }]}>Already have an account? </Text>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <Text style={[styles.footerLink, { color: c.primary }]}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
      <View nativeID="clerk-captcha" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
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
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
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
    marginTop: 4,
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
    marginBottom: 8,
  },
  resend: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
