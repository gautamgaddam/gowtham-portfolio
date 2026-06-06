export const BODY_COMPOSITION_METHODS = [
  "BIA / smart scale",
  "Skinfold calipers",
  "DXA",
  "Manual estimate",
  "Other",
];

export function toNullableNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function round(value, decimals = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function getBmiCategory(bmi) {
  if (!bmi) return "";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal range";
  if (bmi < 30) return "Overweight range";
  return "Obesity range";
}

export function getBodyFatCategory(bodyFatPercent) {
  if (!bodyFatPercent) return "";
  if (bodyFatPercent < 10) return "Low estimate";
  if (bodyFatPercent < 21) return "Athletic/lean estimate";
  if (bodyFatPercent < 32) return "Typical/moderate estimate";
  return "Elevated estimate";
}

export function getWeightToMuscleContext(weightKg, muscleMassKg) {
  if (!weightKg || !muscleMassKg || weightKg <= 0) return "";

  const ratio = muscleMassKg / weightKg;
  if (ratio >= 0.42) return "Higher reported muscle share";
  if (ratio >= 0.32) return "Moderate reported muscle share";
  return "Lower reported muscle share";
}

export function normalizeBodyCompositionInput(input = {}) {
  return {
    heightCm: toNullableNumber(input.heightCm ?? input.height_cm),
    weightKg: toNullableNumber(input.weightKg ?? input.weight_kg),
    bodyFatPercent: toNullableNumber(
      input.bodyFatPercent ?? input.body_fat_percent,
    ),
    muscleMassKg: toNullableNumber(input.muscleMassKg ?? input.muscle_mass_kg),
    bodyWaterPercent: toNullableNumber(
      input.bodyWaterPercent ?? input.body_water_percent,
    ),
    boneMassKg: toNullableNumber(input.boneMassKg ?? input.bone_mass_kg),
    visceralFatRating: toNullableNumber(
      input.visceralFatRating ?? input.visceral_fat_rating,
    ),
    bodyCompositionMethod:
      input.bodyCompositionMethod ?? input.body_composition_method ?? "",
    bodyCompositionMeasuredAt:
      input.bodyCompositionMeasuredAt ??
      input.body_composition_measured_at ??
      null,
    bodyCompositionNotes:
      input.bodyCompositionNotes ?? input.body_composition_notes ?? "",
  };
}

export function calculateBodyComposition(input = {}) {
  const normalized = normalizeBodyCompositionInput(input);
  const { heightCm, weightKg, bodyFatPercent, muscleMassKg } = normalized;
  const heightM = heightCm ? heightCm / 100 : null;
  const bmi = heightM && weightKg ? round(weightKg / (heightM * heightM), 1) : null;
  const fatMassKg =
    weightKg && bodyFatPercent ? round(weightKg * (bodyFatPercent / 100), 1) : null;
  const leanMassKg =
    weightKg && fatMassKg !== null ? round(weightKg - fatMassKg, 1) : null;

  return {
    ...normalized,
    bmi,
    fatMassKg,
    leanMassKg,
    bodyFatCategory: getBodyFatCategory(bodyFatPercent),
    bmiCategory: getBmiCategory(bmi),
    weightToMuscleContext: getWeightToMuscleContext(weightKg, muscleMassKg),
  };
}

export function toBodyCompositionDbFields(input = {}) {
  const calculated = calculateBodyComposition(input);

  return {
    height_cm: calculated.heightCm,
    weight_kg: calculated.weightKg,
    body_fat_percent: calculated.bodyFatPercent,
    muscle_mass_kg: calculated.muscleMassKg,
    body_water_percent: calculated.bodyWaterPercent,
    bone_mass_kg: calculated.boneMassKg,
    visceral_fat_rating: calculated.visceralFatRating,
    body_composition_method: calculated.bodyCompositionMethod || "",
    body_composition_measured_at: calculated.bodyCompositionMeasuredAt || null,
    body_composition_notes: calculated.bodyCompositionNotes || "",
    bmi: calculated.bmi,
    fat_mass_kg: calculated.fatMassKg,
    lean_mass_kg: calculated.leanMassKg,
    body_fat_category: calculated.bodyFatCategory || "",
    bmi_category: calculated.bmiCategory || "",
    weight_to_muscle_context: calculated.weightToMuscleContext || "",
  };
}

export function fromBodyCompositionDb(row = {}) {
  return {
    heightCm: row.height_cm ?? "",
    weightKg: row.weight_kg ?? "",
    bodyFatPercent: row.body_fat_percent ?? "",
    muscleMassKg: row.muscle_mass_kg ?? "",
    bodyWaterPercent: row.body_water_percent ?? "",
    boneMassKg: row.bone_mass_kg ?? "",
    visceralFatRating: row.visceral_fat_rating ?? "",
    bodyCompositionMethod: row.body_composition_method || "",
    bodyCompositionMeasuredAt: row.body_composition_measured_at || "",
    bodyCompositionNotes: row.body_composition_notes || "",
    bmi: row.bmi ?? null,
    fatMassKg: row.fat_mass_kg ?? null,
    leanMassKg: row.lean_mass_kg ?? null,
    bodyFatCategory: row.body_fat_category || "",
    bmiCategory: row.bmi_category || "",
    weightToMuscleContext: row.weight_to_muscle_context || "",
  };
}
