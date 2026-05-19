import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  DimensionValue,
  PanResponder,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import colors from "@/constants/colors";
import { useCreateCustomLogo } from "@workspace/api-client-react";

// Types
type SliderKeys =
  | "feminineMasculine"
  | "simpleComplex"
  | "grayColorful"
  | "subtleBright"
  | "quietLoud"
  | "necessityLuxury"
  | "expensiveEconomical"
  | "playfulSerious"
  | "modernClassic"
  | "rawRefined"
  | "exoticCommonplace"
  | "sportyElegant"
  | "adventureSecure";

interface FormState {
  businessName: string;
  slogan: string;
  description: string;
  industry: string;
  targetAudience: string;
  top3Things: [string, string, string];
  ideas: string;
  colors: string;
  styles: string[];
  sliders: Record<SliderKeys, number>;
  paymentId: string;
  uploadLinks: string[];
}

const INDUSTRIES = [
  "Technology",
  "Fashion & Apparel",
  "Finance & Banking",
  "Health & Wellness",
  "Food & Beverage",
  "Real Estate",
  "Education",
  "Entertainment",
  "Automotive",
  "Other",
];

const STYLE_OPTIONS = [
  { id: "wordmark", title: "Wordmark", desc: "Text-only logo using custom typography (e.g., Google, Coca-Cola)", icon: "type" },
  { id: "pictorial", title: "Pictorial Mark", desc: "Iconic brand symbol or graphic representation (e.g., Apple, Twitter)", icon: "image" },
  { id: "abstract", title: "Abstract Mark", desc: "A unique geometric form representing the brand (e.g., Nike, Pepsi)", icon: "triangle" },
  { id: "letterform", title: "Letterform Mark", desc: "Single-letter monogram logo (e.g., McDonald's, Netflix)", icon: "bold" },
  { id: "emblem", title: "Emblem", desc: "Crest, badge, or seal with text inside (e.g., Starbucks, Harley-Davidson)", icon: "shield" },
  { id: "character", title: "Character / Mascot", desc: "An illustrated character representing the brand (e.g., KFC, Pringles)", icon: "smile" },
  { id: "web2", title: "Web 2.0", desc: "Glossy, high-tech, and vibrant gradients suited for modern screens", icon: "activity" },
];

const SLIDERS_CONFIG: Array<{ key: SliderKeys; left: string; right: string }> = [
  { key: "feminineMasculine", left: "Feminine", right: "Masculine" },
  { key: "simpleComplex", left: "Simple", right: "Complex" },
  { key: "grayColorful", left: "Gray", right: "Colorful" },
  { key: "subtleBright", left: "Subtle", right: "Bright" },
  { key: "quietLoud", left: "Quiet", right: "Loud" },
  { key: "necessityLuxury", left: "Necessity", right: "Luxury" },
  { key: "expensiveEconomical", left: "Expensive", right: "Economical" },
  { key: "playfulSerious", left: "Playful", right: "Serious" },
  { key: "modernClassic", left: "Modern", right: "Classic" },
  { key: "rawRefined", left: "Raw", right: "Refined" },
  { key: "exoticCommonplace", left: "Exotic", right: "Commonplace" },
  { key: "sportyElegant", left: "Sporty", right: "Elegant" },
  { key: "adventureSecure", left: "Adventure", right: "Secure" },
];

const COLOR_CARDS = [
  { colorName: "Red", desc: "Passion, Love, Energy", bg: "#EF4444" },
  { colorName: "Yellow", desc: "Joy, Youth, Intellect", bg: "#F59E0B" },
  { colorName: "Green", desc: "Growth, Wealth, Healing", bg: "#10B981" },
  { colorName: "White", desc: "Purity, Simplicity", bg: "#FFFFFF", darkText: true },
  { colorName: "Blue", desc: "Trust, Security, Calm", bg: "#3B82F6" },
  { colorName: "Black", desc: "Luxury, Power, Elegance", bg: "#111827" },
];

