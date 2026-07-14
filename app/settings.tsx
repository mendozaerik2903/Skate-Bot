import CustomHeader from "@/components/CustomHeader";
import FavoriteSpotSheet from "@/components/FavoriteSpotSheet";
import FavoriteTrickSheet from "@/components/FavoriteTrickSheet";
import { MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { useProfile } from "@/hooks/useProfile";
import { buildBotPool } from "@/utility/pool-builder";
import { useRouter } from "expo-router";
import { Pencil, User as UserIcon } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearTokens, getAccessToken, getRefreshToken } from "../utility/auth";
import { API_URL } from "../utility/config";

export default function Settings() {
  const router = useRouter();
  const { profile, saveFavoriteTrick, saveFavoriteSpot } = useProfile();

  const [favSheetVisible, setFavSheetVisible] = useState(false);
  const [spotSheetVisible, setSpotSheetVisible] = useState(false);

  // Not backed by a DB column yet — local-only until there's a real
  // place for these on user_profile. See handoff note below.
  const [statusVisible, setStatusVisible] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  const handleSignOut = async () => {
    const refreshToken = await getRefreshToken();

    try {
      await fetch(`${API_URL}/auth/signout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      // even if the server call fails, clear tokens locally
    }

    await clearTokens();
    router.replace("/(auth)/signin");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader showBackButton title="Settings" />

      <FavoriteTrickSheet
        visible={favSheetVisible}
        onClose={() => setFavSheetVisible(false)}
        pool={buildBotPool(MASTER_BOT_TRICKS)}
        currentFavorite={profile?.favoriteTrickName ?? null}
        onSave={saveFavoriteTrick}
      />
      <FavoriteSpotSheet
        visible={spotSheetVisible}
        onClose={() => setSpotSheetVisible(false)}
        currentFavoriteId={profile?.favoriteSpot?.id ?? null}
        onSave={saveFavoriteSpot}
      />

      <View style={styles.body}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <UserIcon size={56} color="#04342C" strokeWidth={1.5} />
          </View>
          {/* No upload flow yet — same placeholder-only decision as the
              avatar on the profile screen. */}
          <TouchableOpacity onPress={() => null}>
            <Text style={styles.changePhoto}>Change photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => setFavSheetVisible(true)}
        >
          <Text style={styles.rowLabel}>Favorite Trick</Text>
          <View style={styles.rowValueGroup}>
            <Text style={styles.rowValue} numberOfLines={1}>
              {profile?.favoriteTrickName ?? "Set a trick"}
            </Text>
            <Pencil size={16} color="#0B1B3A" strokeWidth={2} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setSpotSheetVisible(true)}
        >
          <Text style={styles.rowLabel}>Favorite Skatepark</Text>
          <View style={styles.rowValueGroup}>
            <Text style={styles.rowValue} numberOfLines={2}>
              {profile?.favoriteSpot?.name ?? "Set a spot"}
            </Text>
            <Pencil size={16} color="#0B1B3A" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status Visibility</Text>
          <View style={styles.rowValueGroup}>
            <Text style={styles.rowValue}>{statusVisible ? "Show" : "Hidden"}</Text>
            <Switch
              value={statusVisible}
              onValueChange={setStatusVisible}
              trackColor={{ true: "#3D5AFE", false: "#ccc" }}
            />
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Profile Visibility</Text>
          <View style={styles.rowValueGroup}>
            <Text style={styles.rowValue}>
              {profilePublic ? "Public" : "Private"}
            </Text>
            <Switch
              value={profilePublic}
              onValueChange={setProfilePublic}
              trackColor={{ true: "#3D5AFE", false: "#ccc" }}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.logOutSection}>
          <TouchableOpacity style={styles.logOutButton} onPress={handleSignOut}>
            <Text style={styles.logOutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  changePhoto: {
    fontSize: 16,
    color: "#111",
  },
  divider: {
    height: 2,
    backgroundColor: "#111",
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: "#111",
  },
  rowValueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  rowValue: {
    fontSize: 16,
    color: "#111",
    textAlign: "right",
    textTransform: "capitalize",
  },
  logOutSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  logOutButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 28,
  },
  logOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
});