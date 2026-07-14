import { FavoriteSpot } from "@/components/FavoriteSpotSheet";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { fetchWithAuth } from "../utility/fetchWithAuth";

export type ProfileData = {
  favoriteTrickName: string | null;
  favoriteSpot: FavoriteSpot | null;
  lastActive: string | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const response = await fetchWithAuth("/profile");
          if (!response.ok) return;
          const data = await response.json();
          if (!cancelled) setProfile(data);
        } catch {
          // guest/expired session — leave profile null
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const saveFavoriteTrick = useCallback(async (fullString: string) => {
    setProfile((prev) =>
      prev ? { ...prev, favoriteTrickName: fullString } : prev,
    );
    try {
      await fetchWithAuth("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteTrickName: fullString }),
      });
    } catch {
      // optimistic update already applied
    }
  }, []);

  const saveFavoriteSpot = useCallback(async (spot: FavoriteSpot) => {
    setProfile((prev) => (prev ? { ...prev, favoriteSpot: spot } : prev));
    try {
      await fetchWithAuth("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteSpotId: spot.id }),
      });
    } catch {
      // optimistic update already applied
    }
  }, []);

  return { profile, saveFavoriteTrick, saveFavoriteSpot };
}