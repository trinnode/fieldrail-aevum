import { bytes32, type Bytes32 } from "@fieldrail/shared-types";

export const PROGRAMME_ID: Bytes32 = bytes32("NORTHERN_WATER_ACCESS_DEMO");
export const PROGRAMME_TITLE = "Northern Water Access — Field Operations Demo";

export const CATEGORIES = [
  { id: bytes32("WATER_PROCUREMENT"), label: "Water Procurement", short: "Water", cap: 450_000_000n },
  { id: bytes32("TRANSPORT_LOGISTICS"), label: "Transport & Logistics", short: "Transport", cap: 250_000_000n },
  { id: bytes32("FIELD_SUPPLIES"), label: "Field Supplies", short: "Supplies", cap: 200_000_000n },
] as const;

export const TEAMS = [
  {
    id: bytes32("NORTH_ZONE"),
    label: "North Zone",
    allocations: [
      { categoryId: CATEGORIES[0].id, cap: 300_000_000n },
      { categoryId: CATEGORIES[1].id, cap: 250_000_000n },
      { categoryId: CATEGORIES[2].id, cap: 200_000_000n },
    ],
  },
  {
    id: bytes32("SOUTH_ZONE"),
    label: "South Zone",
    allocations: [{ categoryId: CATEGORIES[0].id, cap: 150_000_000n }],
  },
] as const;

export const DEMO_SUPPLIER = "0x1111111111111111111111111111111111111111" as const;
export const DEMO_AGENT = "0x2222222222222222222222222222222222222222" as const;
export const DEMO_UNAPPROVED_VENDOR = "0x3333333333333333333333333333333333333333" as const;

export function categoryLabel(id: Bytes32): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "Unknown category";
}

export function teamLabel(id: Bytes32): string {
  return TEAMS.find((t) => t.id === id)?.label ?? "Unknown team";
}