export default function CustomLogoScreen() {
  const c = colors.dark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { initialStyle } = useLocalSearchParams<{ initialStyle?: string }>();
  const { mutateAsync: submitLogoRequest, isPending } = useCreateCustomLogo();

  const isWeb = Platform.OS === "web";
  const scrollViewRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(1);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  useEffect(() => {
    if (initialStyle && STYLE_OPTIONS.some((s) => s.id === initialStyle)) {
      setForm((prev) => ({ ...prev, styles: [initialStyle] }));
    }
  }, [initialStyle]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState("");

  const [form, setForm] = useState<FormState>({
    businessName: "",
    slogan: "",
    description: "",
    industry: "",
    targetAudience: "",
    top3Things: ["", "", ""],
    ideas: "",
    colors: "",
    styles: [],
    sliders: {
      feminineMasculine: 50,
      simpleComplex: 50,
      grayColorful: 50,
      subtleBright: 50,
      quietLoud: 50,
      necessityLuxury: 50,
      expensiveEconomical: 50,
      playfulSerious: 50,
      modernClassic: 50,
      rawRefined: 50,
      exoticCommonplace: 50,
      sportyElegant: 50,
      adventureSecure: 50,
    },
    paymentId: "",
    uploadLinks: [],
  });

  const updateField = (key: keyof FormState, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validateStep = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.businessName.trim()) nextErrors.businessName = "Business Name is required";
      if (!form.description.trim()) nextErrors.description = "Organization description is required";
      else if (form.description.trim().length < 10) nextErrors.description = "Description must be at least 10 characters";
      if (!form.industry) nextErrors.industry = "Please select an industry";
      if (!form.targetAudience.trim()) nextErrors.targetAudience = "Target audience description is required";
    } else if (step === 2) {
      if (!form.top3Things[0].trim()) nextErrors.message1 = "First Brand Message is required";
      if (!form.top3Things[1].trim()) nextErrors.message2 = "Second Brand Message is required";
      if (!form.top3Things[2].trim()) nextErrors.message3 = "Third Brand Message is required";
    } else if (step === 4) {
      if (!form.colors.trim()) nextErrors.colors = "Color description is required";
    } else if (step === 5) {
      if (form.styles.length === 0) nextErrors.styles = "Please select at least 1 Logo Style";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      Haptics.selectionAsync();
      setStep((prev) => Math.min(prev + 1, 7));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const triggerPaymentMock = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaying(true);

    // Simulate 3 seconds payment processing
    setTimeout(async () => {
      const mockPayId = "PAY-" + Math.floor(100000 + Math.random() * 900000);
      try {
        const response = await submitLogoRequest({
          data: {
            ...form,
            paymentId: mockPayId,
          },
        });
        
        setIsPaying(false);
        setGeneratedId(response.id || "REQ-" + Math.floor(100000 + Math.random() * 900000));
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        setIsPaying(false);
        alert("Submission failed. Please try again.");
      }
    }, 2500);
  };

  const CustomSlider = ({
    left,
    right,
    value,
    onChange,
  }: {
    left: string;
    right: string;
    value: number;
    onChange: (val: number) => void;
  }) => {
    const trackWidth = useRef(280);
    const startValue = useRef(50);
    const startX = useRef(0);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Capture gesture if mostly horizontal and moved more than 2px
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 2;
        },
        onPanResponderGrant: (evt, gestureState) => {
          const { locationX, pageX } = evt.nativeEvent;
          // Calculate value based on local tap position
          const val = Math.max(0, Math.min(100, Math.round((locationX / trackWidth.current) * 100)));
          onChange(val);
          startValue.current = val;
          startX.current = pageX;
        },
        onPanResponderMove: (evt, gestureState) => {
          const { pageX } = evt.nativeEvent;
          // Global screen delta prevents local coordinate jitters on web/native
          const deltaX = pageX - startX.current;
          const deltaPercentage = Math.round((deltaX / trackWidth.current) * 100);
          const newVal = Math.max(0, Math.min(100, startValue.current + deltaPercentage));
          onChange(newVal);
        },
      })
    ).current;

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: c.mutedForeground }]}>{left}</Text>
          <Text style={[styles.sliderValue, { color: c.primary }]}>{value}%</Text>
          <Text style={[styles.sliderLabel, { color: c.mutedForeground, textAlign: "right" }]}>{right}</Text>
        </View>
        <View
          onLayout={(e) => {
            trackWidth.current = e.nativeEvent.layout.width || 280;
          }}
          style={styles.sliderTrackWrapper}
          {...panResponder.panHandlers}
        >
          <View style={[styles.sliderTrack, { backgroundColor: c.muted }]}>
            <View
              style={[
                styles.sliderFill,
                { backgroundColor: c.primary, width: (`${value}%` as DimensionValue) },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { backgroundColor: c.primary, left: (`${value}%` as DimensionValue), marginLeft: -10 },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View
            entering={isWeb ? undefined : FadeIn}
            exiting={isWeb ? undefined : FadeOut}
            key="step-1"
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Basic Information</Text>
            <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
              Tell us about your brand so we can start designing your vision.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.foreground }]}>Business Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: c.card, borderColor: errors.businessName ? c.destructive : c.border, color: c.foreground },
                ]}
                placeholder="Enter your business name"
                placeholderTextColor={c.mutedForeground}
                value={form.businessName}
                onChangeText={(val) => updateField("businessName", val)}
              />
              {errors.businessName && <Text style={[styles.errorText, { color: c.destructive }]}>{errors.businessName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.foreground }]}>Slogan (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
                placeholder="Enter slogan if any"
                placeholderTextColor={c.mutedForeground}
                value={form.slogan}
                onChangeText={(val) => updateField("slogan", val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.foreground }]}>Organization Description *</Text>
              <TextInput
                style={[
                  styles.textarea,
                  { backgroundColor: c.card, borderColor: errors.description ? c.destructive : c.border, color: c.foreground },
                ]}
                placeholder="Describe what your organization does in 1–2 sentences..."
                placeholderTextColor={c.mutedForeground}
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(val) => updateField("description", val)}
              />
              {errors.description && <Text style={[styles.errorText, { color: c.destructive }]}>{errors.description}</Text>}
            </View>

            <View style={[styles.inputGroup, { zIndex: showIndustryDropdown ? 999 : 1 }]}>
              <Text style={[styles.label, { color: c.foreground }]}>Industry *</Text>
              <Pressable
                style={[
                  styles.input,
                  styles.dropdown,
                  { backgroundColor: c.card, borderColor: errors.industry ? c.destructive : c.border },
                ]}
                onPress={() => setShowIndustryDropdown(!showIndustryDropdown)}
              >
                <Text style={{ color: form.industry ? c.foreground : c.mutedForeground }}>
                  {form.industry || "Select Industry"}
                </Text>
                <Feather name={showIndustryDropdown ? "chevron-up" : "chevron-down"} size={16} color={c.mutedForeground} />
              </Pressable>
              {errors.industry && <Text style={[styles.errorText, { color: c.destructive }]}>{errors.industry}</Text>}

              {showIndustryDropdown && (
                <View style={[styles.dropdownOptions, { backgroundColor: c.card, borderColor: c.border }]}>
                  {INDUSTRIES.map((ind) => (
                    <Pressable
                      key={ind}
                      style={[styles.dropdownOption, form.industry === ind && { backgroundColor: c.muted }]}
                      onPress={() => {
                        updateField("industry", ind);
                        setShowIndustryDropdown(false);
                      }}
                    >
                      <Text style={{ color: c.foreground }}>{ind}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.foreground }]}>Target Audience *</Text>
              <TextInput
                style={[
                  styles.textarea,
                  { backgroundColor: c.card, borderColor: errors.targetAudience ? c.destructive : c.border, color: c.foreground },
                ]}
                placeholder="Describe the target audience for your logo..."
                placeholderTextColor={c.mutedForeground}
                multiline
                numberOfLines={3}
                value={form.targetAudience}
                onChangeText={(val) => updateField("targetAudience", val)}
              />
              {errors.targetAudience && <Text style={[styles.errorText, { color: c.destructive }]}>{errors.targetAudience}</Text>}
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            entering={isWeb ? undefined : FadeIn}
            exiting={isWeb ? undefined : FadeOut}
            key="step-2"
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Brand Message</Text>
            <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
              What are the top 3 things you want your logo to communicate?
            </Text>

            <Text style={[styles.tip, { color: c.mutedForeground, borderColor: c.border, backgroundColor: c.card }]}>
              💡 Examples: Quality, Trust, Affordable, Luxury, Innovation, Boldness, Growth, Unity, Creativity.
            </Text>

            {[0, 1, 2].map((idx) => (
              <View key={idx} style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.foreground }]}>Message #{idx + 1} *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: c.card,
                      borderColor: errors[`message${idx + 1}`] ? c.destructive : c.border,
                      color: c.foreground,
                    },
                  ]}
                  placeholder={`Brand communication #${idx + 1}`}
                  placeholderTextColor={c.mutedForeground}
                  value={form.top3Things[idx]}
                  onChangeText={(val) => {
                    const nextThings = [...form.top3Things] as [string, string, string];
                    nextThings[idx] = val;
                    updateField("top3Things", nextThings);
                  }}
                />
                {errors[`message${idx + 1}`] && (
                  <Text style={[styles.errorText, { color: c.destructive }]}>{errors[`message${idx + 1}`]}</Text>
                )}
              </View>
            ))}
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View
            entering={isWeb ? undefined : FadeIn}
            exiting={isWeb ? undefined : FadeOut}
            key="step-3"
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Additional Details</Text>
            <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
              Add any extra references, sketches, or inspirations for our design team.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: c.foreground }]}>Logo ideas & Inspiration Links</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
                placeholder="Do you have any logo ideas, inspirations, references, links, or additional information?"
                placeholderTextColor={c.mutedForeground}
                multiline
                numberOfLines={4}
                value={form.ideas}
                onChangeText={(val) => updateField("ideas", val)}
              />
            </View>

            <View style={styles.uploadSection}>
              <Text style={[styles.label, { color: c.foreground }]}>Upload references (Mock)</Text>
              <View style={styles.uploadRow}>
                <Pressable
                  style={[styles.uploadCard, { backgroundColor: c.card, borderColor: c.border }]}
                  onPress={() => Haptics.selectionAsync()}
                >
                  <Feather name="image" size={24} color={c.primary} />
                  <Text style={[styles.uploadText, { color: c.foreground }]}>Upload Inspiration</Text>
                </Pressable>
                <Pressable
                  style={[styles.uploadCard, { backgroundColor: c.card, borderColor: c.border }]}
                  onPress={() => Haptics.selectionAsync()}
                >
                  <Feather name="file-text" size={24} color={c.primary} />
                  <Text style={[styles.uploadText, { color: c.foreground }]}>Upload Reference</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View
            entering={isWeb ? undefined : FadeIn}
            exiting={isWeb ? undefined : FadeOut}
            key="step-4"
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Colors Desired</Text>
            <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
              Please describe the colors you would like to see (or not see) in your logo
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.textarea,
                  { backgroundColor: c.card, borderColor: errors.colors ? c.destructive : c.border, color: c.foreground },
                ]}
                placeholder="Describe your color preferences in detail..."
                placeholderTextColor={c.mutedForeground}
                multiline
                numberOfLines={4}
                value={form.colors}
                onChangeText={(val) => updateField("colors", val)}
              />
              {errors.colors && <Text style={[styles.errorText, { color: c.destructive }]}>{errors.colors}</Text>}
            </View>

            <Text style={[styles.colorSubtitle, { color: c.foreground }]}>Color Association Guide</Text>
            <View style={styles.colorsGrid}>
              {COLOR_CARDS.map((color) => (
                <View
                  key={color.colorName}
                  style={[styles.colorCard, { backgroundColor: color.bg, borderColor: c.border }]}
                >
                  <Text style={[styles.colorCardName, { color: color.darkText ? "#000" : "#FFF" }]}>
                    {color.colorName}
                  </Text>
                  <Text style={[styles.colorCardDesc, { color: color.darkText ? "#333" : "#EEE" }]}>
                    {color.desc}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View
            entering={isWeb ? undefined : FadeIn}
            exiting={isWeb ? undefined : FadeOut}
            key="step-5"
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Logo Styles</Text>
            <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
              Please select the styles that you would like to see for your logo. Select at least 1.
            </Text>

            {errors.styles && <Text style={[styles.errorText, { color: c.destructive, marginBottom: 12 }]}>{errors.styles}</Text>}

            <View style={styles.stylesList}>
              {STYLE_OPTIONS.map((style) => {
                const isSelected = form.styles.includes(style.id);
                return (
                  <Pressable
                    key={style.id}
                    style={[
                      styles.styleCard,
                      { backgroundColor: c.card, borderColor: isSelected ? c.primary : c.border },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (isSelected) {
                        updateField(
                          "styles",
                          form.styles.filter((s) => s !== style.id),
                        );
                      } else {
                        updateField("styles", [...form.styles, style.id]);
                      }
                    }}
                  >
                    <View style={[styles.styleIconWrapper, { backgroundColor: isSelected ? c.primary : c.muted }]}>
                      <Feather name={style.icon as any} size={20} color={isSelected ? "#FFF" : c.primary} />
                    </View>
                    <View style={styles.styleCardContent}>
                      <Text style={[styles.styleCardTitle, { color: c.foreground }]}>{style.title}</Text>
                      <Text style={[styles.styleCardDesc, { color: c.mutedForeground }]}>{style.desc}</Text>
                    </View>
                    <View style={[styles.styleCheckbox, { borderColor: c.border, backgroundColor: isSelected ? c.primary : "transparent" }]}>
                      {isSelected && <Feather name="check" size={12} color="#FFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        );

      case 6:
        return (
          <Animated.View
            entering={isWeb ? undefined : FadeIn}
            exiting={isWeb ? undefined : FadeOut}
            key="step-6"
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Style Sliders</Text>
            <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
              Drag the sliders between the opposing words to best describe your brand personality.
            </Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} style={{ maxHeight: 450 }}>
              {SLIDERS_CONFIG.map((slider) => (
                <CustomSlider
                  key={slider.key}
                  left={slider.left}
                  right={slider.right}
                  value={form.sliders[slider.key]}
                  onChange={(val) => {
                    const nextSliders = { ...form.sliders };
                    nextSliders[slider.key] = val;
                    updateField("sliders", nextSliders);
                  }}
                />
              ))}
            </ScrollView>
          </Animated.View>
        );

      case 7:
        return (
          <Animated.View
            entering={isWeb ? undefined : FadeIn}
            exiting={isWeb ? undefined : FadeOut}
            key="step-7"
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: c.foreground }]}>Complete Order & Pay</Text>
            <Text style={[styles.stepDesc, { color: c.mutedForeground }]}>
              Double check your order summary and complete payment.
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.summaryTitle, { color: c.foreground }]}>Order Details</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.mutedForeground }]}>Package</Text>
                <Text style={[styles.summaryVal, { color: c.foreground }]}>Premium Custom Logo Design</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.mutedForeground }]}>Business Name</Text>
                <Text style={[styles.summaryVal, { color: c.foreground }]}>{form.businessName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.mutedForeground }]}>Industry</Text>
                <Text style={[styles.summaryVal, { color: c.foreground }]}>{form.industry}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabelBold, { color: c.foreground }]}>Grand Total</Text>
                <Text style={[styles.summaryTotal, { color: c.primary }]}>₹4,999</Text>
              </View>
            </View>

            <Pressable
              style={[styles.payButton, { backgroundColor: c.primary }]}
              onPress={triggerPaymentMock}
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="lock" size={16} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.payButtonText}>Pay Now ₹4,999</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        );
    }
  };

  if (success) {
    return (
      <View style={[styles.successContainer, { backgroundColor: c.background }]}>
        <Animated.View entering={isWeb ? undefined : FadeIn} style={styles.successCard}>
          <View style={[styles.successIconWrapper, { backgroundColor: c.primary }]}>
            <Feather name="check" size={48} color="#FFF" />
          </View>
          <Text style={[styles.successTitle, { color: c.foreground }]}>Request Submitted!</Text>
          <Text style={[styles.successText, { color: c.mutedForeground }]}>
            Your logo request has been submitted successfully.
          </Text>
          <View style={[styles.idCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.idLabel, { color: c.mutedForeground }]}>REQUEST ID</Text>
            <Text style={[styles.idVal, { color: c.primary }]}>{generatedId}</Text>
          </View>
          <Pressable
            style={[styles.successButton, { backgroundColor: c.primary }]}
            onPress={() => router.replace("/(tabs)/profile")}
          >
            <Text style={styles.successButtonText}>Back to Profile</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.navBar, { paddingTop: insets.top + 10, borderBottomColor: c.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: c.foreground }]}>Custom Logo Design</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressWrapper}>
        <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: c.primary, width: (`${(step / 7) * 100}%` as DimensionValue) },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: c.mutedForeground }]}>
          Step {step} of 7
        </Text>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      {step < 7 && (
        <View style={[styles.footerNav, { paddingBottom: insets.bottom + 16 }]}>
          {step > 1 ? (
            <Pressable
              style={[styles.navBtn, styles.backBtn, { borderColor: c.border, backgroundColor: c.card }]}
              onPress={handleBack}
            >
              <Text style={[styles.backBtnText, { color: c.foreground }]}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <Pressable style={[styles.navBtn, styles.nextBtn, { backgroundColor: c.primary }]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Feather name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  progressWrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
    textAlign: "right",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
    position: "relative",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownOptions: {
    position: "absolute",
    top: 76,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 100,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownOption: {
    padding: 14,
  },
  tip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 20,
  },
  uploadSection: {
    marginTop: 12,
  },
  uploadRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  uploadCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  colorSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 16,
    marginBottom: 12,
  },
  colorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    height: 90,
    justifyContent: "center",
  },
  colorCardName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  colorCardDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  stylesList: {
    gap: 12,
  },
  styleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  styleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  styleCardContent: {
    flex: 1,
  },
  styleCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  styleCardDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  styleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sliderLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  sliderValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    width: 50,
  },
  sliderTrackWrapper: {
    height: 30,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 3,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    top: -7,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryVal: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
    marginBottom: 12,
  },
  summaryLabelBold: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  summaryTotal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  payButton: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  footerNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    borderWidth: 1,
  },
  nextBtn: {},
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  nextBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  successIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  successText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  idCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
  },
  idLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  idVal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  successButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  successButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
