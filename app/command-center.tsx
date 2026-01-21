/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/lib/theme-context";
import { useThemedStyles } from "@/lib/use-themed-styles";
import { X, Bell, User, Calendar, ShoppingCart, Check } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.warn('DateTimePicker not available');
  }
}

// Persist the last selected section across remounts (helps on some iOS dev setups)
let lastSelectedSection: "notifications" | "account" | "meetings" | "orders" =
  "notifications";

export default function CommandCenter() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { colors } = useThemedStyles();

  const [selectedSection, setSelectedSectionState] = useState<
    "notifications" | "account" | "meetings" | "orders"
  >(lastSelectedSection);

  const setSelectedSection = (
    section: "notifications" | "account" | "meetings" | "orders"
  ) => {
    console.log("[CommandCenter] setSelectedSection called with", section);
    lastSelectedSection = section;
    setSelectedSectionState(section);
  };

  console.log("[CommandCenter] render, selectedSection =", selectedSection);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Command Center",
          presentation: "modal",
          headerStyle: {
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
          },
          headerTintColor: isDark ? "#fff" : "#000",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.menuScroll}
        contentContainerStyle={[
          styles.menuContainer,
          isDark && styles.menuContainerDark,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={[
            styles.menuButton,
            { backgroundColor: selectedSection === "notifications" ? 'transparent' : colors.card },
            selectedSection !== "notifications" && { borderColor: colors.border },
          ]}
          onPress={() => setSelectedSection("notifications")}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {selectedSection === "notifications" ? (
            <View style={styles.menuButtonGradient}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <Bell size={16} color="#FFFFFF" />
              <Text style={styles.menuButtonTextActive}>Notifications</Text>
            </View>
          ) : (
            <View style={styles.menuButtonContent}>
              <Bell size={16} color={colors.text} />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>Notifications</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuButton,
            { backgroundColor: selectedSection === "account" ? 'transparent' : colors.card },
            selectedSection !== "account" && { borderColor: colors.border },
          ]}
          onPress={() => {
            console.log('[CommandCenter] Account button pressed');
            setSelectedSection("account");
          }}
          onPressIn={() => console.log('[CommandCenter] Account button touch detected')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {selectedSection === "account" ? (
            <View style={styles.menuButtonGradient}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <User size={16} color="#FFFFFF" />
              <Text style={styles.menuButtonTextActive}>Account</Text>
            </View>
          ) : (
            <View style={styles.menuButtonContent}>
              <User size={16} color={colors.text} />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>Account</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuButton,
            { backgroundColor: selectedSection === "meetings" ? 'transparent' : colors.card },
            selectedSection !== "meetings" && { borderColor: colors.border },
          ]}
          onPress={() => {
            console.log('[CommandCenter] Meetings button pressed');
            setSelectedSection("meetings");
          }}
          onPressIn={() => console.log('[CommandCenter] Meetings button touch detected')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {selectedSection === "meetings" ? (
            <View style={styles.menuButtonGradient}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <Calendar size={16} color="#FFFFFF" />
              <Text style={styles.menuButtonTextActive}>Meetings</Text>
            </View>
          ) : (
            <View style={styles.menuButtonContent}>
              <Calendar size={16} color={colors.text} />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>Meetings</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuButton,
            { backgroundColor: selectedSection === "orders" ? 'transparent' : colors.card },
            selectedSection !== "orders" && { borderColor: colors.border },
          ]}
          onPress={() => {
            console.log('[CommandCenter] Orders button pressed');
            setSelectedSection("orders");
          }}
          onPressIn={() => console.log('[CommandCenter] Orders button touch detected')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {selectedSection === "orders" ? (
            <View style={styles.menuButtonGradient}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <ShoppingCart size={16} color="#FFFFFF" />
              <Text style={styles.menuButtonTextActive}>Orders</Text>
            </View>
          ) : (
            <View style={styles.menuButtonContent}>
              <ShoppingCart size={16} color={colors.text} />
              <Text style={[styles.menuButtonText, { color: colors.text }]}>Orders</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={[styles.content, isDark && styles.contentDark]}>
        {selectedSection === "notifications" && <NotificationsSection isDark={isDark} />}
        {selectedSection === "account" && <AccountSection isDark={isDark} />}
        {selectedSection === "meetings" && <MeetingsSection isDark={isDark} />}
        {selectedSection === "orders" && <OrdersSection isDark={isDark} />}
      </ScrollView>
    </View>
  );
}

function NotificationsSection({ isDark }: { isDark: boolean }) {
  console.log("[CommandCenter] render NotificationsSection");
  const { data: notifications, isLoading } = trpc.commandCenter.getNotifications.useQuery();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
        Notifications
      </Text>
      {notifications?.map((notification) => (
        <View
          key={notification.id}
          style={[styles.notificationCard, isDark && styles.cardDark]}
        >
          <Text style={[styles.notificationTitle, isDark && styles.textDark]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationBody, isDark && styles.textSecondaryDark]}>
            {notification.body}
          </Text>
          <Text style={styles.notificationTime}>
            {new Date(notification.timestamp).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AccountSection({ isDark }: { isDark: boolean }) {
  console.log("[CommandCenter] render AccountSection");
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [resetEmail, setResetEmail] = useState("");

  const updateProfileMutation = trpc.commandCenter.updateProfile.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Profile updated successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const resetPasswordMutation = trpc.commandCenter.resetPassword.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Password reset instructions sent to your email");
      setResetEmail("");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleUpdateProfile = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (name.length < 2) {
      Alert.alert("Error", "Name must be at least 2 characters");
      return;
    }
    updateProfileMutation.mutate({ name, email });
  };

  const handleResetPassword = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    resetPasswordMutation.mutate({ email: resetEmail });
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
        Account Settings
      </Text>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.label, isDark && styles.textDark]}>Name</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={isDark ? "#666" : "#999"}
        />

        <Text style={[styles.label, isDark && styles.textDark]}>Email</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={isDark ? "#666" : "#999"}
        />

        <TouchableOpacity
          style={[
            styles.button,
            updateProfileMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleUpdateProfile}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, isDark && styles.cardDark, { marginTop: 20 }]}>
        <Text style={[styles.cardTitle, isDark && styles.textDark]}>
          Reset Password
        </Text>
        <Text style={[styles.cardDescription, isDark && styles.textSecondaryDark]}>
          Enter your email to receive password reset instructions
        </Text>

        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={resetEmail}
          onChangeText={setResetEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={isDark ? "#666" : "#999"}
        />

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSecondary,
            resetPasswordMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text style={styles.buttonSecondaryText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MeetingsSection({ isDark }: { isDark: boolean }) {
  console.log("[CommandCenter] render MeetingsSection");
  const { data: slots, isLoading } = trpc.commandCenter.getAvailability.useQuery();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const bookMeetingMutation = trpc.commandCenter.bookMeeting.useMutation({
    onSuccess: (data) => {
      Alert.alert("Success", data.message);
      setSelectedSlot(null);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleBookMeeting = (slot: any) => {
    setSelectedSlot(slot.id);
    Alert.alert(
      "Confirm Booking",
      `Book meeting for ${slot.date} at ${slot.time}?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setSelectedSlot(null) },
        {
          text: "Confirm",
          onPress: () =>
            bookMeetingMutation.mutate({
              slotId: slot.id,
              date: slot.date,
              time: slot.time,
            }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const groupedSlots = slots?.reduce((acc: any, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
        Book a Meeting
      </Text>
      <Text style={[styles.sectionDescription, isDark && styles.textSecondaryDark]}>
        Select an available time slot to schedule a meeting
      </Text>

      {Object.entries(groupedSlots || {}).map(([date, daySlots]: [string, any]) => (
        <View key={date} style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.dateHeader, isDark && styles.textDark]}>
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <View style={styles.slotsContainer}>
            {daySlots.map((slot: any) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotButton,
                  !slot.available && styles.slotButtonDisabled,
                  selectedSlot === slot.id && styles.slotButtonSelected,
                  isDark && styles.slotButtonDark,
                ]}
                onPress={() => slot.available && handleBookMeeting(slot)}
                disabled={!slot.available || bookMeetingMutation.isPending}
              >
                <Text
                  style={[
                    styles.slotButtonText,
                    !slot.available && styles.slotButtonTextDisabled,
                    selectedSlot === slot.id && styles.slotButtonTextSelected,
                    isDark && styles.slotButtonTextDark,
                  ]}
                >
                  {slot.time}
                </Text>
                {selectedSlot === slot.id && bookMeetingMutation.isPending && (
                  <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function OrdersSection({ isDark }: { isDark: boolean }) {
  console.log("[CommandCenter] render OrdersSection");
  const [productType, setProductType] = useState<
    "360 Virtual Tour" | "Photo Shoot" | "Video Shoot"
  >("360 Virtual Tour");
  const [numberOfImages, setNumberOfImages] = useState("");
  const [shootDate, setShootDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [comments, setComments] = useState("");

  const submitOrderMutation = trpc.commandCenter.submitOrder.useMutation({
    onSuccess: (data) => {
      Alert.alert("Success", data.message);
      setNumberOfImages("");
      setShootDate(undefined);
      setComments("");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      setShootDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmitOrder = () => {
    const imageCount = numberOfImages ? parseInt(numberOfImages, 10) : undefined;

    if (
      (productType === "360 Virtual Tour" || productType === "Photo Shoot") &&
      (!imageCount || imageCount < 1)
    ) {
      Alert.alert("Error", "Please enter a valid number of images");
      return;
    }

    submitOrderMutation.mutate({
      productType,
      numberOfImages: imageCount,
      shootDate: shootDate ? shootDate.toISOString() : undefined,
      comments: comments || undefined,
    });
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
        Order More Content
      </Text>
      <Text style={[styles.sectionDescription, isDark && styles.textSecondaryDark]}>
        Submit a request for new content production
      </Text>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.label, isDark && styles.textDark]}>Product Type</Text>
        <View style={styles.productTypeContainer}>
          {(["360 Virtual Tour", "Photo Shoot", "Video Shoot"] as const).map(
            (type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.productTypeButton,
                  productType === type && styles.productTypeButtonActive,
                  isDark && styles.productTypeButtonDark,
                ]}
                onPress={() => setProductType(type)}
              >
                <Text
                  style={[
                    styles.productTypeButtonText,
                    productType === type && styles.productTypeButtonTextActive,
                    isDark && styles.productTypeButtonTextDark,
                  ]}
                >
                  {type}
                </Text>
                {productType === type && (
                  <Check size={16} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            )
          )}
        </View>

        {productType !== "Video Shoot" && (
          <>
            <Text style={[styles.label, isDark && styles.textDark, { marginTop: 16 }]}>
              Number of Images
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={numberOfImages}
              onChangeText={setNumberOfImages}
              placeholder="Enter number of images"
              keyboardType="number-pad"
              placeholderTextColor={isDark ? "#666" : "#999"}
            />
          </>
        )}

        <Text style={[styles.label, isDark && styles.textDark, { marginTop: 16 }]}>
          Intended Shoot Date (Optional)
        </Text>
        <TouchableOpacity
          style={[styles.datePickerButton, isDark && styles.datePickerButtonDark]}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={20} color={shootDate ? (isDark ? "#fff" : "#000") : "#999"} />
          <Text style={[styles.datePickerText, isDark && styles.datePickerTextDark, !shootDate && styles.datePickerPlaceholder]}>
            {shootDate ? formatDate(shootDate) : "Select a date"}
          </Text>
          {shootDate && (
            <TouchableOpacity
              onPress={() => setShootDate(undefined)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={isDark ? "#666" : "#999"} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showDatePicker && Platform.OS !== 'web' && DateTimePicker && (
          Platform.OS === 'ios' ? (
            <View style={[styles.datePickerContainer, isDark && styles.datePickerContainerDark]}>
              <DateTimePicker
                value={shootDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                textColor={isDark ? "#fff" : "#000"}
              />
              <TouchableOpacity
                style={styles.datePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <DateTimePicker
              value={shootDate || new Date()}
              mode="date"
              display="calendar"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )
        )}

        {showDatePicker && Platform.OS === 'web' && (
          <View style={[styles.card, isDark && styles.cardDark, { marginTop: 0, marginBottom: 16 }]}>
            <Text style={[styles.label, isDark && styles.textDark]}>Date Picker not supported on web. Please use native app.</Text>
            <TouchableOpacity
              style={styles.datePickerDoneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.label, isDark && styles.textDark, { marginTop: 16 }]}>
          Comments (Optional)
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, isDark && styles.inputDark]}
          value={comments}
          onChangeText={setComments}
          placeholder="Add any special requirements or notes"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={isDark ? "#666" : "#999"}
        />

        <TouchableOpacity
          style={[
            styles.button,
            submitOrderMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleSubmitOrder}
          disabled={submitOrderMutation.isPending}
        >
          {submitOrderMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  menuScroll: {
    flexGrow: 0,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center" as const,
    flexDirection: "row" as const,
  },
  menuContainerDark: {
    backgroundColor: "#000",
  },
  menuButton: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
    minHeight: 44,
  },
  menuButtonContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    minHeight: 44,
  },
  menuButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    minHeight: 44,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  menuButtonTextActive: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  content: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentDark: {
    backgroundColor: "#000",
  },
  debugBar: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    alignItems: "center" as const,
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  debugBarDark: {
    backgroundColor: "#1a1a1a",
    borderBottomColor: "#007AFF",
  },
  debugText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#007AFF",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 8,
    color: "#000",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
    color: "#000",
  },
  notificationBody: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#1a1a1a",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 4,
    color: "#000",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
    color: "#000",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#000",
  },
  inputDark: {
    backgroundColor: "#2a2a2a",
    borderColor: "#333",
    color: "#fff",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  buttonSecondaryText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
    color: "#000",
  },
  slotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
    justifyContent: "center",
  },
  slotButtonDark: {
    backgroundColor: "#2a2a2a",
  },
  slotButtonDisabled: {
    opacity: 0.4,
  },
  slotButtonSelected: {
    backgroundColor: "#007AFF",
  },
  slotButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
  },
  slotButtonTextDark: {
    color: "#fff",
  },
  slotButtonTextDisabled: {
    color: "#999",
  },
  slotButtonTextSelected: {
    color: "#fff",
  },
  productTypeContainer: {
    gap: 8,
  },
  productTypeButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  productTypeButtonDark: {
    backgroundColor: "#2a2a2a",
  },
  productTypeButtonActive: {
    backgroundColor: "#007AFF",
  },
  productTypeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#000",
  },
  productTypeButtonTextDark: {
    color: "#fff",
  },
  productTypeButtonTextActive: {
    color: "#fff",
  },
  textDark: {
    color: "#fff",
  },
  textSecondaryDark: {
    color: "#999",
  },
  datePickerButton: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    minHeight: 48,
  },
  datePickerButtonDark: {
    backgroundColor: "#2a2a2a",
    borderColor: "#333",
  },
  datePickerText: {
    fontSize: 16,
    color: "#000",
    flex: 1,
  },
  datePickerTextDark: {
    color: "#fff",
  },
  datePickerPlaceholder: {
    color: "#999",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerContainerDark: {
    backgroundColor: "#1a1a1a",
  },
  datePickerDoneButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center" as const,
    marginTop: 12,
  },
  datePickerDoneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
