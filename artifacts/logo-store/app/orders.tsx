import { Feather } from "@expo/vector-icons";
// Import icons to show back arrows and download symbols
import { Image } from "expo-image";
// Import a fast image component to show product pictures
import { useRouter } from "expo-router";
// Import the router to navigate between different screens
import React, { useState } from "react";
// Import React and useState to handle data changes on the screen
import {
  ActivityIndicator,
  // A spinning wheel to show that something is loading
  FlatList,
  // A list component to show many orders efficiently
  Platform,
  // A helper to check if the app is running on Web, iOS, or Android
  Pressable,
  // A button-like component that can be pressed
  StyleSheet,
  // A way to define how the components should look
  Text,
  // A component to display text
  View,
  // A container component to group other parts together
} from "react-native";
// End of React Native imports

import Animated, { FadeInDown } from "react-native-reanimated";
// Import animation tools to make the list items slide in smoothly
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Import a tool to handle screen notches and safe areas
import { useGetOrders, getBaseUrl } from "@workspace/api-client-react";
// Import functions to fetch orders and get the server's web address
import { Paths, File } from "expo-file-system";
// Import the new File System API to save files on the device
import * as Sharing from "expo-sharing";
// Import sharing tools to let users save or send downloaded files
import colors from "@/constants/colors";
// Import the color scheme used in the app

export default function OrdersScreen() {
  // Define the main screen for showing the order history
  const router = useRouter();
  // Get the router instance to handle back navigation
  const c = colors.dark;
  // Use the dark mode color palette
  const insets = useSafeAreaInsets();
  // Get the safe area spacing for the current device
  const { data: orders, isLoading } = useGetOrders();
  // Fetch the list of orders and check if they are still loading

  const [downloadingOrderId, setDownloadingOrderId] = useState<number | null>(null);
  // Keep track of which order is currently being downloaded

  const handleDownload = async (orderId: number, items: any[]) => {
    // A function to download the logo files for a specific order
    try {
      // Start a try block to catch any errors during download
      setDownloadingOrderId(orderId);
      // Mark this order as "currently downloading" to show the spinner

      for (const oi of items) {
        // Loop through each item in the order to download its image
        const imageUrl = oi.product.imageUrl;
        // Get the link to the product's image
        const title = oi.product.title;
        // Get the name of the product
        const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${getBaseUrl() || ""}${imageUrl}`;
        // Create a complete web link for the image

        // Force download file extension to always be .jpg
        const extension = "jpg";
        // Set the file type to JPG
        const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
        // Remove special characters from the name to make it a safe filename
        const filename = `${sanitizedTitle}.${extension}`;
        // Combine the name and extension to create the final filename

        if (Platform.OS === "web") {
          // If the app is running in a web browser
          const res = await fetch(fullUrl);
          // Fetch the image data from the web address
          const blob = await res.blob();
          // Convert the fetched data into a file-like "blob" object
          const blobUrl = window.URL.createObjectURL(blob);
          // Create a temporary link for the browser to download the blob
          const link = document.createElement("a");
          // Create a hidden "anchor" tag in the browser
          link.href = blobUrl;
          // Set the link's address to the blob URL
          link.download = filename;
          // Set the name of the file to be saved
          document.body.appendChild(link);
          // Add the link to the page temporarily
          link.click();
          // Simulate a click on the link to start the download
          document.body.removeChild(link);
          // Remove the link from the page after clicking
          window.URL.revokeObjectURL(blobUrl);
          // Delete the temporary blob URL to save memory
        } else {
          // If the app is running on a mobile device (iOS or Android)
          const localFile = new File(Paths.document, filename);
          // Create a reference to a new file in the app's documents folder
          const downloadResult = await File.downloadFileAsync(fullUrl, localFile, { idempotent: true });
          // Download the image from the web and save it to the local file

          if (downloadResult.exists) {
            // Check if the file was successfully saved
            const isSharingAvailable = await Sharing.isAvailableAsync();
            // Check if the device can show a "share" or "save to files" menu
            if (isSharingAvailable) {
              // If sharing is possible
              await Sharing.shareAsync(downloadResult.uri, {
                // Open the share menu with the downloaded file
                mimeType: "image/jpeg",
                // Tell the device that this is a JPEG image
                dialogTitle: `Save ${title}`,
                // Set the title for the sharing menu
              });
              // End of sharing process
            } else {
              // If the device cannot share files
              alert("Saving to Files is not supported on this device.");
              // Show an alert message to the user
            }
            // End of sharing check
          } else {
            // If the file was not found after downloading
            alert(`Failed to download ${title}`);
            // Show an error message for the specific product
          }
          // End of file existence check
        }
        // End of platform-specific download logic
      }
      // End of items loop
    } catch (err) {
      // If any error happens during the download or save process
      console.error("Download error:", err);
      // Log the error details for the developer
      alert("Downloading fail ho gaya. Kripya dobara koshish karein.");
      // Show a simple error message to the user in Hindi/English
    } finally {
      // After everything is finished, whether it succeeded or failed
      setDownloadingOrderId(null);
      // Stop showing the loading spinner for this order
    }
    // End of the download function
  };
  // End of handleDownload definition


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
                    <View style={[
                      styles.statusBadge, 
                      item.status === 'completed' ? { backgroundColor: "#22C55E20", borderColor: "#22C55E44" } :
                      item.status === 'rejected' ? { backgroundColor: "#EF444420", borderColor: "#EF444444" } :
                      { backgroundColor: "#F59E0B20", borderColor: "#F59E0B44" }
                    ]}>
                      <Text style={{ 
                        color: item.status === 'completed' ? "#22C55E" : item.status === 'rejected' ? "#EF4444" : "#F59E0B", 
                        fontSize: 12, 
                        fontFamily: "Inter_600SemiBold",
                        textTransform: "capitalize"
                      }}>
                        {item.status}
                      </Text>
                    </View>
                    <Text style={[styles.orderTotal, { color: c.foreground }]}>
                      ₹{parseFloat(item.totalAmount as unknown as string).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.itemsRow]}>
                  {item.items.slice(0, 4).map((oi) => (
                    <Image
                      key={oi.id}
                      source={{ uri: oi.product.imageUrl.startsWith("http") ? oi.product.imageUrl : `${getBaseUrl() || ""}${oi.product.imageUrl}` }}
                      style={[styles.thumbImage, { borderColor: c.border }]}
                      contentFit="contain"
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
                  onPress={() => handleDownload(item.id, item.items)}
                  disabled={downloadingOrderId !== null}
                >
                  {downloadingOrderId === item.id ? (
                    <ActivityIndicator size="small" color={c.primary} />
                  ) : (
                    <>
                      <Feather name="download" size={14} color={c.primary} />
                      <Text style={[styles.downloadText, { color: c.primary }]}>Download Files</Text>
                    </>
                  )}
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
