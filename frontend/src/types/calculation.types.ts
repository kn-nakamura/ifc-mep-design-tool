export enum VentilationMethod {
  BUILDING_CODE = "building_code",
  OCCUPANCY_BASED = "occupancy_based",
  AREA_BASED = "area_based",
  CUSTOM = "custom"
}

export enum RoomUsageType {
  OFFICE = "office",
  RESIDENCE = "residence",
  MEETING_ROOM = "meeting_room",
  CORRIDOR = "corridor",
  TOILET = "toilet",
  KITCHEN = "kitchen",
  STORAGE = "storage",
  OTHER = "other"
}

export interface VentilationCalculationInput {
  spaceId: string;
  method?: VentilationMethod;
  area?: number;
  volume?: number;
  height?: number;
  usage?: RoomUsageType;
  occupancy?: number;
  airChangeRate?: number;
  freshAirPerPerson?: number;
  useNaturalVentilation?: boolean;
  customParameters?: Record<string, any>;
}

export interface VentilationCalculationResult {
  spaceId: string;
  spaceName: string;
  requiredVentilation: number;
  airChangeRate: number;
  method: VentilationMethod;
  usedArea?: number;
  usedVolume?: number;
  usedOccupancy?: number;
  usedUsage?: RoomUsageType;
  standardAirChangeRate?: number;
  standardFreshAirPerPerson?: number;
  complianceStatus: "OK" | "NG" | "WARNING";
  complianceNotes?: string;
  calculationDetails: Record<string, any>;
  appliedStandard?: string;
}

export interface VentilationBatchResult {
  total: number;
  results: VentilationCalculationResult[];
  summary: Record<string, any>;
}
