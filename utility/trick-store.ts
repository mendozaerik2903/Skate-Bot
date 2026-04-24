import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Trick = {
  id: string;
  name: string;
  enabled: boolean;
};

type TrickStore = {
  landRate: number;
  tricks: Trick[];
  setLandRate: (rate: number) => void;
  toggleTrick: (id: string) => void;
  enableAll: () => void;
  disableAll: () => void;
};

const DEFAULT_TRICKS: Trick[] = [
  { id: "ollie", name: "Ollie", enabled: true },
  { id: "fs_180", name: "FS 180", enabled: true },
  { id: "bs_180", name: "BS 180", enabled: true },
  { id: "fs_360", name: "FS 360", enabled: true },
  { id: "bs_360", name: "BS 360", enabled: true },

  { id: "bs_shuvit", name: "BS Shuvit", enabled: true },
  { id: "fs_shuvit", name: "FS Shuvit", enabled: true },
  { id: "bs_360_shuvit", name: "BS 360 Shuvit", enabled: true },
  { id: "fs_360_shuvit", name: "FS 360 Shuvit", enabled: true },
  { id: "bs_540_shuvit", name: "FS 540 Shuvit", enabled: true },
  { id: "fs_540_shuvit", name: "FS 540 Shuvit", enabled: true },

  { id: "kickflip", name: "Kickflip", enabled: true },
  { id: "fs_180_kickflip", name: "FS 180 Kickflip", enabled: true },
  { id: "bs_180_kickflip", name: "BS 180 Kickflip", enabled: true },
  { id: "fs_360_kickflip", name: "FS 360 Kickflip", enabled: true },
  { id: "bs_360_kickflip", name: "BS 360 Kickflip", enabled: true },

  { id: "double_kickflip", name: "Double Kickflip", enabled: true },
  {
    id: "fs_180_double_kickflip",
    name: "FS 180 Double Kickflip",
    enabled: true,
  },
  {
    id: "bs_180_double_kickflip",
    name: "BS 180 Double Kickflip",
    enabled: true,
  },
  {
    id: "fs_360_double_kickflip",
    name: "FS 360 Double Kickflip",
    enabled: true,
  },
  {
    id: "bs_360_double_kickflip",
    name: "BS 360 Double Kickflip",
    enabled: true,
  },

  { id: "heelflip", name: "Heelflip", enabled: true },
  { id: "fs_180_heelflip", name: "FS 180 Heelflip", enabled: true },
  { id: "bs_180_heelflip", name: "BS 180 Heelflip", enabled: true },
  { id: "fs_360_heelflip", name: "FS 360 Heelflip", enabled: true },
  { id: "bs_360_heelflip", name: "BS 360 Heelflip", enabled: true },

  { id: "double_heelflip", name: "Double Heelflip", enabled: true },
  {
    id: "fs_180_double_heelflip",
    name: "FS 180 Double Heelflip",
    enabled: true,
  },
  {
    id: "bs_180_double_heelflip",
    name: "BS 180 Double Heelflip",
    enabled: true,
  },
  {
    id: "fs_360_double_heelflip",
    name: "FS 360 Double Heelflip",
    enabled: true,
  },
  {
    id: "bs_360_double_heelflip",
    name: "BS 360 Double Heelflip",
    enabled: true,
  },

  { id: "bs_bigspin", name: "BS Bigspin", enabled: true },
  { id: "fs_bigspin", name: "FS Bigspin", enabled: true },
  { id: "bs_biggerspin", name: "BS Biggerspin", enabled: true },
  { id: "fs_biggerspin", name: "FS Biggerspin", enabled: true },
  { id: "bs_gazelle_spin", name: "BS Gazelle Spin", enabled: true },
  { id: "fs_gazelle_spin", name: "FS Gazelle Spin", enabled: true },

  { id: "varial_flip", name: "Varial Flip", enabled: true },
  { id: "varial_heel", name: "Varial Heel", enabled: true },

  { id: "tre_flip", name: "Tre Flip", enabled: true },
  { id: "bs_big_flip", name: "BS Big Flip", enabled: true },
  { id: "fs_big_flip", name: "FS Big Flip", enabled: true },
  { id: "bs_bigger_flip", name: "BS Bigger Flip", enabled: true },
  { id: "fs_bigger_flip", name: "FS Bigger Flip", enabled: true },

  { id: "540_flip", name: "540 Flip", enabled: true },
  { id: "bs_gazelle_flip", name: "BS Gazelle Flip", enabled: true },
  { id: "fs_gazelle_flip", name: "FS Gazelle Flip", enabled: true },

  { id: "laser_flip", name: "Laser Flip", enabled: true },
  { id: "bs_big_heel", name: "BS Big Heel", enabled: true },
  { id: "fs_big_heel", name: "FS Big Heel", enabled: true },
  { id: "bs_bigger_heel", name: "BS Bigger Heel", enabled: true },
  { id: "fs_bigger_heel", name: "FS Bigger Heel", enabled: true },

  { id: "540_Heel", name: "540 Heel", enabled: true },
  { id: "bs_gazelle_heel", name: "BS Gazelle Heel", enabled: true },
  { id: "fs_gazelle_heel", name: "FS Gazelle Heel", enabled: true },

  { id: "hardflip", name: "Hardflip", enabled: true },
  { id: "fs_180_hardflip", name: "FS 180 Hardflip", enabled: true },
  { id: "bs_180_hardflip", name: "BS 180 Hardflip", enabled: true },
  { id: "fs_360_hardflip", name: "FS 360 Hardflip", enabled: true },
  { id: "bs_360_hardflip", name: "BS 360 Hardflip", enabled: true },

  { id: "inward_heel", name: "Inward Heel", enabled: true },
  { id: "fs_180_inward_heel", name: "FS 180 Inward Heel", enabled: true },
  { id: "bs_180_inward_heel", name: "BS 180 Inward Heel", enabled: true },
  { id: "fs_360_inward_heel", name: "FS 360 Inward Heel", enabled: true },
  { id: "bs_360_inward_heel", name: "BS 360 Inward Heel", enabled: true },

  { id: "impossible", name: "Impossible", enabled: true },
  { id: "fs_180_impossible", name: "FS 180 Impossible", enabled: true },
  { id: "bs_180_impossible", name: "BS 180 Impossible", enabled: true },
  { id: "fs_360_impossible", name: "FS 360 Impossible", enabled: true },
  { id: "bs_360_impossible", name: "BS 360 Impossible", enabled: true },

  { id: "dolphin_flip", name: "Dolphin Flip", enabled: true },
  { id: "fs_180_dolphin_flip", name: "FS 180 Dolphin Flip", enabled: true },
  { id: "bs_180_dolphin_flip", name: "BS 180 Dolphin Flip", enabled: true },
  { id: "fs_360_dolphin_flip", name: "FS 360 Dolphin Flip", enabled: true },
  { id: "bs_360_dolphin_flip", name: "BS 360 Dolphin Flip", enabled: true },

  { id: "dolphin_heel", name: "Dolphin Heel", enabled: true },
  { id: "fs_180_dolphin_heel", name: "FS 180 Dolphin Heel", enabled: true },
  { id: "bs_180_dolphin_heel", name: "BS 180 Dolphin Heel", enabled: true },
  { id: "fs_360_dolphin_heel", name: "FS 360 Dolphin Heel", enabled: true },
  { id: "bs_360_dolphin_heel", name: "BS 360 Dolphin Heel", enabled: true },

  { id: "hospital_flip", name: "Hospital Flip", enabled: true },
  { id: "fs_180_hospital_flip", name: "FS 180 Hospital Flip", enabled: true },
  { id: "bs_180_hospital_flip", name: "BS 180 Hospital Flip", enabled: true },
  { id: "fs_360_hospital_flip", name: "FS 360 Hospital Flip", enabled: true },
  { id: "bs_360_hospital_flip", name: "BS 360 Hospital Flip", enabled: true },

  { id: "hospital_heel", name: "Hospital Heel", enabled: true },
  { id: "fs_180_hospital_heel", name: "FS 180 Hospital Heel", enabled: true },
  { id: "bs_180_hospital_heel", name: "BS 180 Hospital Heel", enabled: true },
  { id: "fs_360_hospital_heel", name: "FS 360 Hospital Heel", enabled: true },
  { id: "bs_360_hospital_heel", name: "BS 360 Hospital Heel", enabled: true },
];

export const useTrickStore = create<TrickStore>()(
  persist(
    (set) => ({
      landRate: 0.7,
      tricks: DEFAULT_TRICKS,

      setLandRate: (rate) => set({ landRate: rate }),

      toggleTrick: (id) =>
        set((state) => ({
          tricks: state.tricks.map((t) =>
            t.id === id ? { ...t, enabled: !t.enabled } : t,
          ),
        })),

      enableAll: () =>
        set((state) => ({
          tricks: state.tricks.map((t) => ({ ...t, enabled: true })),
        })),

      disableAll: () =>
        set((state) => ({
          tricks: state.tricks.map((t) => ({ ...t, enabled: false })),
        })),
    }),
    {
      name: "trick-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
