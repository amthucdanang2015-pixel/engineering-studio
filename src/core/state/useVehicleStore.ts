import { create } from "zustand";
import type { PartMaterialConfig, VehiclePartData, ViewPreset, PartCategory } from "../domain/vehicle";

export const VEHICLE_PARTS_DATA: VehiclePartData[] = [
  // BODY
  {
    id: "body-main",
    name: "Body Shell",
    category: "BODY",
    meshName: "Body_Main",
    description: "Aerodynamic composite monocoque body panels engineered for optimal downforce.",
    specs: { Material: "Carbon-Fiber Reinforced Polymer", Weight: "145 kg", "Drag Coeff": "0.28 Cd" },
    defaultMaterial: { color: "#f95738", roughness: 0.25, metalness: 0.7, opacity: 1, transparent: false, wireframe: false },
    accentColor: "#f95738",
  },
  {
    id: "body-front-fascia",
    name: "Front Fascia",
    category: "BODY",
    meshName: "Body_Front_Fascia",
    description: "Front aerodynamic fascia directing airflow into cooling ducts.",
    specs: { Material: "Carbon Prepreg" },
    defaultMaterial: { color: "#f95738", roughness: 0.25, metalness: 0.7, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "hood",
    name: "Front Hood",
    category: "BODY",
    meshName: "Hood",
    description: "Lightweight front bonnet with extraction vents.",
    specs: { Material: "Carbon Composite", Weight: "14 kg" },
    defaultMaterial: { color: "#f95738", roughness: 0.25, metalness: 0.7, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "front-bumper",
    name: "Front Bumper",
    category: "BODY",
    meshName: "Front_Bumper",
    description: "Front impact bumper structure with air intakes.",
    specs: { Impact: "SAE J264 Compliant" },
    defaultMaterial: { color: "#111827", roughness: 0.4, metalness: 0.5, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "front-splitter",
    name: "Front Splitter",
    category: "BODY",
    meshName: "Front_Splitter",
    description: "Ground-effect front splitter generating front axle downforce.",
    specs: { Downforce: "65 kg @ 160 km/h" },
    defaultMaterial: { color: "#111827", roughness: 0.3, metalness: 0.6, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "windshield",
    name: "Windshield Glass",
    category: "BODY",
    meshName: "Windshield",
    description: "Laminated acoustic safety windshield with hydrophobic coating.",
    specs: { Thickness: "3.5 mm", "UV Cut": "99.8%" },
    defaultMaterial: { color: "#a8dadc", roughness: 0.1, metalness: 0.1, opacity: 0.4, transparent: true, wireframe: false },
  },
  {
    id: "led-headlight-left",
    name: "LED Headlight Left",
    category: "BODY",
    meshName: "LED_Headlight_Left",
    description: "Adaptive Matrix LED headlight unit.",
    specs: { Luminous: "3,200 Lumens" },
    defaultMaterial: { color: "#ffffff", roughness: 0.1, metalness: 0.9, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "led-headlight-right",
    name: "LED Headlight Right",
    category: "BODY",
    meshName: "LED_Headlight_Right",
    description: "Adaptive Matrix LED headlight unit.",
    specs: { Luminous: "3,200 Lumens" },
    defaultMaterial: { color: "#ffffff", roughness: 0.1, metalness: 0.9, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "rear-deck",
    name: "Rear Deck Cover",
    category: "BODY",
    meshName: "Rear_Deck",
    description: "Ventilated rear engine bay deck lid.",
    specs: { Material: "Carbon Composite" },
    defaultMaterial: { color: "#f95738", roughness: 0.25, metalness: 0.7, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "rear-spoiler-blade",
    name: "Rear Spoiler Blade",
    category: "BODY",
    meshName: "Rear_Spoiler_Blade",
    description: "High-downforce active rear wing blade.",
    specs: { Downforce: "180 kg @ 200 km/h" },
    defaultMaterial: { color: "#111827", roughness: 0.3, metalness: 0.5, opacity: 1, transparent: false, wireframe: false },
  },

  // COCKPIT
  {
    id: "dashboard",
    name: "Dashboard Console",
    category: "COCKPIT",
    meshName: "Dashboard",
    description: "Digital instrument cluster dashboard upholstered in Alcantara.",
    specs: { Display: "12.3\" HD Telemetry Screen" },
    defaultMaterial: { color: "#1e293b", roughness: 0.6, metalness: 0.2, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "steering-wheel",
    name: "Steering Wheel",
    category: "COCKPIT",
    meshName: "Steering_Wheel",
    description: "Multifunction sport steering wheel with paddle shifters.",
    specs: { Trim: "Perforated Leather & Carbon" },
    defaultMaterial: { color: "#0f172a", roughness: 0.5, metalness: 0.3, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "seat-left-base",
    name: "Driver Seat Base",
    category: "COCKPIT",
    meshName: "Seat_Left_Base",
    description: "Driver carbon bucket seat cushion.",
    specs: { Material: "Nappa Leather & Memory Foam" },
    defaultMaterial: { color: "#334155", roughness: 0.6, metalness: 0.1, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "seat-left-back",
    name: "Driver Seat Backrest",
    category: "COCKPIT",
    meshName: "Seat_Left_Back",
    description: "Driver carbon bucket seat backrest with side bolsters.",
    specs: { Shell: "Carbon Fiber Monocoque" },
    defaultMaterial: { color: "#334155", roughness: 0.6, metalness: 0.1, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "seat-right-base",
    name: "Passenger Seat Base",
    category: "COCKPIT",
    meshName: "Seat_Right_Base",
    description: "Passenger sport seat cushion.",
    specs: { Material: "Nappa Leather" },
    defaultMaterial: { color: "#334155", roughness: 0.6, metalness: 0.1, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "seat-right-back",
    name: "Passenger Seat Backrest",
    category: "COCKPIT",
    meshName: "Seat_Right_Back",
    description: "Passenger sport seat backrest.",
    specs: { Shell: "Carbon Fiber" },
    defaultMaterial: { color: "#334155", roughness: 0.6, metalness: 0.1, opacity: 1, transparent: false, wireframe: false },
  },

  // POWER
  {
    id: "engine-block",
    name: "Twin-Turbo V8 Engine Block",
    category: "POWER",
    meshName: "Engine_Block",
    description: "4.0L twin-turbocharged V8 engine block.",
    specs: { Output: "720 HP @ 7,500 RPM", Torque: "770 Nm" },
    defaultMaterial: { color: "#94a3b8", roughness: 0.3, metalness: 0.9, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "engine-cover",
    name: "Engine Intake Cover",
    category: "POWER",
    meshName: "Engine_Cover",
    description: "Carbon intake plenum cover with red accent valve trims.",
    specs: { Material: "Dry Carbon Fiber" },
    defaultMaterial: { color: "#b7094c", roughness: 0.3, metalness: 0.7, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "exhaust-left",
    name: "Exhaust Pipe Left",
    category: "POWER",
    meshName: "Exhaust_Left",
    description: "Titanium performance exhaust tailpipe.",
    specs: { Material: "Grade 5 Titanium" },
    defaultMaterial: { color: "#cbd5e1", roughness: 0.2, metalness: 0.95, opacity: 1, transparent: false, wireframe: false },
  },

  // CHASSIS
  {
    id: "chassis-frame",
    name: "Spaceframe Chassis",
    category: "CHASSIS",
    meshName: "Chassis_Frame",
    description: "Extruded aluminum spaceframe chassis floorpan & subframe assembly.",
    specs: { Stiffness: "38,000 Nm/deg", Material: "Aluminum Alloy" },
    defaultMaterial: { color: "#1e293b", roughness: 0.5, metalness: 0.8, opacity: 1, transparent: false, wireframe: false },
  },

  // WHEELS
  {
    id: "wheel-front-left",
    name: "Front-Left Forged Rim",
    category: "WHEELS",
    meshName: "Wheel_Front_Left",
    description: "Front-left forged magnesium alloy 5-spoke wheel rim & tire assembly.",
    specs: { Size: "19 x 9.5J", Tire: "265/35 ZR19 Semi-Slick" },
    defaultMaterial: { color: "#f8fafc", roughness: 0.15, metalness: 0.95, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "wheel-front-right",
    name: "Front-Right Forged Rim",
    category: "WHEELS",
    meshName: "Wheel_Front_Right",
    description: "Front-right forged magnesium alloy wheel assembly.",
    specs: { Size: "19 x 9.5J", Tire: "265/35 ZR19 Semi-Slick" },
    defaultMaterial: { color: "#f8fafc", roughness: 0.15, metalness: 0.95, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "wheel-rear-left",
    name: "Rear-Left Forged Rim",
    category: "WHEELS",
    meshName: "Wheel_Rear_Left",
    description: "Rear-left forged magnesium alloy wheel assembly.",
    specs: { Size: "20 x 11.0J", Tire: "305/30 ZR20 Semi-Slick" },
    defaultMaterial: { color: "#f8fafc", roughness: 0.15, metalness: 0.95, opacity: 1, transparent: false, wireframe: false },
  },
  {
    id: "wheel-rear-right",
    name: "Rear-Right Forged Rim",
    category: "WHEELS",
    meshName: "Wheel_Rear_Right",
    description: "Rear-right forged magnesium alloy wheel assembly.",
    specs: { Size: "20 x 11.0J", Tire: "305/30 ZR20 Semi-Slick" },
    defaultMaterial: { color: "#f8fafc", roughness: 0.15, metalness: 0.95, opacity: 1, transparent: false, wireframe: false },
  },
];

interface VehicleState {
  selectedVehicleId: string;
  selectedMeshName: string | null;
  selectedPart: VehiclePartData | null;
  hoveredMeshName: string | null;
  materialOverrides: Record<string, Partial<PartMaterialConfig>>;
  activeTool: string | null;
  autoRotate: boolean;
  activeViewPreset: ViewPreset;

  setSelectedVehicleId: (id: string) => void;
  setSelectedMesh: (meshName: string | null) => void;
  setHoveredMesh: (meshName: string | null) => void;
  updatePartMaterial: (meshName: string, config: Partial<PartMaterialConfig>) => void;
  setMaterialOverrides: (overrides: Record<string, Partial<PartMaterialConfig>>) => void;
  setActiveTool: (tool: string | null) => void;
  setAutoRotate: (enabled: boolean) => void;
  setPresetView: (preset: ViewPreset) => void;
}

function inferCategoryFromMeshName(meshName: string): PartCategory {
  const lower = meshName.toLowerCase();
  if (lower.includes("wheel") || lower.includes("tire") || lower.includes("rim") || lower.includes("hub") || lower.includes("cap")) return "WHEELS";
  if (lower.includes("seat") || lower.includes("dash") || lower.includes("steering") || lower.includes("cockpit")) return "COCKPIT";
  if (lower.includes("engine") || lower.includes("valve") || lower.includes("exhaust") || lower.includes("power")) return "POWER";
  if (lower.includes("chassis") || lower.includes("frame") || lower.includes("rail") || lower.includes("floor")) return "CHASSIS";
  return "BODY";
}

export function getPartByMeshName(meshName: string | null): VehiclePartData | null {
  if (!meshName) return null;
  const exactPart = VEHICLE_PARTS_DATA.find((p) => p.meshName === meshName);
  return (
    exactPart ?? {
      id: meshName.toLowerCase().replace(/_/g, "-"),
      name: meshName.replace(/_/g, " "),
      category: inferCategoryFromMeshName(meshName),
      meshName: meshName,
      description: `Selected GLB component: ${meshName.replace(/_/g, " ")}.`,
      specs: { "Node ID": meshName, Status: "Active Mesh" },
      defaultMaterial: {
        color: "#f95738",
        roughness: 0.3,
        metalness: 0.6,
        opacity: 1,
        transparent: false,
        wireframe: false,
      },
    }
  );
}



export const useVehicleStore = create<VehicleState>((set) => ({
  selectedVehicleId: "classic-sports-car",
  selectedMeshName: null,
  selectedPart: null,
  hoveredMeshName: null,
  materialOverrides: {},
  activeTool: null,
  autoRotate: false,
  activeViewPreset: "side",

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  setSelectedMesh: (meshName) =>
    set(() => {
      if (!meshName) return { selectedMeshName: null, selectedPart: null };

      const exactPart = VEHICLE_PARTS_DATA.find((p) => p.meshName === meshName);
      const part: VehiclePartData = exactPart ?? {
        id: meshName.toLowerCase().replace(/_/g, "-"),
        name: meshName.replace(/_/g, " "),
        category: inferCategoryFromMeshName(meshName),
        meshName: meshName,
        description: `Selected GLB component: ${meshName.replace(/_/g, " ")}. Adjust material finish, paint color, roughness, metalness below.`,
        specs: { "Node ID": meshName, Status: "Active Mesh" },
        defaultMaterial: {
          color: "#f95738",
          roughness: 0.3,
          metalness: 0.6,
          opacity: 1,
          transparent: false,
          wireframe: false,
        },
      };

      return { selectedMeshName: meshName, selectedPart: part };
    }),

  setHoveredMesh: (meshName) => set({ hoveredMeshName: meshName }),

  updatePartMaterial: (meshName, config) =>
    set((state) => ({
      materialOverrides: {
        ...state.materialOverrides,
        [meshName]: {
          ...(state.materialOverrides[meshName] || {}),
          ...config,
        },
      },
    })),

  setMaterialOverrides: (overrides) => set({ materialOverrides: overrides }),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setAutoRotate: (enabled) => set({ autoRotate: enabled }),
  setPresetView: (preset) => set({ activeViewPreset: preset }),
}));

function areConfigsEqual(
  c1: Partial<PartMaterialConfig> = {},
  c2: Partial<PartMaterialConfig> = {}
): boolean {
  const keys: (keyof PartMaterialConfig)[] = [
    "color",
    "roughness",
    "metalness",
    "opacity",
    "transparent",
    "wireframe",
  ];
  for (const k of keys) {
    if (c1[k] !== c2[k]) return false;
  }
  return true;
}

export function isOverridesDirty(
  current: Record<string, Partial<PartMaterialConfig>> = {},
  saved: Record<string, Partial<PartMaterialConfig>> = {}
): boolean {
  const allMeshNames = Array.from(
    new Set([...Object.keys(current), ...Object.keys(saved)])
  );
  for (const meshName of allMeshNames) {
    if (!areConfigsEqual(current[meshName], saved[meshName])) {
      return true;
    }
  }
  return false;
}

