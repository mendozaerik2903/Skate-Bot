import CustomHeader from "@/components/CustomHeader";
import FavoriteSpotSheet from "@/components/FavoriteSpotSheet";
import FavoriteTrickSheet from "@/components/FavoriteTrickSheet";
import GuestUpsell from "@/components/GuestUpsell";
import { MASTER_BOT_TRICKS } from "@/constants/bot-tricks";
import { useProfile } from "@/hooks/useProfile";
import { buildBotPool } from "@/utility/pool-builder";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { User as UserIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "../../utility/auth";
import { API_URL } from "../../utility/config";
import { fetchWithAuth } from "../../utility/fetchWithAuth";
import { isGuestMode } from "../../utility/guest-mode";
import { StatusBar } from "expo-status-bar";

type DebugUser = {
  username: string;
  email: string;
};

function formatLastActive(lastActive: string | null): string {
  if (!lastActive) return "No games yet";
  const diffMs = Date.now() - new Date(lastActive).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Profile() {
  const router = useRouter();

  const [favSheetVisible, setFavSheetVisible] = useState(false);
  const [spotSheetVisible, setSpotSheetVisible] = useState(false);
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const [debugUser, setDebugUser] = useState<DebugUser | null>(null);
  const { profile, saveFavoriteTrick, saveFavoriteSpot } = useProfile();

  // Re-check on every focus, not just mount — a guest can sign up from
  // this same tab and come back here still authenticated.
  useFocusEffect(
    useCallback(() => {
      isGuestMode().then(setIsGuest);
    }, []),
  );

  // Debug-only: confirm which account is actually signed in on this device.
  // Also the source of truth for @username in the header until there's a
  // dedicated field for it.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const response = await fetchWithAuth("/auth/me");
          if (!response.ok) return;
          const data = await response.json();
          if (!cancelled) {
            setDebugUser({
              username: data.user.username,
              email: data.user.email,
            });
          }
        } catch {
          // Debug info only — silently skip on guest/expired session
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

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

  if (isGuest === null) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <CustomHeader title="profile" />
      </SafeAreaView>
    );
  }

  if (isGuest) {
    return <GuestUpsell title="profile" feature="your Profile" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CustomHeader
        title="My Profile"
        rightIconName="settings"
        onRightIconPress={() => router.push("/settings")}
      />
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

      <View style={styles.mainContainer}>
        <Text style={styles.lastActive}>
          Last Active: {formatLastActive(profile?.lastActive ?? null)}
        </Text>

        <View style={styles.avatar}>
          <UserIcon size={56} color="#04342C" strokeWidth={1.5} />
        </View>

        <Text style={styles.username}>@{debugUser?.username ?? "..."}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>20</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>79</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>122</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setFavSheetVisible(true)}
          >
            <Text style={styles.cardLabel}>Favorite Trick</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {profile?.favoriteTrickName ?? "Set a trick"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSpotSheetVisible(true)}
          >
            <Text style={styles.cardLabel}>Favorite Skatepark</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {profile?.favoriteSpot?.name ?? "Set a spot"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.gridSquare} />
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {debugUser && (
          <Text style={styles.debugText}>
            DEBUG: {debugUser.username} · {debugUser.email}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
  },
  lastActive: {
    fontSize: 15,
    color: "#111",
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  statItem: {
    alignItems: "flex-start",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  statLabel: {
    fontSize: 14,
    color: "#111",
  },
  cardsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginBottom: 18,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    minHeight: 64,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B1B3A",
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0B1B3A",
    marginTop: 2,
    textTransform: "capitalize",
  },
  divider: {
    width: "100%",
    height: 2,
    backgroundColor: "#111",
    marginBottom: 14,
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridSquare: {
    width: "31.5%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  signOutButton: {
    marginTop: 20,
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  debugText: {
    marginTop: 16,
    fontSize: 11,
    color: "rgba(0,0,0,0.5)",
    fontFamily: "monospace",
  },
});