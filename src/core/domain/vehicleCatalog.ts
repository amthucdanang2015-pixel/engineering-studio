export interface VehicleCatalogItem {
  id: string;
  name: string;
  type: string;
  description: string;
  modelPath: string;
  screenshotPath?: string;
  specs: {
    engine: string;
    power: string;
    weight: string;
    drivetrain: string;
  };
}

export const VEHICLE_CATALOG: VehicleCatalogItem[] = [
  // {
  //   id: "electric-hatch-05",
  //   name: "Rally Electric Hatch",
  //   type: "Electric Vehicle",
  //   description:
  //     "A compact electric rally hatch designed for agile handling with a lightweight chassis, responsive electric powertrain, and performance-focused body.",
  //   modelPath: "/models/sportster_custom_ready.glb",
  //   screenshotPath: "/images/free_1975_porsche_911_930_turbo.png",
  //   specs: {
  //     engine: "Dual-Motor EV",
  //     power: "420 HP",
  //     weight: "1,720 kg",
  //     drivetrain: "AWD",
  //   },
  // },
  // {
  //   id: "electric-pickup-04",
  //   name: "Adventure Electric Pickup",
  //   type: "Electric Vehicle",
  //   description:
  //     "A rugged electric pickup built for adventure with a modular chassis, high ground clearance, and versatile all-wheel-drive performance.",
  //   modelPath: "/models/pony_cartoon.glb",
  //   screenshotPath: "/images/pony_cartoon.png",
  //   specs: {
  //     engine: "Dual-Motor EV",
  //     power: "480 HP",
  //     weight: "2,280 kg",
  //     drivetrain: "AWD",
  //   },
  // },
  {
    id: "classic-sports-car",
    name: "Classic Sports Car",
    type: "Sports Car",
    description: "High-performance twin-turbo lightweight sports coupe engineered for maximum track agility.",
    modelPath: "/models/pony_custom_ready.glb",
    screenshotPath: "/images/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp.png",
    specs: {
      engine: "4.0L Twin-Turbo V8",
      power: "720 HP",
      weight: "1,380 kg",
      drivetrain: "RWD / 7-Speed DCT",
    },
  },
  // {
  //   id: "classic-electric-suv",
  //   name: "Classic Electric SUV",
  //   type: "Electric SUV",
  //   description: "Dual-motor luxury performance electric SUV with active air suspension and high-capacity battery pack.",
  //   modelPath: "/models/ESF_V3_Modern_Daily_Crossover_ThreeJS_YUp.glb",
  //   screenshotPath: "/images/ESF_V2_Classic_Sports_Car_Demo_ThreeJS_YUp1.png",
  //   specs: {
  //     engine: "Dual EV Motors",
  //     power: "650 HP",
  //     weight: "2,150 kg",
  //     drivetrain: "AWD / Direct Drive",
  //   },
  // },
  // {
  //   id: "electric-suv-03",
  //   name: "Rugged Electric Crossover",
  //   type: "Electric Crossover",
  //   description:
  //     "Rugged next-generation electric crossover designed with a high-clearance chassis, modular body structure, and all-wheel-drive electric powertrain.",
  //   modelPath: "/models/ESF_V2_Rugged_Electric_Crossover_ThreeJS_YUp.glb",
  //   screenshotPath: "/images/ESF_V2_Rugged_Electric_Crossover_ThreeJS_YUp.png",
  //   specs: {
  //     engine: "Dual-Motor Electric Drive",
  //     power: "450 HP",
  //     weight: "2,150 kg",
  //     drivetrain: "All-Wheel Drive",
  //   },
  // },
];

export function getVehicleCatalogItem(id: string | null): VehicleCatalogItem {
  return VEHICLE_CATALOG.find((v) => v.id === id) ?? VEHICLE_CATALOG[0];
}
