import { create } from "zustand";
import { RestaurantConfig, ShiftType, Position } from "@shared/schema";

interface RestaurantStore {
  restaurant: RestaurantConfig | null;
  shiftTypes: ShiftType[];
  positions: Position[];
  setRestaurantConfig: (config: {
    restaurant: RestaurantConfig;
    shiftTypes: ShiftType[];
    positions: Position[];
  }) => void;
}

export const useRestaurantStore = create<RestaurantStore>((set) => ({
  restaurant: null,
  shiftTypes: [],
  positions: [],
  setRestaurantConfig: (config) => set({
    restaurant: config.restaurant,
    shiftTypes: config.shiftTypes,
    positions: config.positions,
  }),
}));
