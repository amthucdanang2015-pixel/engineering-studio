import type { VehicleCatalogItem } from "@/core/domain/vehicleCatalog";
import type { SavedVehicleBuild } from "@/core/state/savedBuilds";

export interface VehicleTelemetryData {
  zeroTo100Time: number; // in seconds (e.g. 2.8 or 3.4)
  zeroTo100Formatted: string; // e.g. "2.8 s"
  topSpeed: number; // in km/h
  powerHp: number; // e.g. 720
  powerFormatted: string; // e.g. "720 HP"
  weightKg: number; // e.g. 1380
  weightFormatted: string; // e.g. "1,380 kg"
  drivetrain: string; // e.g. "RWD / 7-Speed DCT"
  engine: string; // e.g. "4.0L Twin-Turbo V8"
  dragCoefficient: number; // e.g. 0.28
  peakGForce: number; // e.g. 1.15 G
}

/**
 * Derives accurate automotive telemetry metrics from vehicle specs and customized build data.
 */
export function calculateVehicleTelemetry(
  vehicle: VehicleCatalogItem,
  build?: SavedVehicleBuild | null
): VehicleTelemetryData {
  const specs = vehicle.specs;
  const anyBuild = build as Record<string, unknown> | null | undefined;
  const customSpecs = (anyBuild?.specs ?? anyBuild?.performance) as Record<string, unknown> | undefined;

  // 1. Power in HP
  const powerRaw = String(customSpecs?.power || specs.power || "720 HP");
  const powerMatch = powerRaw.match(/(\d+)/);
  const powerHp = powerMatch ? parseInt(powerMatch[1], 10) : 720;

  // 2. Weight in kg
  const weightRaw = String(customSpecs?.weight || specs.weight || "1,380 kg");
  const weightMatch = weightRaw.replace(/,/g, "").match(/(\d+)/);
  const weightKg = weightMatch ? parseInt(weightMatch[1], 10) : 1380;

  // 3. Engine & Drivetrain
  const engine = String(customSpecs?.engine || specs.engine || "4.0L Twin-Turbo V8");
  const drivetrain = String(customSpecs?.drivetrain || specs.drivetrain || "RWD / 7-Speed DCT");

  // 4. Zero to 100 Acceleration Time
  let zeroTo100Time: number;
  const customZeroTo100 = customSpecs?.zeroTo100 || anyBuild?.zeroTo100;

  if (typeof customZeroTo100 === "number" && customZeroTo100 > 0) {
    zeroTo100Time = customZeroTo100;
  } else if (typeof customZeroTo100 === "string" && parseFloat(customZeroTo100) > 0) {
    zeroTo100Time = parseFloat(customZeroTo100);
  } else {
    // Calculate realistic 0-100 km/h acceleration time based on power-to-weight ratio and drivetrain
    let tractionFactor = 1.0;
    const drivetrainLower = drivetrain.toLowerCase();
    if (drivetrainLower.includes("awd") || drivetrainLower.includes("all-wheel")) {
      tractionFactor = 1.15; // Better launch traction
    } else if (drivetrainLower.includes("rwd") || drivetrainLower.includes("rear-wheel")) {
      tractionFactor = 1.05;
    } else {
      tractionFactor = 0.95; // FWD
    }

    const powerToWeightRatio = (powerHp * tractionFactor) / weightKg; // HP per kg
    const calculated = 1.85 / (powerToWeightRatio * 0.95 + 0.15);
    zeroTo100Time = Math.max(1.9, Math.min(6.8, Math.round(calculated * 10) / 10));
  }

  // 5. Drag Coefficient
  let cd = 0.28;
  if (typeof customSpecs?.dragCoefficient === "number") {
    cd = customSpecs.dragCoefficient;
  } else {
    const typeLower = (vehicle.type || "").toLowerCase();
    if (typeLower.includes("sports") || typeLower.includes("coupe") || typeLower.includes("super")) {
      cd = 0.28;
    } else if (typeLower.includes("hatch") || typeLower.includes("rally")) {
      cd = 0.31;
    } else if (typeLower.includes("suv") || typeLower.includes("crossover") || typeLower.includes("pickup")) {
      cd = 0.36;
    }
  }

  // 6. Peak G-Force
  const avgAccel = 27.78 / zeroTo100Time;
  const peakG = Math.round((avgAccel / 9.81 * 1.32) * 100) / 100;

  // 7. Top Speed
  const topSpeed = typeof customSpecs?.topSpeed === "number"
    ? customSpecs.topSpeed
    : Math.round(260 + (powerHp - 500) * 0.2);

  return {
    zeroTo100Time,
    zeroTo100Formatted: `${zeroTo100Time.toFixed(1)} s`,
    topSpeed,
    powerHp,
    powerFormatted: powerRaw.includes("HP") ? powerRaw : `${powerHp} HP`,
    weightKg,
    weightFormatted: weightRaw.includes("kg") ? weightRaw : `${weightKg} kg`,
    drivetrain,
    engine,
    dragCoefficient: cd,
    peakGForce: peakG,
  };
}
