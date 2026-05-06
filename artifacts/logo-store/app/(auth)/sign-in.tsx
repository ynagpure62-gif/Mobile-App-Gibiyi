import { useSSO, useSignIn } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function SignInScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const c = colors.dark;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            void WebBrowser.openBrowserAsync(url);
          } else {
            router.replace("/(tabs)/" as any);
          }
        },
      });
    }
  };

  const handleMfa = async () => {
    await signIn.mfa.verifyEmailCode({ code: mfaCode });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: () => router.replace("/(tabs)/" as any),
      });
    }
  };

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async () => router.replace("/(tabs)/" as any),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, router]);

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Verify Identity</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          Enter the code sent to your email
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
          value={mfaCode}
          onChangeText={setMfaCode}
          placeholder="Verification code"
          placeholderTextColor={c.mutedForeground}
          keyboardType="numeric"
        />
        <Pressable
          style={[styles.button, { backgroundColor: c.primary }]}
          onPress={handleMfa}
          disabled={fetchStatus === "fetching"}
        >
          <Text style={styles.buttonText}>Verify</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.background, flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logoImage}
          contentFit="cover"
        />
      </View>

      <Text style={[styles.title, { color: c.foreground }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
        Sign in to your LogoStore account
      </Text>

      <Pressable
        style={[styles.socialBtn, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : (
          <>
            <Feather name="chrome" size={18} color={c.foreground} />
            <Text style={[styles.socialBtnText, { color: c.foreground }]}>Continue with Google</Text>
          </>
        )}
      </Pressable>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
        <Text style={[styles.dividerText, { color: c.mutedForeground }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
      </View>

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
      {errors?.fields?.identifier && (
        <Text style={styles.error}>{errors.fields.identifier.message}</Text>
      )}

      <Text style={[styles.label, { color: c.mutedForeground }]}>Password</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.input, styles.passwordInput, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
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
        style={[styles.button, { backgroundColor: c.primary, opacity: (!email || !password || fetchStatus === "fetching") ? 0.5 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleSignIn();
        }}
        disabled={!email || !password || fetchStatus === "fetching"}
      >
        {fetchStatus === "fetching" ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: c.mutedForeground }]}>Don't have an account? </Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text style={[styles.footerLink, { color: c.primary }]}>Sign up</Text>
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
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  socialBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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
