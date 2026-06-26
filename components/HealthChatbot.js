import { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Chip,
  Modal,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Alert,
  Autocomplete,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SpaIcon from "@mui/icons-material/Spa";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import AddIcon from "@mui/icons-material/Add";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import MedicationIcon from "@mui/icons-material/Medication";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ErrorIcon from "@mui/icons-material/Error";
import SettingsAccessibilityIcon from "@mui/icons-material/SettingsAccessibility";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import BarChartIcon from "@mui/icons-material/BarChart";
import UploadIcon from "@mui/icons-material/Upload";
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";
import ContrastIcon from "@mui/icons-material/Contrast";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import SettingsIcon from "@mui/icons-material/Settings";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useTheme } from "@mui/material/styles";
import gsap, { Power3 } from "gsap";
import styles from "../styles/health.module.css";
import { createSupabaseClient } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import ConversationHistory from "./ConversationHistory";
import {
  BodyDashboardPanel,
  DailyTrackerPanel,
  DocumentsPanel,
  PlansPanel,
  UserUploadsPanel,
} from "./HealthWorkspacePanels";
import {
  BODY_COMPOSITION_METHODS,
  calculateBodyComposition,
  fromBodyCompositionDb,
} from "../lib/body-composition";

const STORAGE_KEY = "health_chat_history";
const PROFILE_STORAGE_KEY = "health_user_profile";
const ANALYTICS_STORAGE_KEY = "health_analytics";
const ACCESSIBILITY_STORAGE_KEY = "health_accessibility_settings";
const MAX_HISTORY = 50;
const HEALTH_WORKSPACE_TABS = [
  { id: "chat", label: "Chat" },
  { id: "tracker", label: "Daily Tracker" },
  { id: "body", label: "Body" },
  { id: "plans", label: "Plans" },
  { id: "videos", label: "Videos" },
  { id: "uploads", label: "Uploads" },
  { id: "documents", label: "Documents" },
  { id: "settings", label: "Settings" },
];

const SUGGESTED_PROMPTS = [
  "I have high blood pressure and type 2 diabetes. Create a cheap vegetarian meal plan.",
  "I'm on metformin. Should I take vitamin B12?",
  "Explain natural ways to reduce cardiovascular risk without stopping my medicines.",
  "I have chronic pain and low mood. Give me a plan for this week.",
  "What supplements are worth considering if I rarely eat fish and avoid dairy?",
  "I have lupus. What lifestyle habits help, and what should I not experiment with?",
  "Create a low-sodium Indian dinner shopping list for a family of four.",
  "I'm stressed, sleeping badly, and snacking at night. Where should I start?",
];

// Conditions options
const CONDITIONS = [
  "None",
  "CVD",
  "Coronary Artery Disease",
  "Heart Failure",
  "Arrhythmia",
  "Stroke/TIA",
  "Hypertension",
  "Type 2 Diabetes",
  "Type 1 Diabetes",
  "Prediabetes",
  "High Cholesterol",
  "High Triglycerides",
  "Obesity",
  "Depression/Anxiety",
  "ADHD",
  "PTSD",
  "Insomnia",
  "Chronic Pain",
  "Migraine",
  "Lupus",
  "Rheumatoid Arthritis",
  "Psoriatic Disease",
  "Osteoarthritis",
  "Osteoporosis",
  "IBD",
  "IBS",
  "GERD",
  "Celiac Disease",
  "Fatty Liver / NAFLD",
  "Metabolic Syndrome",
  "Asthma",
  "COPD",
  "Chronic Kidney Disease",
  "Thyroid Disease",
  "PCOS",
  "Endometriosis",
  "Anemia",
  "Cancer History",
  "Sleep Apnea",
];

const normalizeConditionList = (conditions = []) => {
  const values = Array.isArray(conditions) ? conditions : [];
  const cleaned = values
    .map((condition) => String(condition || "").trim())
    .filter(Boolean);

  if (cleaned.includes("None")) return ["None"];
  return Array.from(new Set(cleaned));
};

// Goals options
const GOALS = [
  "Manage condition",
  "Lose weight",
  "Improve energy",
  "Better sleep",
  "Reduce stress",
  "Improve diet",
  "Increase activity",
];

const EMPTY_BODY_COMPOSITION_PROFILE = {
  heightCm: "",
  weightKg: "",
  bodyFatPercent: "",
  muscleMassKg: "",
  bodyWaterPercent: "",
  boneMassKg: "",
  visceralFatRating: "",
  bodyCompositionMethod: "",
  bodyCompositionMeasuredAt: "",
  bodyCompositionNotes: "",
};

const BODY_COMPOSITION_FIELDS = [
  { key: "heightCm", label: "Height", suffix: "cm" },
  { key: "weightKg", label: "Weight", suffix: "kg" },
  { key: "bodyFatPercent", label: "Body Fat", suffix: "%" },
  { key: "muscleMassKg", label: "Muscle Mass", suffix: "kg" },
  { key: "bodyWaterPercent", label: "Body Water", suffix: "%" },
  { key: "boneMassKg", label: "Bone Mass", suffix: "kg" },
  { key: "visceralFatRating", label: "Visceral Fat Rating", suffix: "" },
];

const hasBodyCompositionInput = (profile = {}) =>
  BODY_COMPOSITION_FIELDS.some(({ key }) => profile[key] !== "" && profile[key] != null);

const formatBodyMetric = (value, suffix = "") => {
  if (value === "" || value === null || value === undefined) return "Not set";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "Not set";
  return `${numeric.toFixed(Number.isInteger(numeric) ? 0 : 1)}${suffix}`;
};

const formatBodyDate = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const normalizeBodyReading = (reading = {}) => ({
  id: reading.id,
  createdAt: reading.created_at,
  updatedAt: reading.updated_at,
  ...fromBodyCompositionDb(reading),
});

const buildBodyCompositionTrend = (readings = []) => {
  if (readings.length < 2) return null;

  const latest = normalizeBodyReading(readings[0]);
  const previous = normalizeBodyReading(readings[1]);
  const delta = (key, suffix) => {
    const latestValue = Number(latest[key]);
    const previousValue = Number(previous[key]);
    if (!Number.isFinite(latestValue) || !Number.isFinite(previousValue)) {
      return null;
    }

    const diff = Math.round((latestValue - previousValue) * 10) / 10;
    if (diff === 0) return `no change ${suffix}`.trim();
    return `${diff > 0 ? "+" : ""}${diff}${suffix}`;
  };

  return {
    latestDate: latest.bodyCompositionMeasuredAt || latest.createdAt,
    weight: delta("weightKg", " kg"),
    bodyFat: delta("bodyFatPercent", "%"),
    muscle: delta("muscleMassKg", " kg"),
  };
};

const isSameBodyCompositionReading = (profile = {}, reading = {}) => {
  if (!reading) return false;
  const normalized = normalizeBodyReading(reading);
  const keys = [
    "heightCm",
    "weightKg",
    "bodyFatPercent",
    "muscleMassKg",
    "bodyWaterPercent",
    "boneMassKg",
    "visceralFatRating",
    "bodyCompositionMethod",
    "bodyCompositionMeasuredAt",
  ];

  return keys.every((key) => String(profile[key] || "") === String(normalized[key] || ""));
};

const BodyCompositionMetricsPanel = ({ profile }) => {
  const theme = useTheme();
  const calculated = calculateBodyComposition(profile);
  const hasInput = hasBodyCompositionInput(profile);

  return (
    <Box
      sx={{
        border: "2px solid #333",
        backgroundColor: theme.palette.mode === "dark" ? "#101010" : "#f7f7f7",
        p: 2,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Calculated Snapshot
      </Typography>
      {hasInput ? (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
            <Chip label={`BMI: ${formatBodyMetric(calculated.bmi)}`} />
            <Chip label={`BMI category: ${calculated.bmiCategory || "Need height + weight"}`} />
            <Chip label={`Fat mass: ${formatBodyMetric(calculated.fatMassKg, " kg")}`} />
            <Chip label={`Lean mass: ${formatBodyMetric(calculated.leanMassKg, " kg")}`} />
            <Chip label={`Body fat: ${calculated.bodyFatCategory || "Need body fat %"}`} />
            <Chip label={calculated.weightToMuscleContext || "Need muscle mass"} />
          </Box>
          <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "#9ca3af" }}>
            Estimates vary by method and device. This is for progress tracking and personalization, not diagnosis.
          </Typography>
        </>
      ) : (
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          Add weight, height, body fat, or muscle readings to calculate BMI, fat mass, and lean mass.
        </Typography>
      )}
    </Box>
  );
};

const BodyCompositionHistoryPanel = ({ readings, onDelete, onUpdate, onClose }) => {
  const theme = useTheme();
  const trend = buildBodyCompositionTrend(readings);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(EMPTY_BODY_COMPOSITION_PROFILE);

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditValues({
      ...EMPTY_BODY_COMPOSITION_PROFILE,
      heightCm: item.heightCm ?? "",
      weightKg: item.weightKg ?? "",
      bodyFatPercent: item.bodyFatPercent ?? "",
      muscleMassKg: item.muscleMassKg ?? "",
      bodyWaterPercent: item.bodyWaterPercent ?? "",
      boneMassKg: item.boneMassKg ?? "",
      visceralFatRating: item.visceralFatRating ?? "",
      bodyCompositionMethod: item.bodyCompositionMethod || "",
      bodyCompositionMeasuredAt: item.bodyCompositionMeasuredAt || "",
      bodyCompositionNotes: item.bodyCompositionNotes || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues(EMPTY_BODY_COMPOSITION_PROFILE);
  };

  const saveEditing = async () => {
    if (!editingId || !onUpdate) return;
    await onUpdate(editingId, editValues);
    cancelEditing();
  };

  return (
    <Box
      sx={{
        border: "2px solid #000",
        backgroundColor: theme.palette.mode === "dark" ? "#141414" : "#fff",
        color: theme.palette.mode === "dark" ? "#e2e8f0" : "#111827",
        p: 2,
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Body Composition History
        </Typography>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </Box>

      {trend && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          <Chip label={`Latest: ${formatBodyDate(trend.latestDate)}`} />
          {trend.weight && <Chip label={`Weight ${trend.weight}`} />}
          {trend.bodyFat && <Chip label={`Body fat ${trend.bodyFat}`} />}
          {trend.muscle && <Chip label={`Muscle ${trend.muscle}`} />}
        </Box>
      )}

      {readings.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          No historical readings yet. Save body composition values in your profile to create the first reading.
        </Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 1 }}>
          {readings.slice(0, 8).map((reading) => {
            const item = normalizeBodyReading(reading);
            const isEditing = editingId === item.id;
            const displayValues = isEditing ? editValues : item;
            const calculated = calculateBodyComposition(displayValues);
            return (
              <Box
                key={item.id}
                sx={{
                  border: "1px solid #333",
                  p: 1.5,
                  display: "grid",
                  gap: 0.75,
                  backgroundColor: theme.palette.mode === "dark" ? "#0b0b0b" : "#f8fafc",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {formatBodyDate(item.bodyCompositionMeasuredAt || item.createdAt)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {isEditing ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={saveEditing}
                          aria-label="Save body composition reading"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={cancelEditing}
                          aria-label="Cancel body composition edit"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        {onUpdate && (
                          <IconButton
                            size="small"
                            onClick={() => startEditing(item)}
                            aria-label="Edit body composition reading"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {onDelete && (
                          <IconButton
                            size="small"
                            onClick={() => onDelete(item.id)}
                            aria-label="Delete body composition reading"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
                {isEditing ? (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 1,
                      }}
                    >
                      {BODY_COMPOSITION_FIELDS.map((field) => (
                        <TextField
                          key={field.key}
                          size="small"
                          type="number"
                          label={`${field.label}${field.suffix ? ` (${field.suffix})` : ""}`}
                          value={editValues[field.key]}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [field.key]: e.target.value,
                            })
                          }
                          inputProps={{ min: 0, step: "0.1" }}
                        />
                      ))}
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 1,
                      }}
                    >
                      <FormControl size="small" fullWidth>
                        <InputLabel>Method</InputLabel>
                        <Select
                          value={editValues.bodyCompositionMethod}
                          label="Method"
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              bodyCompositionMethod: e.target.value,
                            })
                          }
                        >
                          {BODY_COMPOSITION_METHODS.map((method) => (
                            <MenuItem key={method} value={method}>
                              {method}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        type="date"
                        label="Measurement Date"
                        value={editValues.bodyCompositionMeasuredAt}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            bodyCompositionMeasuredAt: e.target.value,
                          })
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                    <TextField
                      size="small"
                      multiline
                      rows={2}
                      label="Notes"
                      value={editValues.bodyCompositionNotes}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          bodyCompositionNotes: e.target.value,
                        })
                      }
                    />
                  </>
                ) : null}
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  <Chip size="small" label={`Weight ${formatBodyMetric(displayValues.weightKg, " kg")}`} />
                  <Chip size="small" label={`Body fat ${formatBodyMetric(displayValues.bodyFatPercent, "%")}`} />
                  <Chip size="small" label={`Muscle ${formatBodyMetric(displayValues.muscleMassKg, " kg")}`} />
                  <Chip size="small" label={`BMI ${formatBodyMetric(calculated.bmi)}`} />
                  <Chip size="small" label={`Fat mass ${formatBodyMetric(calculated.fatMassKg, " kg")}`} />
                  <Chip size="small" label={`Lean mass ${formatBodyMetric(calculated.leanMassKg, " kg")}`} />
                </Box>
                <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                  Method: {displayValues.bodyCompositionMethod || "Not set"}
                  {displayValues.bodyCompositionNotes ? ` | Notes: ${displayValues.bodyCompositionNotes}` : ""}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

// PersonalizationIntakeModal Component
const PersonalizationIntakeModal = ({
  open,
  onClose,
  onSave,
  initialProfile,
  isSaving,
  saveError,
}) => {
  const theme = useTheme();
  const modalRef = useRef(null);

  const [profile, setProfile] = useState({
    ageBand: initialProfile?.ageBand || "",
    conditions: normalizeConditionList(initialProfile?.conditions),
    medications: initialProfile?.medications || "",
    allergies: initialProfile?.allergies || "",
    dietaryPattern: initialProfile?.dietaryPattern || "",
    cuisinePreference: initialProfile?.cuisinePreference || "",
    budgetLevel: initialProfile?.budgetLevel || "",
    pregnancyStatus: initialProfile?.pregnancyStatus || "Not pregnant",
    goals: initialProfile?.goals || [],
    ...EMPTY_BODY_COMPOSITION_PROFILE,
    ...Object.fromEntries(
      Object.keys(EMPTY_BODY_COMPOSITION_PROFILE).map((key) => [
        key,
        initialProfile?.[key] ?? EMPTY_BODY_COMPOSITION_PROFILE[key],
      ]),
    ),
  });

  useEffect(() => {
    if (!open) return;

    setProfile({
      ageBand: initialProfile?.ageBand || "",
      conditions: normalizeConditionList(initialProfile?.conditions),
      medications: initialProfile?.medications || "",
      allergies: initialProfile?.allergies || "",
      dietaryPattern: initialProfile?.dietaryPattern || "",
      cuisinePreference: initialProfile?.cuisinePreference || "",
      budgetLevel: initialProfile?.budgetLevel || "",
      pregnancyStatus: initialProfile?.pregnancyStatus || "Not pregnant",
      goals: initialProfile?.goals || [],
      ...EMPTY_BODY_COMPOSITION_PROFILE,
      ...Object.fromEntries(
        Object.keys(EMPTY_BODY_COMPOSITION_PROFILE).map((key) => [
          key,
          initialProfile?.[key] ?? EMPTY_BODY_COMPOSITION_PROFILE[key],
        ]),
      ),
    });
  }, [open, initialProfile]);

  useEffect(() => {
    if (open && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
      );
    }
  }, [open]);

  const handleGoalToggle = (goal) => {
    const newGoals = profile.goals.includes(goal)
      ? profile.goals.filter((g) => g !== goal)
      : [...profile.goals, goal];
    setProfile({ ...profile, goals: newGoals });
  };

  const handleSave = async () => {
    const saved = await onSave({
      ...profile,
      conditions: normalizeConditionList(profile.conditions),
    });
    if (saved !== false) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        ref={modalRef}
        className={styles.personalizationModal}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: theme.palette.mode === "dark" ? "#1a1a1a" : "#fff",
          color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h4" className={styles.modalTitle}>
          🏥 Personalize Your Health Profile
        </Typography>

        <Box className={styles.modalContent}>
          {/* Age Band */}
          <FormControl fullWidth>
            <InputLabel>Age Band</InputLabel>
            <Select
              value={profile.ageBand}
              label="Age Band"
              onChange={(e) =>
                setProfile({ ...profile, ageBand: e.target.value })
              }
            >
              <MenuItem value="18-30">18-30</MenuItem>
              <MenuItem value="31-45">31-45</MenuItem>
              <MenuItem value="46-60">46-60</MenuItem>
              <MenuItem value="61-75">61-75</MenuItem>
              <MenuItem value="76+">76+</MenuItem>
            </Select>
          </FormControl>

          {/* Conditions */}
          <Box className={styles.formSection}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Medical History
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={CONDITIONS}
              value={profile.conditions}
              onChange={(_event, value) =>
                setProfile({
                  ...profile,
                  conditions: normalizeConditionList(value),
                })
              }
              filterSelectedOptions
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    sx={{
                      backgroundColor: "#00e676",
                      color: "#1a1a1a",
                      border: "2px solid #000",
                      fontWeight: 600,
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Diagnosed Conditions"
                  placeholder="Search or add a diagnosed condition"
                />
              )}
            />
          </Box>

          {/* Medications */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Current Medications"
            placeholder="e.g., metformin, lisinopril, atorvastatin"
            value={profile.medications}
            onChange={(e) =>
              setProfile({ ...profile, medications: e.target.value })
            }
          />

          {/* Allergies */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Allergies/Intolerances"
            placeholder="e.g., dairy, shellfish, gluten"
            value={profile.allergies}
            onChange={(e) =>
              setProfile({ ...profile, allergies: e.target.value })
            }
          />

          {/* Dietary Pattern */}
          <FormControl fullWidth>
            <InputLabel>Dietary Pattern</InputLabel>
            <Select
              value={profile.dietaryPattern}
              label="Dietary Pattern"
              onChange={(e) =>
                setProfile({ ...profile, dietaryPattern: e.target.value })
              }
            >
              <MenuItem value="Omnivore">Omnivore</MenuItem>
              <MenuItem value="Vegetarian">Vegetarian</MenuItem>
              <MenuItem value="Vegan">Vegan</MenuItem>
              <MenuItem value="Pescatarian">Pescatarian</MenuItem>
              <MenuItem value="Halal">Halal</MenuItem>
              <MenuItem value="Kosher">Kosher</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Cuisine Preference */}
          <FormControl fullWidth>
            <InputLabel>Cultural Cuisine Preference</InputLabel>
            <Select
              value={profile.cuisinePreference}
              label="Cultural Cuisine Preference"
              onChange={(e) =>
                setProfile({ ...profile, cuisinePreference: e.target.value })
              }
            >
              <MenuItem value="American">American</MenuItem>
              <MenuItem value="Mediterranean">Mediterranean</MenuItem>
              <MenuItem value="South Asian">South Asian</MenuItem>
              <MenuItem value="East Asian">East Asian</MenuItem>
              <MenuItem value="Middle Eastern">Middle Eastern</MenuItem>
              <MenuItem value="African">African</MenuItem>
              <MenuItem value="Latin American">Latin American</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Budget Level */}
          <FormControl fullWidth>
            <InputLabel>Budget Level</InputLabel>
            <Select
              value={profile.budgetLevel}
              label="Budget Level"
              onChange={(e) =>
                setProfile({ ...profile, budgetLevel: e.target.value })
              }
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Moderate">Moderate</MenuItem>
              <MenuItem value="Comfortable">Comfortable</MenuItem>
            </Select>
          </FormControl>

          {/* Pregnancy Status */}
          <FormControl fullWidth>
            <InputLabel>Pregnancy Status</InputLabel>
            <Select
              value={profile.pregnancyStatus}
              label="Pregnancy Status"
              onChange={(e) =>
                setProfile({ ...profile, pregnancyStatus: e.target.value })
              }
            >
              <MenuItem value="Not pregnant">Not pregnant</MenuItem>
              <MenuItem value="Pregnant">Pregnant</MenuItem>
              <MenuItem value="Breastfeeding">Breastfeeding</MenuItem>
              <MenuItem value="Planning pregnancy">Planning pregnancy</MenuItem>
            </Select>
          </FormControl>

          {/* Body Composition */}
          <Box className={styles.formSection}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Body Composition
            </Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af", mb: 1.5 }}>
              Enter readings from a smart scale, DXA, calipers, or manual estimate. Stored units are kg and cm.
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1.5,
                mb: 1.5,
              }}
            >
              {BODY_COMPOSITION_FIELDS.map((field) => (
                <TextField
                  key={field.key}
                  fullWidth
                  type="number"
                  label={`${field.label}${field.suffix ? ` (${field.suffix})` : ""}`}
                  value={profile[field.key]}
                  onChange={(e) =>
                    setProfile({ ...profile, [field.key]: e.target.value })
                  }
                  inputProps={{ min: 0, step: "0.1" }}
                />
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Measurement Method</InputLabel>
                <Select
                  value={profile.bodyCompositionMethod}
                  label="Measurement Method"
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      bodyCompositionMethod: e.target.value,
                    })
                  }
                >
                  {BODY_COMPOSITION_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="date"
                label="Measurement Date"
                value={profile.bodyCompositionMeasuredAt}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bodyCompositionMeasuredAt: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Body Composition Notes"
              placeholder="e.g., morning fasted BIA reading, post-workout reading, DXA clinic result"
              value={profile.bodyCompositionNotes}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bodyCompositionNotes: e.target.value,
                })
              }
              sx={{ mb: 1.5 }}
            />

            <BodyCompositionMetricsPanel profile={profile} />
          </Box>

          {/* Goals */}
          <Box className={styles.formSection}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Primary Goals
            </Typography>
            <Box className={styles.chipContainer}>
              {GOALS.map((goal) => (
                <Chip
                  key={goal}
                  label={goal}
                  onClick={() => handleGoalToggle(goal)}
                  className={
                    profile.goals.includes(goal)
                      ? styles.chipSelected
                      : styles.chipUnselected
                  }
                  sx={{
                    backgroundColor: profile.goals.includes(goal)
                      ? "#00e676"
                      : "#333",
                    color: profile.goals.includes(goal) ? "#1a1a1a" : "#e2e8f0",
                    border: "2px solid #000",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: profile.goals.includes(goal)
                        ? "#00c853"
                        : "#444",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Box className={styles.modalActions}>
          {saveError && (
            <Alert severity="error" sx={{ width: "100%", mb: 1 }}>
              {saveError}
            </Alert>
          )}
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={isSaving}
            sx={{
              border: "2px solid #000",
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
              "&:hover": {
                border: "2px solid #000",
                backgroundColor: "#333",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            className={styles.saveButton}
            disabled={isSaving}
            sx={{
              background: "linear-gradient(135deg, #00e676 0%, #00c853 100%)",
              color: "#1a1a1a",
              border: "2px solid #000",
              fontWeight: 700,
              "&:hover": {
                background: "linear-gradient(135deg, #00c853 0%, #00a344 100%)",
              },
            }}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GUIDED AUDIO SCRIPT LIBRARY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AUDIO_SCRIPTS = {
  breathingMeal: {
    duration: "2-min",
    title: "Steady Breathing Before a Meal",
    description: "Activate parasympathetic nervous system for better digestion",
    bestFor: ["Digestive support", "Mindful eating", "Anxiety"],
    script: `Find a comfortable seated position. Place one hand on your belly and one on your chest.

[Pause 3 seconds]

Close your eyes or soften your gaze downward.

Begin to notice your natural breath, without changing it yet. Just observe.

[Pause 5 seconds]

Now, breathe in slowly through your nose for a count of 4... 1, 2, 3, 4.

Hold gently for 2... 1, 2.

Exhale slowly through your mouth for 6... 1, 2, 3, 4, 5, 6.

[Repeat cycle 5 times with pauses]

Notice your belly rising and falling. This is your body preparing to receive nourishment.

When you're ready, open your eyes and begin your meal with this calm awareness.`,
  },
  calmNervous: {
    duration: "5-min",
    title: "Calm the Nervous System",
    description:
      "Reduce stress and anxiety with guided breathing and body awareness",
    bestFor: ["Stress", "Anxiety", "Panic", "Overwhelm"],
    script: `Find a quiet space where you won't be disturbed. Sit or lie down comfortably.

[Pause 3 seconds]

Place your hands on your lap or by your sides. Close your eyes if that feels safe.

Begin by taking three deep breaths... in through the nose, out through the mouth.

[Pause for 3 breath cycles]

Now, let your breath return to its natural rhythm.

Scan your body from head to toe. Notice where you're holding tension.

[Pause 10 seconds]

Starting at your forehead, consciously relax each muscle. Let your jaw soften, your shoulders drop, your hands release.

[Pause 15 seconds]

As thoughts arise, simply notice them like clouds passing in the sky. You don't need to hold onto them.

Return your attention to the sensation of breathing. The cool air entering your nose, the warm air leaving.

[Pause 20 seconds]

You are safe in this moment. Your body knows how to return to calm. Trust this process.

Continue breathing naturally for as long as you need.

When you're ready, gently wiggle your fingers and toes, and slowly open your eyes.`,
  },
  sleepWindDown: {
    duration: "7-min",
    title: "Sleep Wind-Down",
    description:
      "Progressive relaxation to prepare your body and mind for restful sleep",
    bestFor: ["Insomnia", "Sleep hygiene", "Racing thoughts"],
    script: `Lie down in your bed in your most comfortable sleeping position. Make any final adjustments to your blankets and pillow.

[Pause 5 seconds]

Begin by taking three slow, deep breaths. With each exhale, feel yourself sinking deeper into your mattress.

[Pause for 3 breath cycles]

Now, bring your attention to your feet. Tense all the muscles in your feet for 5 seconds... now release completely. Feel the tension drain away.

[Pause 10 seconds]

Move up to your calves and thighs. Tense... hold... and release. Feel your legs becoming heavy and relaxed.

[Pause 10 seconds]

Tense your buttocks and abdomen... hold... release. Let go completely.

[Pause 10 seconds]

Tighten your chest and back... hold... release. Feel your entire torso softening.

[Pause 10 seconds]

Make fists with your hands, tighten your arms... hold... release. Let your arms become heavy.

[Pause 10 seconds]

Scrunch up your face, all the muscles tight... hold... release. Feel your face smooth and relaxed.

[Pause 10 seconds]

Your entire body is now deeply relaxed. Imagine a warm, gentle wave of relaxation washing over you from head to toe.

[Pause 15 seconds]

If thoughts arise about tomorrow, acknowledge them and let them drift away. Tomorrow will take care of itself.

Focus on the weight of your body on the bed. The warmth of your blankets. The rhythm of your breath.

[Pause 20 seconds]

Allow yourself to drift into natural, restful sleep. You are safe, you are relaxed, you are ready for sleep.

[Continue with gentle silence]`,
  },
  painPacing: {
    duration: "5-min",
    title: "Pain Pacing Reset",
    description:
      "Break the pain-tension cycle and return to baseline during flares",
    bestFor: ["Chronic pain flares", "Fibromyalgia", "Arthritis"],
    script: `Stop what you're doing and find a supported position—sitting or lying down with pillows supporting your painful areas.

[Pause 5 seconds]

Acknowledge that you're experiencing a pain flare. This is not your fault. Your body needs support right now.

Take three deep breaths, sending your breath toward the painful area.

[Pause for 3 breath cycles]

On each exhale, imagine the tension around the pain softening just slightly. You're not trying to eliminate pain, just reduce the tension surrounding it.

[Pause 10 seconds]

Notice what else you're feeling besides pain. Perhaps the support of the chair, the temperature of the air, sounds around you.

[Pause 10 seconds]

Rate your pain on a scale of 0-10. Don't judge this number, just notice it.

[Pause 5 seconds]

Ask yourself: What does my body need right now? Rest? Gentle movement? Ice? Heat? Medication?

[Pause 10 seconds]

Commit to one small supportive action. It might be taking your prescribed pain medication, applying heat, or simply resting for 15 minutes.

[Pause 5 seconds]

Remember: Pacing means respecting your body's signals. A flare doesn't mean you've failed. It means it's time to adjust and support yourself.

Take three more deep breaths. When you're ready, take that one supportive action.

You are managing this condition. You have tools. You are not alone.`,
  },
  walkingMeditation: {
    duration: "10-min",
    title: "Walking Meditation",
    description:
      "Mindful movement combining mental health benefits with gentle activity",
    bestFor: ["Mental health", "Gentle movement", "Mindfulness"],
    script: `Find a quiet path or even a hallway where you can walk slowly for 10 minutes without interruption.

Stand still for a moment. Feel your feet on the ground, your weight distributed evenly.

[Pause 5 seconds]

Begin walking very slowly. Much slower than usual. Notice the sensation of lifting your foot, moving it forward, and placing it down.

[Pause 10 seconds]

Heel touches first, then the ball of your foot, then your toes press into the ground. Feel the weight shift to your other foot.

[Pause 10 seconds]

If your mind wanders—and it will—gently bring your attention back to the physical sensation of walking.

[Pause 15 seconds]

Notice your arms swinging naturally. The movement of your hips. The rhythm of your breath coordinating with your steps.

[Pause 15 seconds]

You don't need to get anywhere. This walk has no destination. You are simply experiencing the act of walking.

[Pause 20 seconds]

Notice what you see around you. Colors, shapes, light and shadow. You don't need to name things, just observe.

[Pause 20 seconds]

Notice sounds. Near and far. Layered like music.

[Pause 20 seconds]

Return your focus to your feet. Each step a deliberate, mindful movement.

[Pause 30 seconds]

As you near the end of your 10 minutes, begin to bring your walk to a close. Come to a gentle stop.

Stand still again. Notice how your body feels now compared to when you started.

Take three deep breaths. Carry this mindful awareness with you into the rest of your day.`,
  },
  urgeSurfing: {
    duration: "3-min",
    title: "Urge Surfing for Cravings",
    description: "Ride the wave of cravings without acting on them",
    bestFor: ["Weight management", "Impulse control", "Behavior change"],
    script: `You're experiencing a craving. That's okay. Cravings are normal. You don't have to act on this one.

Find a comfortable seat. Place your hands on your lap.

[Pause 3 seconds]

Close your eyes. Notice where you feel the craving in your body. Your mouth? Stomach? Chest? Throat?

[Pause 5 seconds]

Imagine the craving as a wave in the ocean. It rises... peaks... and falls. All waves do this. You don't have to do anything but observe.

[Pause 10 seconds]

The wave is rising now. You feel the urge strongly. Rate its intensity: 0-10.

[Pause 5 seconds]

Breathe naturally. The wave is cresting. This is the most intense part. But you are not the wave—you are observing the wave.

[Pause 10 seconds]

Notice what thoughts come with the craving. "I need this." "Just this once." See these as thoughts, not truths.

[Pause 10 seconds]

The wave is beginning to fall. The intensity is slightly less. Rate it again.

[Pause 10 seconds]

Continue breathing. The urge is decreasing. Most cravings peak and pass within 3-5 minutes if you don't act on them.

[Pause 10 seconds]

The wave is returning to the ocean. The craving is still there, but smaller, more manageable.

[Pause 5 seconds]

Open your eyes. You just surfed an urge successfully. This is a skill that gets stronger with practice.

Choose one small supportive action: drink water, take a walk, call a friend, or engage in a different activity.

You are building the life you want, one choice at a time.`,
  },
  selfCompassion: {
    duration: "5-min",
    title: "Self-Compassion After a Setback",
    description:
      "Practice self-kindness and resilience when facing behavior change challenges",
    bestFor: ["Behavior change support", "Guilt", "Shame", "Setbacks"],
    script: `You've experienced a setback. Maybe you missed workouts this week, ate in a way you didn't intend, or didn't follow through on a health goal.

Take a deep breath. This practice is about self-compassion, not self-criticism.

[Pause 5 seconds]

Place your hand on your heart or hold your own hand. This is a gesture of self-kindness.

[Pause 3 seconds]

Say to yourself, silently or aloud: "This is a moment of difficulty. Setbacks are part of being human."

[Pause 10 seconds]

Everyone who has ever tried to change a behavior has faced setbacks. You are not alone. You are not uniquely flawed.

[Pause 10 seconds]

Ask yourself with curiosity, not judgment: What got in the way? Stress? Lack of planning? Exhaustion? Social pressure?

[Pause 10 seconds]

These are barriers, not character flaws. Barriers can be problem-solved.

[Pause 5 seconds]

Now, speak to yourself as you would to a good friend in the same situation. What would you say to them?

[Pause 15 seconds]

Maybe: "You're doing hard work. One rough week doesn't erase all your progress. You can start fresh right now."

[Pause 10 seconds]

Imagine all the people around the world right now also navigating health challenges, also experiencing setbacks. Send compassion to them and to yourself.

[Pause 10 seconds]

Take three deep breaths. On each exhale, release self-criticism. On each inhale, draw in self-compassion.

[Pause for 3 breath cycles]

You are worthy of health and happiness, not because you're perfect, but because you're human.

When you're ready, choose one small, achievable action for today. Not to make up for the setback, but to support your wellbeing right now.

Open your eyes. You've got this.`,
  },
};

const GuidedAudioLibrary = ({ onClose }) => {
  const theme = useTheme();
  const [expandedScript, setExpandedScript] = useState(null);
  const libraryRef = useRef(null);

  useEffect(() => {
    if (libraryRef.current) {
      gsap.fromTo(
        libraryRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: Power3.easeOut },
      );
    }
  }, []);

  return (
    <Box
      ref={libraryRef}
      className={styles.audioLibrary}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#1a1a1a" : "#f5f5f5",
        border: "3px solid #00e676",
        borderRadius: "0px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <SpaIcon /> Guided Audio Scripts
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CancelIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
        Evidence-based guided practices for stress, pain, sleep, and behavior
        change support.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        {Object.entries(AUDIO_SCRIPTS).map(([key, audio]) => (
          <Box
            key={key}
            sx={{
              border: "2px solid #333",
              padding: "15px",
              backgroundColor:
                theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {audio.title}
              </Typography>
              <Chip
                label={audio.duration}
                size="small"
                sx={{
                  backgroundColor: "#00e676",
                  color: "#1a1a1a",
                  fontWeight: 700,
                  border: "2px solid #000",
                }}
              />
            </Box>

            <Typography variant="body2" sx={{ mb: 1, fontSize: "0.85rem" }}>
              {audio.description}
            </Typography>

            <Typography
              variant="caption"
              sx={{ display: "block", mb: 1, opacity: 0.7 }}
            >
              <strong>Best for:</strong> {audio.bestFor.join(", ")}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setExpandedScript(expandedScript === key ? null : key)
              }
              sx={{
                border: "2px solid #00e676",
                color: "#00e676",
                fontWeight: 600,
                "&:hover": {
                  border: "2px solid #00e676",
                  backgroundColor: "rgba(0, 230, 118, 0.1)",
                },
              }}
            >
              {expandedScript === key ? "Hide Script" : "Read Script"}
            </Button>

            {expandedScript === key && (
              <Box
                sx={{
                  mt: 2,
                  padding: "15px",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#000" : "#f9f9f9",
                  border: "2px solid #00e676",
                  whiteSpace: "pre-line",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  lineHeight: 1.8,
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {audio.script}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLEMENT CHECKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const SUPPLEMENTS = {
  "Vitamin D": {
    evidence: "Strong for bone health, limited for other uses",
    foodSources: ["Fatty fish", "Fortified milk", "Egg yolks", "Mushrooms"],
    typicalDose: "600-800 IU/day (maintenance), 1000-2000 IU if deficient",
    interactions: ["Orlistat", "Statins", "Steroids", "Thiazide diuretics"],
    cautions: [
      "Don't exceed 4000 IU/day without supervision",
      "Test levels before high-dose",
    ],
  },
  "Vitamin B12": {
    evidence: "Strong for deficiency prevention in at-risk groups",
    foodSources: ["Meat", "Fish", "Dairy", "Eggs", "Fortified cereals"],
    typicalDose: "2.4 mcg/day (RDA), 1000-2000 mcg if deficient",
    interactions: ["Metformin reduces absorption", "PPIs reduce absorption"],
    cautions: [
      "Essential for vegans and older adults",
      "High-dose for treatment needs clinician guidance",
    ],
  },
  Iron: {
    evidence: "Strong for iron-deficiency anemia",
    foodSources: [
      "Red meat",
      "Poultry",
      "Beans",
      "Spinach",
      "Fortified cereals",
    ],
    typicalDose:
      "18 mg/day (premenopausal women), 8 mg/day (men/postmenopausal women)",
    interactions: [
      "Reduces absorption of thyroid meds",
      "Calcium reduces iron absorption",
    ],
    cautions: [
      "Only supplement if deficient (ferritin <30)",
      "Can cause constipation/nausea",
      "Take on empty stomach",
    ],
  },
  Calcium: {
    evidence: "Strong for bone health in those with inadequate intake",
    foodSources: [
      "Dairy",
      "Fortified plant milks",
      "Leafy greens",
      "Canned fish with bones",
    ],
    typicalDose: "1000-1200 mg/day total (food + supplement)",
    interactions: [
      "Reduces absorption of iron, thyroid meds",
      "Certain BP meds",
    ],
    cautions: [
      "Don't exceed 2000-2500 mg/day total",
      "Take with food",
      "Consider vitamin D for absorption",
    ],
  },
  Magnesium: {
    evidence: "Moderate for deficiency, migraines, constipation",
    foodSources: ["Nuts", "Seeds", "Whole grains", "Leafy greens", "Legumes"],
    typicalDose: "200-400 mg/day",
    interactions: ["Antibiotics", "Diuretics", "Bisphosphonates"],
    cautions: [
      "Can cause diarrhea (especially mag oxide)",
      "Avoid if kidney disease",
      "Multiple forms available",
    ],
  },
  "Omega-3 (Fish Oil)": {
    evidence:
      "Strong for triglycerides (high dose), moderate for CVD prevention",
    foodSources: [
      "Fatty fish (salmon, mackerel, sardines)",
      "Walnuts",
      "Flaxseeds",
    ],
    typicalDose: "1-2g EPA+DHA daily for CVD, 2-4g for high triglycerides",
    interactions: [
      "Blood thinners (increased bleeding risk)",
      "Antiplatelet drugs",
    ],
    cautions: [
      "Stop 2 weeks before surgery",
      "High doses need medical supervision",
      "Quality varies by brand",
    ],
  },
  Probiotics: {
    evidence:
      "Moderate for specific strains in IBS, antibiotic-associated diarrhea",
    foodSources: [
      "Yogurt with live cultures",
      "Kefir",
      "Sauerkraut",
      "Kimchi",
      "Miso",
    ],
    typicalDose: "Varies by strain, typically 1-10 billion CFU",
    interactions: ["Immunosuppressants (risk of infection)"],
    cautions: [
      "Strain-specific effects",
      "Avoid if immunocompromised",
      "Refrigerate most products",
    ],
  },
  "Turmeric/Curcumin": {
    evidence: "Limited for joint pain/inflammation",
    foodSources: ["Turmeric spice (but low bioavailability without enhancers)"],
    typicalDose: "500-1000 mg curcumin with black pepper or fat",
    interactions: ["Blood thinners", "Diabetes medications"],
    cautions: [
      "Can cause GI upset",
      "Poor absorption without enhancers",
      "High doses not well studied long-term",
    ],
  },
  Iodine: {
    evidence: "Strong for deficiency prevention (thyroid health)",
    foodSources: ["Iodized salt", "Seaweed", "Fish", "Dairy"],
    typicalDose: "150 mcg/day",
    interactions: ["Thyroid medications"],
    cautions: [
      "Most people get enough from iodized salt",
      "Excess can worsen thyroid problems",
      "Discuss with doctor if thyroid condition",
    ],
  },
  "Vitamin C": {
    evidence: "Strong for deficiency prevention, limited for cold prevention",
    foodSources: ["Citrus", "Berries", "Bell peppers", "Broccoli", "Tomatoes"],
    typicalDose: "75-90 mg/day (RDA), up to 2000 mg/day tolerable upper limit",
    interactions: ["Minimal"],
    cautions: [
      "High doses can cause diarrhea",
      "Most people get enough from food",
      "Doesn't prevent colds in general population",
    ],
  },
};

const SupplementChecker = ({ userMedications, onClose }) => {
  const theme = useTheme();
  const [selectedSupplement, setSelectedSupplement] = useState("");
  const checkerRef = useRef(null);

  useEffect(() => {
    if (checkerRef.current) {
      gsap.fromTo(
        checkerRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: Power3.easeOut },
      );
    }
  }, []);

  const checkInteractions = (supplement) => {
    if (!userMedications || !supplement) return [];
    const medList = userMedications.toLowerCase();
    const interactions = SUPPLEMENTS[supplement]?.interactions || [];

    return interactions.filter((interaction) =>
      medList.includes(interaction.toLowerCase()),
    );
  };

  const currentInteractions = selectedSupplement
    ? checkInteractions(selectedSupplement)
    : [];

  return (
    <Box
      ref={checkerRef}
      className={styles.supplementChecker}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#1a1a1a" : "#f5f5f5",
        border: "3px solid #ff9800",
        borderRadius: "0px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MedicationIcon /> Supplement Safety Checker
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CancelIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
        Check evidence levels, food sources, and potential interactions for
        common supplements.
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Supplement</InputLabel>
        <Select
          value={selectedSupplement}
          label="Select Supplement"
          onChange={(e) => setSelectedSupplement(e.target.value)}
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
            "& fieldset": { borderColor: "#333", borderWidth: "2px" },
          }}
        >
          <MenuItem value="">-- Select --</MenuItem>
          {Object.keys(SUPPLEMENTS).map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedSupplement && SUPPLEMENTS[selectedSupplement] && (
        <Box
          sx={{
            border: "2px solid #333",
            padding: "20px",
            backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {selectedSupplement}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              <InfoIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5 }}
              />
              Evidence Level:
            </Typography>
            <Typography variant="body2">
              {SUPPLEMENTS[selectedSupplement].evidence}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              🥗 Food Sources First:
            </Typography>
            <Typography variant="body2">
              {SUPPLEMENTS[selectedSupplement].foodSources.join(", ")}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              💊 Typical Dose:
            </Typography>
            <Typography variant="body2">
              {SUPPLEMENTS[selectedSupplement].typicalDose}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              ⚠️ Common Interactions:
            </Typography>
            <Typography variant="body2">
              {SUPPLEMENTS[selectedSupplement].interactions.join(", ")}
            </Typography>

            {currentInteractions.length > 0 && (
              <Box
                sx={{
                  mt: 1,
                  padding: "10px",
                  backgroundColor: "#fff3e0",
                  border: "2px solid #ff9800",
                  color: "#000",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  <WarningAmberIcon
                    sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5 }}
                  />
                  Potential interaction detected with your medications:
                </Typography>
                <Typography variant="body2">
                  {currentInteractions.join(", ")}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                  Consult your healthcare provider before taking this
                  supplement.
                </Typography>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              ⚠️ Cautions:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
              {SUPPLEMENTS[selectedSupplement].cautions.map((caution, idx) => (
                <Typography
                  component="li"
                  variant="body2"
                  key={idx}
                  sx={{ mb: 0.5 }}
                >
                  {caution}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PROGRESS_STORAGE_KEY = "health_progress_data";

const ProgressTracker = ({ onClose }) => {
  const theme = useTheme();
  const trackerRef = useRef(null);

  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [metrics, setMetrics] = useState({
    weight: "",
    bloodPressure: "",
    glucose: "",
    sleepHours: "",
    exerciseMinutes: "",
  });
  const [weeklyChecks, setWeeklyChecks] = useState({});

  useEffect(() => {
    if (trackerRef.current) {
      gsap.fromTo(
        trackerRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: Power3.easeOut },
      );
    }

    // Load from localStorage
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setGoals(data.goals || []);
      setMetrics(data.metrics || metrics);
      setWeeklyChecks(data.weeklyChecks || {});
    }
  }, []);

  useEffect(() => {
    // Save to localStorage whenever data changes
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ goals, metrics, weeklyChecks }),
    );
  }, [goals, metrics, weeklyChecks]);

  const addGoal = () => {
    if (newGoal.trim()) {
      const goal = {
        id: Date.now(),
        text: newGoal.trim(),
        completed: false,
        streak: 0,
        createdAt: new Date().toISOString(),
      };
      setGoals([...goals, goal]);
      setNewGoal("");
    }
  };

  const toggleGoal = (id) => {
    setGoals(
      goals.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            completed: !g.completed,
            streak: !g.completed ? g.streak + 1 : g.streak,
          };
        }
        return g;
      }),
    );
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const handleMetricChange = (metric, value) => {
    setMetrics({ ...metrics, [metric]: value });
  };

  const getWeekKey = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7,
    );
    return `${now.getFullYear()}-W${weekNum}`;
  };

  const toggleWeeklyCheck = (day) => {
    const weekKey = getWeekKey();
    const weekData = weeklyChecks[weekKey] || {};
    setWeeklyChecks({
      ...weeklyChecks,
      [weekKey]: {
        ...weekData,
        [day]: !weekData[day],
      },
    });
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentWeekData = weeklyChecks[getWeekKey()] || {};
  const streak = Object.values(currentWeekData).filter(Boolean).length;

  return (
    <Box
      ref={trackerRef}
      className={styles.progressTracker}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#1a1a1a" : "#f5f5f5",
        border: "3px solid #2196f3",
        borderRadius: "0px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CalendarMonthIcon /> Progress Tracker
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CancelIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
        Track your weekly goals and build healthy habits with streak counters.
      </Typography>

      {/* Weekly Check-in */}
      <Box
        sx={{
          mb: 3,
          padding: "15px",
          border: "2px solid #333",
          backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          This Week's Check-ins {streak > 0 && `🔥 ${streak} day streak!`}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {weekDays.map((day) => (
            <Chip
              key={day}
              label={day}
              onClick={() => toggleWeeklyCheck(day)}
              sx={{
                backgroundColor: currentWeekData[day] ? "#4caf50" : "#333",
                color: currentWeekData[day] ? "#fff" : "#999",
                border: "2px solid #000",
                fontWeight: 700,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: currentWeekData[day] ? "#45a049" : "#444",
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Goals List */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Weekly Goals
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Add a goal (e.g., Walk 20 min 3x this week)"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addGoal()}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                "& fieldset": { borderColor: "#333", borderWidth: "2px" },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={addGoal}
            sx={{
              backgroundColor: "#2196f3",
              color: "#fff",
              fontWeight: 700,
              border: "2px solid #000",
              "&:hover": { backgroundColor: "#1976d2" },
            }}
          >
            Add
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {goals.map((goal) => (
            <Box
              key={goal.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px",
                border: "2px solid #333",
                backgroundColor: goal.completed
                  ? "rgba(76, 175, 80, 0.1)"
                  : theme.palette.mode === "dark"
                    ? "#0d0d0d"
                    : "#fff",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={goal.completed}
                    onChange={() => toggleGoal(goal.id)}
                    sx={{
                      color: "#2196f3",
                      "&.Mui-checked": { color: "#4caf50" },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: goal.completed
                          ? "line-through"
                          : "none",
                        fontWeight: 600,
                      }}
                    >
                      {goal.text}
                    </Typography>
                    {goal.streak > 0 && (
                      <Typography variant="caption" sx={{ color: "#ff9800" }}>
                        🔥 {goal.streak} day streak
                      </Typography>
                    )}
                  </Box>
                }
              />
              <IconButton size="small" onClick={() => deleteGoal(goal.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Metrics (Optional) */}
      <Box
        sx={{
          padding: "15px",
          border: "2px solid #333",
          backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Optional Metrics (Log as needed)
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          <TextField
            size="small"
            label="Weight (lbs/kg)"
            value={metrics.weight}
            onChange={(e) => handleMetricChange("weight", e.target.value)}
          />
          <TextField
            size="small"
            label="BP (120/80)"
            value={metrics.bloodPressure}
            onChange={(e) =>
              handleMetricChange("bloodPressure", e.target.value)
            }
          />
          <TextField
            size="small"
            label="Glucose (mg/dL)"
            value={metrics.glucose}
            onChange={(e) => handleMetricChange("glucose", e.target.value)}
          />
          <TextField
            size="small"
            label="Sleep (hours)"
            value={metrics.sleepHours}
            onChange={(e) => handleMetricChange("sleepHours", e.target.value)}
          />
          <TextField
            size="small"
            label="Exercise (min)"
            value={metrics.exerciseMinutes}
            onChange={(e) =>
              handleMetricChange("exerciseMinutes", e.target.value)
            }
            sx={{ gridColumn: "span 2" }}
          />
        </Box>
      </Box>
    </Box>
  );
};

// Format message content with markdown-style formatting
const FormattedMessage = ({ content }) => {
  const theme = useTheme();
  if (!content) return null;

  // Check for structured content markers
  const hasShoppingList = content.includes("## SHOPPING LIST");
  const hasMealPlan = content.includes("## MEAL PLAN");
  const hasRecipe = /## RECIPE:/i.test(content);
  const hasWeeklyPlan = content.includes("## WEEKLY PLAN");
  const hasProgressSummary = content.includes("## PROGRESS SUMMARY");

  // Render Shopping List with checkboxes
  const renderShoppingList = (text) => {
    const sections = text.split(/\n(?=[-•]\s)/);
    const categoryGroups = {};
    let currentCategory = "Other";

    sections.forEach((section) => {
      const categoryMatch = section.match(/^[-•]\s*(.+?):/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        const items = section
          .split("\n")
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => line.replace(/^[-•]\s*/, "").trim());
        categoryGroups[currentCategory] = items;
      }
    });

    return (
      <Box
        sx={{
          border: "3px solid #4caf50",
          padding: "20px",
          backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <RestaurantIcon /> Shopping List
        </Typography>
        {Object.entries(categoryGroups).map(([category, items]) => (
          <Box key={category} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {category}
            </Typography>
            <FormGroup>
              {items.map((item, idx) => (
                <FormControlLabel
                  key={idx}
                  control={<Checkbox sx={{ color: "#4caf50" }} />}
                  label={item}
                  sx={{
                    "& .MuiFormControlLabel-label": { fontSize: "0.9rem" },
                  }}
                />
              ))}
            </FormGroup>
          </Box>
        ))}
      </Box>
    );
  };

  // Render Meal Plan as table/grid
  const renderMealPlan = (text) => {
    const days = text.split(
      /\n(?=\*\*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))/i,
    );

    return (
      <Box
        sx={{
          border: "3px solid #2196f3",
          padding: "20px",
          backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CalendarMonthIcon /> Weekly Meal Plan
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {days.map((day, idx) => {
            if (!day.trim()) return null;
            const dayMatch = day.match(/\*\*(.+?)\*\*/);
            const dayName = dayMatch ? dayMatch[1] : `Day ${idx + 1}`;

            return (
              <Box
                key={idx}
                sx={{
                  border: "2px solid #333",
                  padding: "15px",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#1a1a1a" : "#f9f9f9",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, mb: 1, color: "#2196f3" }}
                >
                  {dayName}
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ whiteSpace: "pre-line", fontSize: "0.85rem" }}
                >
                  {day.replace(/\*\*.+?\*\*/, "").trim()}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Render Recipe Card
  const renderRecipe = (text) => {
    const recipeTitleMatch = text.match(/## RECIPE:\s*(.+)/i);
    const recipeTitle = recipeTitleMatch ? recipeTitleMatch[1] : "Recipe";

    const ingredientsMatch = text.match(
      /\*\*Ingredients:\*\*(.+?)(?=\*\*Instructions:|\*\*Nutrition|$)/s,
    );
    const instructionsMatch = text.match(
      /\*\*Instructions:\*\*(.+?)(?=\*\*Nutrition|$)/s,
    );
    const nutritionMatch = text.match(
      /\*\*Nutrition Notes:\*\*(.+?)(?=\*\*Swaps:|$)/s,
    );
    const swapsMatch = text.match(/\*\*Swaps:\*\*(.+?)$/s);

    return (
      <Box
        sx={{
          border: "3px solid #ff9800",
          padding: "20px",
          backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <RestaurantIcon /> {recipeTitle}
        </Typography>

        {ingredientsMatch && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Ingredients:
            </Typography>
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: "pre-line", pl: 1 }}
            >
              {ingredientsMatch[1].trim()}
            </Typography>
          </Box>
        )}

        {instructionsMatch && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Instructions:
            </Typography>
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: "pre-line", pl: 1 }}
            >
              {instructionsMatch[1].trim()}
            </Typography>
          </Box>
        )}

        {nutritionMatch && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor:
                theme.palette.mode === "dark" ? "#1a1a1a" : "#f9f9f9",
              border: "1px solid #333",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Nutrition Notes: {nutritionMatch[1].trim()}
            </Typography>
          </Box>
        )}

        {swapsMatch && (
          <Box
            sx={{
              p: 1.5,
              backgroundColor:
                theme.palette.mode === "dark" ? "#1a1a1a" : "#f9f9f9",
              border: "1px solid #333",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Swaps: {swapsMatch[1].trim()}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Render Weekly Plan with timeline
  const renderWeeklyPlan = (text) => {
    return (
      <Box
        sx={{
          border: "3px solid #9c27b0",
          padding: "20px",
          backgroundColor: theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CalendarMonthIcon /> Your Weekly Plan
        </Typography>
        <Typography
          variant="body2"
          component="div"
          sx={{ whiteSpace: "pre-line" }}
        >
          {text.replace(/## WEEKLY PLAN/i, "").trim()}
        </Typography>
      </Box>
    );
  };

  // If content has structured markers, render them specially
  if (hasShoppingList) {
    const listSection = content.match(/## SHOPPING LIST(.+?)(?=##|$)/s);
    if (listSection) {
      const beforeList = content.substring(
        0,
        content.indexOf("## SHOPPING LIST"),
      );
      const afterList = content.substring(
        content.indexOf("## SHOPPING LIST") + listSection[0].length,
      );

      return (
        <Box>
          {beforeList && <Box>{formatText(beforeList)}</Box>}
          {renderShoppingList(listSection[1])}
          {afterList && <Box>{formatText(afterList)}</Box>}
        </Box>
      );
    }
  }

  if (hasMealPlan) {
    const planSection = content.match(/## MEAL PLAN(.+?)(?=##|$)/s);
    if (planSection) {
      const beforePlan = content.substring(0, content.indexOf("## MEAL PLAN"));
      const afterPlan = content.substring(
        content.indexOf("## MEAL PLAN") + planSection[0].length,
      );

      return (
        <Box>
          {beforePlan && <Box>{formatText(beforePlan)}</Box>}
          {renderMealPlan(planSection[1])}
          {afterPlan && <Box>{formatText(afterPlan)}</Box>}
        </Box>
      );
    }
  }

  if (hasRecipe) {
    const recipeSection = content.match(/## RECIPE:(.+?)(?=##|$)/s);
    if (recipeSection) {
      const beforeRecipe = content.substring(0, content.indexOf("## RECIPE:"));
      const afterRecipe = content.substring(
        content.indexOf("## RECIPE:") + recipeSection[0].length,
      );

      return (
        <Box>
          {beforeRecipe && <Box>{formatText(beforeRecipe)}</Box>}
          {renderRecipe("## RECIPE:" + recipeSection[1])}
          {afterRecipe && <Box>{formatText(afterRecipe)}</Box>}
        </Box>
      );
    }
  }

  if (hasWeeklyPlan) {
    const planSection = content.match(/## WEEKLY PLAN(.+?)(?=##|$)/s);
    if (planSection) {
      const beforePlan = content.substring(
        0,
        content.indexOf("## WEEKLY PLAN"),
      );
      const afterPlan = content.substring(
        content.indexOf("## WEEKLY PLAN") + planSection[0].length,
      );

      return (
        <Box>
          {beforePlan && <Box>{formatText(beforePlan)}</Box>}
          {renderWeeklyPlan("## WEEKLY PLAN" + planSection[1])}
          {afterPlan && <Box>{formatText(afterPlan)}</Box>}
        </Box>
      );
    }
  }

  // Function to detect and render evidence badges
  const renderEvidenceBadge = (text) => {
    const evidencePatterns = [
      {
        pattern: /\*\*Strong evidence\*\*|Strong evidence|STRONG EVIDENCE/gi,
        label: "Strong evidence",
        color: "#4caf50",
        icon: <CheckCircleIcon sx={{ fontSize: "0.9rem" }} />,
      },
      {
        pattern:
          /\*\*Moderate evidence\*\*|Moderate evidence|MODERATE EVIDENCE/gi,
        label: "Moderate evidence",
        color: "#2196f3",
        icon: <InfoIcon sx={{ fontSize: "0.9rem" }} />,
      },
      {
        pattern: /\*\*Limited evidence\*\*|Limited evidence|LIMITED EVIDENCE/gi,
        label: "Limited evidence",
        color: "#ff9800",
        icon: <WarningAmberIcon sx={{ fontSize: "0.9rem" }} />,
      },
      {
        pattern:
          /\*\*(Not recommended|Insufficient evidence)\*\*|Not recommended|Insufficient evidence|NOT RECOMMENDED|INSUFFICIENT EVIDENCE/gi,
        label: "Not recommended",
        color: "#f44336",
        icon: <CancelIcon sx={{ fontSize: "0.9rem" }} />,
      },
    ];

    // Safety warning patterns
    const safetyPatterns = [
      {
        pattern: /⚠️\s*CAUTION:/gi,
        color: "#ff9800",
        bgColor: "#fff3e0",
      },
      {
        pattern: /🚨\s*EMERGENCY:/gi,
        color: "#f44336",
        bgColor: "#ffebee",
      },
      {
        pattern: /⛔\s*CONTRAINDICATION:/gi,
        color: "#d32f2f",
        bgColor: "#ffcdd2",
      },
    ];

    const parts = [];
    let lastIndex = 0;
    const matches = [];

    // Find all evidence badge matches
    evidencePatterns.forEach(({ pattern, label, color, icon }) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: "evidence",
          label,
          color,
          icon,
        });
      }
    });

    // Find all safety warning matches
    safetyPatterns.forEach(({ pattern, color, bgColor }) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: "safety",
          originalText: match[0],
          color,
          bgColor,
        });
      }
    });

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Build parts array with badges
    matches.forEach((match, idx) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add badge
      if (match.type === "evidence") {
        parts.push(
          <Chip
            key={`badge-${idx}`}
            label={match.label}
            icon={match.icon}
            size="small"
            sx={{
              backgroundColor: match.color,
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.75rem",
              height: "24px",
              mx: 0.5,
              "& .MuiChip-icon": {
                color: "#fff",
              },
            }}
          />,
        );
      } else if (match.type === "safety") {
        parts.push(
          <Box
            key={`safety-${idx}`}
            component="span"
            sx={{
              display: "inline-block",
              backgroundColor: match.bgColor,
              color: match.color,
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "2px 8px",
              borderRadius: "4px",
              border: `1px solid ${match.color}`,
              mx: 0.5,
            }}
          >
            {match.originalText}
          </Box>,
        );
      }

      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const formatText = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let currentList = null;
    let currentListType = null;

    lines.forEach((line, lineIndex) => {
      // Check for safety alert patterns
      if (line.match(/^⚠️\s*CAUTION:/i)) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        elements.push(
          <Box
            key={`caution-${lineIndex}`}
            className={styles.safetyAlertCaution}
          >
            <WarningAmberIcon className={styles.alertIcon} />
            <Typography className={styles.alertText}>{line}</Typography>
          </Box>,
        );
        return;
      }

      if (line.match(/^🚨\s*EMERGENCY:/i)) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        elements.push(
          <Box
            key={`emergency-${lineIndex}`}
            className={styles.safetyAlertEmergency}
          >
            <ErrorIcon className={styles.alertIcon} />
            <Typography className={styles.alertText}>{line}</Typography>
          </Box>,
        );
        return;
      }

      if (line.match(/^⛔\s*CONTRAINDICATION:/i)) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        elements.push(
          <Box
            key={`contra-${lineIndex}`}
            className={styles.safetyAlertContraindication}
          >
            <CancelIcon className={styles.alertIcon} />
            <Typography className={styles.alertText}>{line}</Typography>
          </Box>,
        );
        return;
      }

      if (line.match(/^✅\s*SAFE FOR:/i)) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        elements.push(
          <Box key={`safe-${lineIndex}`} className={styles.safetyAlertSafe}>
            <CheckCircleIcon className={styles.alertIcon} />
            <Typography className={styles.alertText}>{line}</Typography>
          </Box>,
        );
        return;
      }

      // Skip empty lines between elements but preserve them within text
      if (!line.trim()) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        elements.push(<br key={`br-${lineIndex}`} />);
        return;
      }

      // Check for numbered list (1. 2. 3. etc.)
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        const content = formatInlineText(numberedMatch[2]);
        if (currentListType !== "ol") {
          if (currentList) {
            elements.push(currentList);
          }
          currentList = { type: "ol", items: [] };
          currentListType = "ol";
        }
        currentList.items.push(<li key={`li-${lineIndex}`}>{content}</li>);
        return;
      }

      // Check for bullet points (-, *, or •)
      const bulletMatch = line.match(/^[\-\*•]\s+(.+)/);
      if (bulletMatch) {
        const content = formatInlineText(bulletMatch[1]);
        if (currentListType !== "ul") {
          if (currentList) {
            elements.push(currentList);
          }
          currentList = { type: "ul", items: [] };
          currentListType = "ul";
        }
        currentList.items.push(<li key={`li-${lineIndex}`}>{content}</li>);
        return;
      }

      // Close any open list
      if (currentList) {
        elements.push(currentList);
        currentList = null;
        currentListType = null;
      }

      // Check for headers (##)
      const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const content = formatInlineText(headerMatch[2]);
        elements.push(
          <Typography
            key={`h-${lineIndex}`}
            variant={`h${Math.min(level + 4, 6)}`}
            sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}
          >
            {content}
          </Typography>,
        );
        return;
      }

      // Regular text with inline formatting
      elements.push(
        <Typography
          key={`p-${lineIndex}`}
          component="div"
          sx={{ mb: 0.5, lineHeight: 1.6 }}
        >
          {formatInlineText(line)}
        </Typography>,
      );
    });

    // Don't forget to push any remaining list
    if (currentList) {
      elements.push(currentList);
    }

    // Convert list objects to JSX
    return elements.map((el, idx) => {
      if (el && el.type === "ol") {
        return (
          <Box
            component="ol"
            key={`ol-${idx}`}
            sx={{
              pl: 2.5,
              my: 1,
              "& li": {
                mb: 0.5,
                lineHeight: 1.6,
              },
            }}
          >
            {el.items}
          </Box>
        );
      }
      if (el && el.type === "ul") {
        return (
          <Box
            component="ul"
            key={`ul-${idx}`}
            sx={{
              pl: 2.5,
              my: 1,
              "& li": {
                mb: 0.5,
                lineHeight: 1.6,
              },
            }}
          >
            {el.items}
          </Box>
        );
      }
      return el;
    });
  };

  // Format inline text (bold, italic, evidence badges, etc.)
  const formatInlineText = (text) => {
    const parts = [];
    let lastIndex = 0;

    // First, handle evidence badges and safety warnings
    const withBadges = renderEvidenceBadge(text);
    if (Array.isArray(withBadges)) {
      // Evidence badges were found, now process bold text in the string parts
      withBadges.forEach((part, partIdx) => {
        if (typeof part === "string") {
          // Process bold text in this string part
          const boldProcessed = processBoldText(part);
          parts.push(
            ...(Array.isArray(boldProcessed) ? boldProcessed : [boldProcessed]),
          );
        } else {
          // This is already a JSX element (badge)
          parts.push(part);
        }
      });
      return parts;
    } else {
      // No evidence badges, just process bold text
      return processBoldText(text);
    }
  };

  // Helper function to process bold text
  const processBoldText = (text) => {
    const parts = [];
    let lastIndex = 0;
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      // Add bold text
      parts.push(
        <strong key={`b-${match.index}`} style={{ fontWeight: 700 }}>
          {match[1]}
        </strong>,
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <Box className={styles.formattedContent}>{formatText(content)}</Box>;
};

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AccessibilityPanel = ({ open, onClose, settings, onSettingsChange }) => {
  const theme = useTheme();
  const panelRef = useRef(null);

  useEffect(() => {
    if (open && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { x: -300, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: Power3.easeOut },
      );
    }
  }, [open]);

  if (!open) return null;

  return (
    <Box
      ref={panelRef}
      sx={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "300px",
        backgroundColor: theme.palette.mode === "dark" ? "#1a1a1a" : "#fff",
        border: "3px solid #9c27b0",
        padding: "20px",
        overflowY: "auto",
        zIndex: 1000,
        boxShadow: "5px 0 15px rgba(0,0,0,0.3)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <SettingsAccessibilityIcon /> Accessibility
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CancelIcon />
        </IconButton>
      </Box>

      {/* Reading Level */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <InfoIcon fontSize="small" /> Reading Level
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={settings.readingLevel}
            onChange={(e) =>
              onSettingsChange({ ...settings, readingLevel: e.target.value })
            }
            sx={{
              backgroundColor:
                theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
              "& fieldset": { borderColor: "#333", borderWidth: "2px" },
            }}
          >
            <MenuItem value="simple">Simple (8th grade)</MenuItem>
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="technical">Technical</MenuItem>
          </Select>
        </FormControl>
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
        >
          Adjusts language complexity
        </Typography>
      </Box>

      {/* Text Size */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <TextIncreaseIcon fontSize="small" /> Text Size
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={settings.textSize}
            onChange={(e) =>
              onSettingsChange({ ...settings, textSize: e.target.value })
            }
            sx={{
              backgroundColor:
                theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
              "& fieldset": { borderColor: "#333", borderWidth: "2px" },
            }}
          >
            <MenuItem value="small">Small</MenuItem>
            <MenuItem value="medium">Medium (Default)</MenuItem>
            <MenuItem value="large">Large</MenuItem>
            <MenuItem value="xlarge">Extra Large</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* High Contrast Mode */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={settings.highContrast}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  highContrast: e.target.checked,
                })
              }
              sx={{ color: "#9c27b0", "&.Mui-checked": { color: "#9c27b0" } }}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ContrastIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                High Contrast (WCAG AAA)
              </Typography>
            </Box>
          }
        />
        <Typography
          variant="caption"
          sx={{ display: "block", pl: 4, opacity: 0.7 }}
        >
          Increases visibility
        </Typography>
      </Box>

      {/* Screen Reader Mode */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={settings.screenReaderMode}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  screenReaderMode: e.target.checked,
                })
              }
              sx={{ color: "#9c27b0", "&.Mui-checked": { color: "#9c27b0" } }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Screen Reader Optimized
            </Typography>
          }
        />
        <Typography
          variant="caption"
          sx={{ display: "block", pl: 4, opacity: 0.7 }}
        >
          Enhanced ARIA labels
        </Typography>
      </Box>

      {/* Keyboard Shortcuts */}
      <Box
        sx={{
          padding: "15px",
          border: "2px solid #333",
          backgroundColor:
            theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <KeyboardIcon fontSize="small" /> Keyboard Shortcuts
        </Typography>
        <Box sx={{ fontSize: "0.8rem", "& > div": { mb: 0.5 } }}>
          <div>
            <strong>Enter:</strong> Send message
          </div>
          <div>
            <strong>Shift+Enter:</strong> New line
          </div>
          <div>
            <strong>Esc:</strong> Close modals
          </div>
          <div>
            <strong>Tab:</strong> Navigate elements
          </div>
          <div>
            <strong>Ctrl+K:</strong> Focus input
          </div>
        </Box>
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELP PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const HelpPanel = ({ open, onClose }) => {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}
      >
        <HelpOutlineIcon /> How to Use the Health Coach
      </DialogTitle>
      <DialogContent>
        <Box sx={{ "& > div": { mb: 3 } }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              🎯 What This Chatbot Does
            </Typography>
            <Typography variant="body2">
              Provides evidence-based guidance on lifestyle medicine, chronic
              disease self-management, nutrition, physical activity, stress
              management, and complementary approaches. Every recommendation
              includes clear evidence levels.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              📊 Understanding Evidence Levels
            </Typography>
            <Box sx={{ pl: 2, "& > div": { mb: 1 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label="Strong evidence"
                  size="small"
                  sx={{
                    backgroundColor: "#4caf50",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
                <Typography variant="body2">
                  Multiple high-quality studies, endorsed by medical societies
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label="Moderate evidence"
                  size="small"
                  sx={{
                    backgroundColor: "#2196f3",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
                <Typography variant="body2">
                  Some studies, modest but meaningful effects
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label="Limited evidence"
                  size="small"
                  sx={{
                    backgroundColor: "#ff9800",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
                <Typography variant="body2">
                  Small studies or inconsistent results, may help but not proven
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label="Not recommended"
                  size="small"
                  sx={{
                    backgroundColor: "#f44336",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
                <Typography variant="body2">
                  No quality evidence or evidence shows harm/no benefit
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              ⚠️ When to See a Doctor vs. Use This Chatbot
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>See a doctor for:</strong> New symptoms, worsening
              conditions, abnormal test results, medication decisions,
              diagnosis, acute illness/injury
            </Typography>
            <Typography variant="body2">
              <strong>Use this chatbot for:</strong> Learning about lifestyle
              interventions, understanding evidence, behavior change support,
              meal planning, supplement safety information, self-management
              strategies
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              🚨 Safety Features
            </Typography>
            <Typography variant="body2">
              The chatbot automatically detects emergency situations and
              provides immediate guidance to call 911 or crisis lines. It checks
              for dangerous medication interactions and always recommends
              consulting healthcare providers before making changes.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              💡 Tips for Best Results
            </Typography>
            <Box component="ul" sx={{ pl: 3, mt: 1 }}>
              <li>Fill out your profile for personalized recommendations</li>
              <li>Be specific about your goals and concerns</li>
              <li>
                Ask for meal plans, shopping lists, or weekly action plans
              </li>
              <li>Use the supplement checker for safety information</li>
              <li>Export your conversation to share with your doctor</li>
              <li>Track your progress with the progress tracker</li>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              📤 Exporting Data
            </Typography>
            <Typography variant="body2">
              You can export your conversations in multiple formats (Markdown,
              PDF, JSON, FHIR) to share with healthcare providers or keep for
              your records. Click the download icon in the header.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ backgroundColor: "#9c27b0", color: "#fff", fontWeight: 700 }}
        >
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PRIVACY NOTICE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PrivacyNotice = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}
      >
        <PrivacyTipIcon /> Privacy & Data Storage
      </DialogTitle>
      <DialogContent>
        <Box sx={{ "& > div": { mb: 2 } }}>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 1, fontSize: "1rem" }}
            >
              🔒 What Data is Stored
            </Typography>
            <Typography variant="body2">
              Your profile information, conversation history, goals, and
              preferences are stored{" "}
              <strong>locally in your browser only</strong> using localStorage.
              No health information is stored on our servers.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 1, fontSize: "1rem" }}
            >
              🌐 API Usage
            </Typography>
            <Typography variant="body2">
              Your messages are sent to OpenAI's API to generate responses.
              OpenAI processes the request but does not retain your data for
              training purposes (as per API terms). Your conversations are not
              visible to other users.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 1, fontSize: "1rem" }}
            >
              🗑️ Clearing Your Data
            </Typography>
            <Typography variant="body2">
              You can delete all your data at any time by clicking the "Clear
              Chat" button or by clearing your browser's localStorage. This
              action is immediate and permanent.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 1, fontSize: "1rem" }}
            >
              🔐 Security Recommendations
            </Typography>
            <Box component="ul" sx={{ pl: 3, mt: 1, fontSize: "0.875rem" }}>
              <li>
                Don't share personally identifiable information (full name,
                address, SSN, etc.)
              </li>
              <li>Use general terms when discussing conditions</li>
              <li>Export and delete sensitive conversations after use</li>
              <li>Don't use on shared or public computers</li>
            </Box>
          </Box>

          <Box
            sx={{
              padding: "10px",
              border: "2px solid #ff9800",
              backgroundColor: "#fff3e0",
              color: "#000",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              ⚠️ Important: This chatbot is for educational purposes only and
              does not constitute medical advice. Always consult your healthcare
              provider for medical decisions.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ backgroundColor: "#9c27b0", color: "#fff", fontWeight: 700 }}
        >
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH INSIGHTS DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const HealthInsights = ({ open, onClose, messages, userProfile }) => {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (open) {
      // Load analytics from localStorage
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        setAnalytics(JSON.parse(stored));
      } else {
        // Generate initial analytics
        const newAnalytics = generateAnalytics(messages, userProfile);
        setAnalytics(newAnalytics);
        localStorage.setItem(
          ANALYTICS_STORAGE_KEY,
          JSON.stringify(newAnalytics),
        );
      }
    }
  }, [open, messages, userProfile]);

  const generateAnalytics = (msgs, profile) => {
    const conversationCount = msgs.filter((m) => m.role === "user").length;

    // Extract topics from messages
    const topics = [];
    const topicKeywords = {
      Nutrition: ["meal", "food", "diet", "eating", "recipe"],
      Exercise: ["exercise", "workout", "activity", "physical", "walk"],
      Medications: [
        "medication",
        "medicine",
        "drug",
        "prescription",
        "supplement",
      ],
      "Stress Management": [
        "stress",
        "anxiety",
        "meditation",
        "breathing",
        "relax",
      ],
      Sleep: ["sleep", "insomnia", "rest", "tired", "fatigue"],
      "Pain Management": ["pain", "ache", "hurt", "chronic pain"],
      Weight: ["weight", "lose weight", "obesity", "diet"],
    };

    msgs
      .filter((m) => m.role === "user")
      .forEach((msg) => {
        const content = msg.content.toLowerCase();
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          if (keywords.some((kw) => content.includes(kw))) {
            topics.push(topic);
          }
        });
      });

    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {});

    // Count evidence levels in responses
    const evidenceCounts = {
      strong: 0,
      moderate: 0,
      limited: 0,
      notRecommended: 0,
    };

    msgs
      .filter((m) => m.role === "assistant")
      .forEach((msg) => {
        const content = msg.content || "";
        evidenceCounts.strong += (
          content.match(/strong evidence/gi) || []
        ).length;
        evidenceCounts.moderate += (
          content.match(/moderate evidence/gi) || []
        ).length;
        evidenceCounts.limited += (
          content.match(/limited evidence/gi) || []
        ).length;
        evidenceCounts.notRecommended += (
          content.match(/not recommended|insufficient evidence/gi) || []
        ).length;
      });

    const totalEvidence = Object.values(evidenceCounts).reduce(
      (a, b) => a + b,
      0,
    );

    // Count safety alerts
    const safetyAlerts = msgs
      .filter((m) => m.role === "assistant")
      .reduce((count, msg) => {
        const content = msg.content || "";
        if (content.includes("🚨") || content.includes("EMERGENCY")) count++;
        return count;
      }, 0);

    return {
      conversationCount,
      topicCounts,
      evidenceCounts,
      totalEvidence,
      safetyAlerts,
      lastUpdated: new Date().toISOString(),
    };
  };

  if (!analytics) return null;

  const topTopics = Object.entries(analytics.topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}
      >
        <BarChartIcon /> Your Health Insights
      </DialogTitle>
      <DialogContent>
        <Box sx={{ "& > div": { mb: 3 } }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              📊 Conversation Analytics
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <Box
                sx={{
                  padding: "15px",
                  border: "2px solid #2196f3",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#2196f3" }}
                >
                  {analytics.conversationCount}
                </Typography>
                <Typography variant="body2">Total Conversations</Typography>
              </Box>
              <Box
                sx={{
                  padding: "15px",
                  border: "2px solid #4caf50",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#4caf50" }}
                >
                  {topTopics.length}
                </Typography>
                <Typography variant="body2">Topics Discussed</Typography>
              </Box>
            </Box>
          </Box>

          {topTopics.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                🏷️ Most Discussed Topics
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {topTopics.map(([topic, count]) => (
                  <Chip
                    key={topic}
                    label={`${topic} (${count})`}
                    sx={{
                      backgroundColor: "#9c27b0",
                      color: "#fff",
                      fontWeight: 600,
                      border: "2px solid #000",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {analytics.totalEvidence > 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                📈 Evidence Quality Breakdown
              </Typography>
              <Box sx={{ "& > div": { mb: 1 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: "150px" }}>
                    <Chip
                      label="Strong evidence"
                      size="small"
                      sx={{
                        backgroundColor: "#4caf50",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      height: "20px",
                      backgroundColor: "#e0e0e0",
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(analytics.evidenceCounts.strong / analytics.totalEvidence) * 100}%`,
                        backgroundColor: "#4caf50",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ width: "50px", textAlign: "right" }}
                  >
                    {analytics.evidenceCounts.strong}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: "150px" }}>
                    <Chip
                      label="Moderate"
                      size="small"
                      sx={{
                        backgroundColor: "#2196f3",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      height: "20px",
                      backgroundColor: "#e0e0e0",
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(analytics.evidenceCounts.moderate / analytics.totalEvidence) * 100}%`,
                        backgroundColor: "#2196f3",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ width: "50px", textAlign: "right" }}
                  >
                    {analytics.evidenceCounts.moderate}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: "150px" }}>
                    <Chip
                      label="Limited"
                      size="small"
                      sx={{
                        backgroundColor: "#ff9800",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      height: "20px",
                      backgroundColor: "#e0e0e0",
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(analytics.evidenceCounts.limited / analytics.totalEvidence) * 100}%`,
                        backgroundColor: "#ff9800",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ width: "50px", textAlign: "right" }}
                  >
                    {analytics.evidenceCounts.limited}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              🛡️ Safety Tracking
            </Typography>
            <Box
              sx={{
                padding: "15px",
                border: "2px solid #f44336",
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
              }}
            >
              <Typography variant="body2">
                <strong>Emergency Flags Triggered:</strong>{" "}
                {analytics.safetyAlerts}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 1, opacity: 0.7 }}
              >
                The chatbot proactively identifies safety concerns and provides
                emergency guidance when needed.
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ backgroundColor: "#9c27b0", color: "#fff", fontWeight: 700 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT MODAL COMPONENT (Multi-format)
// ═══════════════════════════════════════════════════════════════════════════

const ExportModal = ({ open, onClose, messages, userProfile, onExport }) => {
  const theme = useTheme();
  const [format, setFormat] = useState("markdown");
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeFullConversation, setIncludeFullConversation] = useState(true);

  const handleExport = () => {
    onExport(format, {
      includeProfile,
      includeFullConversation,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Export Conversation</DialogTitle>
      <DialogContent>
        <Box sx={{ "& > div": { mb: 2 } }}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={format}
              label="Export Format"
              onChange={(e) => setFormat(e.target.value)}
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                "& fieldset": { borderColor: "#333", borderWidth: "2px" },
              }}
            >
              <MenuItem value="markdown">📝 Markdown (.md)</MenuItem>
              <MenuItem value="json">📊 JSON (.json)</MenuItem>
              <MenuItem value="txt">📄 Plain Text (.txt)</MenuItem>
              <MenuItem value="fhir">🏥 FHIR Bundle (.json)</MenuItem>
            </Select>
          </FormControl>

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeProfile}
                  onChange={(e) => setIncludeProfile(e.target.checked)}
                  sx={{
                    color: "#2196f3",
                    "&.Mui-checked": { color: "#2196f3" },
                  }}
                />
              }
              label="Include Profile Information"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeFullConversation}
                  onChange={(e) => setIncludeFullConversation(e.target.checked)}
                  sx={{
                    color: "#2196f3",
                    "&.Mui-checked": { color: "#2196f3" },
                  }}
                />
              }
              label="Include Full Conversation"
            />
          </FormGroup>

          {format === "fhir" && (
            <Box
              sx={{
                padding: "10px",
                border: "2px solid #2196f3",
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
              }}
            >
              <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                <InfoIcon
                  sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5 }}
                />
                FHIR (Fast Healthcare Interoperability Resources) format is
                compatible with electronic health record systems.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          sx={{ backgroundColor: "#2196f3", color: "#fff", fontWeight: 700 }}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ImportModal = ({ open, onClose, onImport }) => {
  const theme = useTheme();
  const [importType, setImportType] = useState("json");
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let data;

        if (importType === "json") {
          data = JSON.parse(content);
          onImport(data, "json");
        } else if (importType === "fhir") {
          data = JSON.parse(content);
          onImport(data, "fhir");
        }

        onClose();
      } catch (error) {
        alert(
          "Error parsing file. Please ensure it's a valid " +
            importType.toUpperCase() +
            " file.",
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Import Data</DialogTitle>
      <DialogContent>
        <Box sx={{ "& > div": { mb: 2 } }}>
          <FormControl fullWidth>
            <InputLabel>Import Type</InputLabel>
            <Select
              value={importType}
              label="Import Type"
              onChange={(e) => setImportType(e.target.value)}
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                "& fieldset": { borderColor: "#333", borderWidth: "2px" },
              }}
            >
              <MenuItem value="json">📊 Previous Chat (JSON)</MenuItem>
              <MenuItem value="fhir">🏥 FHIR Patient Resource</MenuItem>
            </Select>
          </FormControl>

          <Box
            sx={{
              padding: "10px",
              border: "2px solid #ff9800",
              backgroundColor: "#fff3e0",
              color: "#000",
            }}
          >
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              <WarningAmberIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5 }}
              />
              Importing will replace your current{" "}
              {importType === "json" ? "conversation history" : "profile"}. Make
              sure to export first if you want to keep your data.
            </Typography>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept={importType === "json" ? ".json" : ".json"}
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <Button
            fullWidth
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: "2px solid #2196f3",
              color: "#2196f3",
              fontWeight: 700,
              "&:hover": {
                border: "2px solid #2196f3",
                backgroundColor: "rgba(33, 150, 243, 0.1)",
              },
            }}
          >
            Select File to Import
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

const HealthChatbot = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);

  // New component states
  const [showAudioLibrary, setShowAudioLibrary] = useState(false);
  const [showSupplementChecker, setShowSupplementChecker] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);

  // Phase 4 new states
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showBodyCompositionHistory, setShowBodyCompositionHistory] =
    useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [draftMessage, setDraftMessage] = useState("");
  const [bodyCompositionReadings, setBodyCompositionReadings] = useState([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("chat");
  const [trackerData, setTrackerData] = useState({
    log: null,
    food: [],
    activities: [],
    symptoms: [],
    goals: [],
  });
  const [selectedBodyZone, setSelectedBodyZone] = useState("");
  const [avatarFocus, setAvatarFocus] = useState(null);
  const [youtubeState, setYoutubeState] = useState({
    query: "",
    videos: [],
    loading: false,
    error: "",
  });

  // Accessibility settings
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    readingLevel: "standard",
    textSize: "medium",
    highContrast: false,
    screenReaderMode: false,
  });

  // Database and conversation management
  const { user } = useAuth();
  const supabase = createSupabaseClient();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);
  const disclaimerRef = useRef(null);

  // Load chat history and user profile on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from database first if user is logged in
        const loadedFromDb = await loadConversationFromDb();
        
        // Fallback to localStorage if DB load failed or user not logged in
        if (!loadedFromDb) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setMessages(parsed.slice(-MAX_HISTORY));
          }
        }

        const dbProfile = await loadProfileFromDb();
        const dbBodyCompositionReadings = await loadBodyCompositionReadings();
        setBodyCompositionReadings(dbBodyCompositionReadings);

        if (dbProfile) {
          setUserProfile(dbProfile);
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(dbProfile));
          setIsFirstVisit(false);
        } else {
          const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
          if (storedProfile) {
            setUserProfile(JSON.parse(storedProfile));
            setIsFirstVisit(false);
          } else {
            // First visit - show profile modal and help panel
            setTimeout(() => {
              setShowProfileModal(true);
              setShowHelpPanel(true);
            }, 1000);
          }
        }

        // Load accessibility settings
        const storedAccessibility = localStorage.getItem(
          ACCESSIBILITY_STORAGE_KEY,
        );
        if (storedAccessibility) {
          setAccessibilitySettings(JSON.parse(storedAccessibility));
        }

        // Load draft message if exists
        const storedDraft = localStorage.getItem("health_draft_message");
        if (storedDraft) {
          setInputValue(storedDraft);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [user]); // Re-run when user changes (login/logout)

  // Save accessibility settings
  useEffect(() => {
    localStorage.setItem(
      ACCESSIBILITY_STORAGE_KEY,
      JSON.stringify(accessibilitySettings),
    );
  }, [accessibilitySettings]);

  // Save draft message
  useEffect(() => {
    if (inputValue) {
      localStorage.setItem("health_draft_message", inputValue);
    } else {
      localStorage.removeItem("health_draft_message");
    }
  }, [inputValue]);

  // Apply accessibility settings to container
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;

      // Apply text size
      const fontSizeMap = {
        small: "0.875rem",
        medium: "1rem",
        large: "1.125rem",
        xlarge: "1.25rem",
      };
      container.style.fontSize = fontSizeMap[accessibilitySettings.textSize];

      // Apply high contrast
      if (accessibilitySettings.highContrast) {
        container.style.filter = "contrast(1.5)";
      } else {
        container.style.filter = "none";
      }
    }
  }, [accessibilitySettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector("textarea")?.focus();
      }

      // Escape to close modals
      if (e.key === "Escape") {
        setShowAccessibilityPanel(false);
        setShowHelpPanel(false);
        setShowPrivacyNotice(false);
        setShowInsights(false);
        setShowBodyCompositionHistory(false);
        setShowExportModal(false);
        setShowImportModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update analytics after each conversation
  useEffect(() => {
    if (messages.length > 0) {
      updateAnalytics();
    }
  }, [messages]);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Keep only last MAX_HISTORY messages
        const toSave = messages.slice(-MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // GSAP entrance animation on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, {
        duration: 0.6,
        opacity: 0,
        y: 40,
        ease: Power3.easeOut,
      });
    }
  }, []);

  // Disclaimer popup animation on mount
  useEffect(() => {
    // Show disclaimer after a brief delay
    const showTimer = setTimeout(() => {
      setShowDisclaimer(true);

      // Animate in with cracker blast effect
      if (disclaimerRef.current) {
        gsap.fromTo(
          disclaimerRef.current,
          {
            scale: 0,
            rotation: -180,
            opacity: 0,
          },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(2)",
          },
        );
      }
    }, 500);

    // Auto-hide after 5 seconds with blast effect
    const hideTimer = setTimeout(() => {
      if (disclaimerRef.current) {
        gsap.to(disclaimerRef.current, {
          scale: 0,
          rotation: 180,
          opacity: 0,
          duration: 0.4,
          ease: "back.in(2)",
          onComplete: () => setShowDisclaimer(false),
        });
      }
    }, 5500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const toggleDisclaimer = () => {
    if (showDisclaimer) {
      // Hide with animation
      if (disclaimerRef.current) {
        gsap.to(disclaimerRef.current, {
          scale: 0,
          rotation: 180,
          opacity: 0,
          duration: 0.4,
          ease: "back.in(2)",
          onComplete: () => setShowDisclaimer(false),
        });
      }
    } else {
      // Show with animation
      setShowDisclaimer(true);
      setTimeout(() => {
        if (disclaimerRef.current) {
          gsap.fromTo(
            disclaimerRef.current,
            {
              scale: 0,
              rotation: -180,
              opacity: 0,
            },
            {
              scale: 1,
              rotation: 0,
              opacity: 1,
              duration: 0.6,
              ease: "back.out(2)",
            },
          );
        }
      }, 10);
    }
  };

  const handleSaveProfile = async (profile) => {
    const profileWithCalculations = {
      ...profile,
      conditions: normalizeConditionList(profile.conditions),
      ...calculateBodyComposition(profile),
    };

    setProfileSaving(true);
    setProfileSaveError("");
    setUserProfile(profileWithCalculations);
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(profileWithCalculations),
    );
    setIsFirstVisit(false);

    try {
      // Sync to database if user is logged in
      if (user && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setProfileSaveError("Your login session could not be confirmed. Please sign in again and retry.");
          return false;
        }

        const profileResponse = await fetch("/api/health-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(profileWithCalculations),
        });

        if (!profileResponse.ok) {
          const errorBody = await profileResponse.json().catch(() => ({}));
          setProfileSaveError(
            `${errorBody.error || "Health profile was not saved to the database."} Your entries were kept locally in this browser.`,
          );
          return false;
        }

        if (
          hasBodyCompositionInput(profileWithCalculations) &&
          !isSameBodyCompositionReading(
            profileWithCalculations,
            bodyCompositionReadings[0],
          )
        ) {
          const readingResponse = await fetch("/api/health-body-composition", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(profileWithCalculations),
          });

          if (!readingResponse.ok) {
            const errorBody = await readingResponse.json().catch(() => ({}));
            console.warn(
              "Body composition history was not saved:",
              errorBody.error || readingResponse.statusText,
            );
            return true;
          }

          const readings = await loadBodyCompositionReadings();
          setBodyCompositionReadings(readings);
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving profile to database:", error);
      setProfileSaveError(
        `${error.message || "Failed to save health profile"} Your entries were kept locally in this browser.`,
      );
      return false;
    } finally {
      setProfileSaving(false);
    }
  };

  // Update analytics
  const updateAnalytics = () => {
    const conversationCount = messages.filter((m) => m.role === "user").length;

    // Extract topics
    const topics = [];
    const topicKeywords = {
      Nutrition: ["meal", "food", "diet", "eating", "recipe"],
      Exercise: ["exercise", "workout", "activity", "physical", "walk"],
      Medications: [
        "medication",
        "medicine",
        "drug",
        "prescription",
        "supplement",
      ],
      "Stress Management": [
        "stress",
        "anxiety",
        "meditation",
        "breathing",
        "relax",
      ],
      Sleep: ["sleep", "insomnia", "rest", "tired", "fatigue"],
      "Pain Management": ["pain", "ache", "hurt", "chronic pain"],
      Weight: ["weight", "lose weight", "obesity", "diet"],
    };

    messages
      .filter((m) => m.role === "user")
      .forEach((msg) => {
        const content = msg.content.toLowerCase();
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          if (keywords.some((kw) => content.includes(kw))) {
            topics.push(topic);
          }
        });
      });

    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {});

    // Count evidence levels
    const evidenceCounts = {
      strong: 0,
      moderate: 0,
      limited: 0,
      notRecommended: 0,
    };

    messages
      .filter((m) => m.role === "assistant")
      .forEach((msg) => {
        const content = msg.content || "";
        evidenceCounts.strong += (
          content.match(/strong evidence/gi) || []
        ).length;
        evidenceCounts.moderate += (
          content.match(/moderate evidence/gi) || []
        ).length;
        evidenceCounts.limited += (
          content.match(/limited evidence/gi) || []
        ).length;
        evidenceCounts.notRecommended += (
          content.match(/not recommended|insufficient evidence/gi) || []
        ).length;
      });

    const totalEvidence = Object.values(evidenceCounts).reduce(
      (a, b) => a + b,
      0,
    );

    // Count safety alerts
    const safetyAlerts = messages
      .filter((m) => m.role === "assistant")
      .reduce((count, msg) => {
        const content = msg.content || "";
        if (content.includes("🚨") || content.includes("EMERGENCY")) count++;
        return count;
      }, 0);

    const analytics = {
      conversationCount,
      topicCounts,
      evidenceCounts,
      totalEvidence,
      safetyAlerts,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
  };

  // Multi-format export handler
  const handleExport = (format, options) => {
    const date = new Date().toISOString().split("T")[0];
    let content = "";
    let filename = "";
    let mimeType = "";

    if (format === "markdown") {
      content = generateMarkdownExport(options);
      filename = `health-chat-${date}.md`;
      mimeType = "text/markdown";
    } else if (format === "json") {
      content = JSON.stringify(
        {
          exportDate: date,
          profile: options.includeProfile ? userProfile : null,
          messages: options.includeFullConversation
            ? messages
            : messages.filter((m) => m.role === "assistant"),
          metadata: {
            totalConversations: messages.filter((m) => m.role === "user")
              .length,
            exportVersion: "1.0",
          },
        },
        null,
        2,
      );
      filename = `health-chat-${date}.json`;
      mimeType = "application/json";
    } else if (format === "txt") {
      content = generatePlainTextExport(options);
      filename = `health-chat-${date}.txt`;
      mimeType = "text/plain";
    } else if (format === "fhir") {
      // Generate FHIR Bundle (Note: This would need the toFHIRBundle function from the API)
      const conversationSummary = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n\n");
      const fhirBundle = generateFHIRBundle(userProfile, conversationSummary);
      content = JSON.stringify(fhirBundle, null, 2);
      filename = `health-fhir-bundle-${date}.json`;
      mimeType = "application/fhir+json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownExport = (options) => {
    const date = new Date().toISOString().split("T")[0];
    let markdown = `# Health Chat Export - ${date}\n\n`;

    if (options.includeProfile && userProfile) {
      markdown += `## User Profile\n\n`;
      markdown += `- **Age**: ${userProfile.ageBand}\n`;
      if (userProfile.conditions.length > 0) {
        markdown += `- **Conditions**: ${userProfile.conditions.join(", ")}\n`;
      }
      if (userProfile.medications) {
        markdown += `- **Medications**: ${userProfile.medications}\n`;
      }
      if (userProfile.allergies) {
        markdown += `- **Allergies**: ${userProfile.allergies}\n`;
      }
      markdown += `- **Diet**: ${userProfile.dietaryPattern}\n`;
      markdown += `- **Cuisine**: ${userProfile.cuisinePreference}\n`;
      markdown += `- **Budget**: ${userProfile.budgetLevel}\n`;
      if (userProfile.goals.length > 0) {
        markdown += `- **Goals**: ${userProfile.goals.join(", ")}\n`;
      }
      if (hasBodyCompositionInput(userProfile)) {
        const body = calculateBodyComposition(userProfile);
        markdown += `\n### Body Composition\n\n`;
        markdown += `- **Measurement Date**: ${formatBodyDate(body.bodyCompositionMeasuredAt)}\n`;
        markdown += `- **Method**: ${body.bodyCompositionMethod || "Not set"}\n`;
        markdown += `- **Height**: ${formatBodyMetric(body.heightCm, " cm")}\n`;
        markdown += `- **Weight**: ${formatBodyMetric(body.weightKg, " kg")}\n`;
        markdown += `- **Body Fat**: ${formatBodyMetric(body.bodyFatPercent, "%")}\n`;
        markdown += `- **Muscle Mass**: ${formatBodyMetric(body.muscleMassKg, " kg")}\n`;
        markdown += `- **BMI**: ${formatBodyMetric(body.bmi)} (${body.bmiCategory || "Not calculated"})\n`;
        markdown += `- **Fat Mass**: ${formatBodyMetric(body.fatMassKg, " kg")}\n`;
        markdown += `- **Lean Mass**: ${formatBodyMetric(body.leanMassKg, " kg")}\n`;
        if (body.bodyCompositionNotes) {
          markdown += `- **Notes**: ${body.bodyCompositionNotes}\n`;
        }
      }
      markdown += `\n---\n\n`;
    }

    if (options.includeFullConversation) {
      markdown += `## Conversation\n\n`;
      messages.forEach((msg) => {
        if (msg.role === "user") {
          markdown += `### 👤 You:\n${msg.content}\n\n`;
        } else if (msg.role === "assistant") {
          markdown += `### 🤖 Health Coach:\n${msg.content}\n\n`;
        }
      });
    }

    markdown += `\n---\n\n*This is educational information to support your health decisions, not medical advice.*`;
    return markdown;
  };

  const generatePlainTextExport = (options) => {
    const date = new Date().toISOString().split("T")[0];
    let text = `HEALTH CHAT EXPORT - ${date}\n\n`;

    if (options.includeProfile && userProfile) {
      text += `USER PROFILE\n\n`;
      text += `Age: ${userProfile.ageBand}\n`;
      if (userProfile.conditions.length > 0) {
        text += `Conditions: ${userProfile.conditions.join(", ")}\n`;
      }
      if (userProfile.medications) {
        text += `Medications: ${userProfile.medications}\n`;
      }
      if (userProfile.allergies) {
        text += `Allergies: ${userProfile.allergies}\n`;
      }
      text += `Diet: ${userProfile.dietaryPattern}\n`;
      text += `Cuisine: ${userProfile.cuisinePreference}\n`;
      text += `Budget: ${userProfile.budgetLevel}\n`;
      if (userProfile.goals.length > 0) {
        text += `Goals: ${userProfile.goals.join(", ")}\n`;
      }
      if (hasBodyCompositionInput(userProfile)) {
        const body = calculateBodyComposition(userProfile);
        text += `\nBODY COMPOSITION\n`;
        text += `Measurement Date: ${formatBodyDate(body.bodyCompositionMeasuredAt)}\n`;
        text += `Method: ${body.bodyCompositionMethod || "Not set"}\n`;
        text += `Height: ${formatBodyMetric(body.heightCm, " cm")}\n`;
        text += `Weight: ${formatBodyMetric(body.weightKg, " kg")}\n`;
        text += `Body Fat: ${formatBodyMetric(body.bodyFatPercent, "%")}\n`;
        text += `Muscle Mass: ${formatBodyMetric(body.muscleMassKg, " kg")}\n`;
        text += `BMI: ${formatBodyMetric(body.bmi)} (${body.bmiCategory || "Not calculated"})\n`;
        text += `Fat Mass: ${formatBodyMetric(body.fatMassKg, " kg")}\n`;
        text += `Lean Mass: ${formatBodyMetric(body.leanMassKg, " kg")}\n`;
        if (body.bodyCompositionNotes) {
          text += `Notes: ${body.bodyCompositionNotes}\n`;
        }
      }
      text += `\n${"=".repeat(60)}\n\n`;
    }

    if (options.includeFullConversation) {
      text += `CONVERSATION\n\n`;
      messages.forEach((msg, idx) => {
        if (msg.role === "user") {
          text += `[YOU]:\n${msg.content}\n\n`;
        } else if (msg.role === "assistant") {
          text += `[HEALTH COACH]:\n${msg.content}\n\n`;
        }
        if (idx < messages.length - 1) {
          text += `${"-".repeat(60)}\n\n`;
        }
      });
    }

    text += `\n${"=".repeat(60)}\n`;
    text += `This is educational information to support your health decisions, not medical advice.`;
    return text;
  };

  const generateFHIRBundle = (profile, conversationSummary) => {
    // Simple FHIR Bundle generator (client-side version)
    const resources = [];

    // Patient resource
    if (profile) {
      resources.push({
        resourceType: "Patient",
        id: "user-" + Date.now(),
        extension: [
          {
            url: "http://health-chatbot.example.org/fhir/StructureDefinition/age-band",
            valueString: profile.ageBand,
          },
        ],
      });

      // Conditions
      if (profile.conditions && profile.conditions.length > 0) {
        profile.conditions
          .filter((c) => c !== "None")
          .forEach((condition, idx) => {
            resources.push({
              resourceType: "Condition",
              id: `condition-${idx}`,
              clinicalStatus: {
                coding: [
                  {
                    system:
                      "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    code: "active",
                  },
                ],
              },
              code: { text: condition },
              subject: { reference: "Patient/user-" + Date.now() },
            });
          });
      }

      // Goals
      if (profile.goals && profile.goals.length > 0) {
        profile.goals.forEach((goal, idx) => {
          resources.push({
            resourceType: "Goal",
            id: `goal-${idx}`,
            lifecycleStatus: "active",
            description: { text: goal },
            subject: { reference: "Patient/user-" + Date.now() },
          });
        });
      }
    }

    // CarePlan
    if (conversationSummary) {
      resources.push({
        resourceType: "CarePlan",
        id: "careplan-" + Date.now(),
        status: "active",
        intent: "plan",
        title: "Self-Management Care Plan",
        description: conversationSummary,
        subject: { reference: "Patient/user-" + Date.now() },
      });
    }

    return {
      resourceType: "Bundle",
      id: "bundle-" + Date.now(),
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: resources.map((resource) => ({
        fullUrl: `urn:uuid:${resource.resourceType}-${resource.id}`,
        resource: resource,
      })),
    };
  };

  // Import handler
  const handleImport = (data, type) => {
    try {
      if (type === "json") {
        // Import previous chat
        if (data.messages) {
          setMessages(data.messages);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.messages));
        }
        if (data.profile) {
          setUserProfile(data.profile);
          localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(data.profile),
          );
        }
        alert("Chat history imported successfully!");
      } else if (type === "fhir") {
        // Import FHIR Patient resource
        if (data.resourceType === "Patient" || data.resourceType === "Bundle") {
          const profile = extractProfileFromFHIR(data);
          if (profile) {
            setUserProfile(profile);
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            alert("Profile imported from FHIR successfully!");
          }
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Error importing data. Please check the file format.");
    }
  };

  const extractProfileFromFHIR = (fhirData) => {
    // Extract profile information from FHIR resource
    const profile = {
      ageBand: "",
      conditions: [],
      medications: "",
      allergies: "",
      dietaryPattern: "",
      cuisinePreference: "",
      budgetLevel: "",
      pregnancyStatus: "Not pregnant",
      goals: [],
    };

    if (fhirData.resourceType === "Bundle") {
      // Extract from bundle entries
      fhirData.entry?.forEach((entry) => {
        const resource = entry.resource;
        if (resource.resourceType === "Patient") {
          const ageBandExt = resource.extension?.find((e) =>
            e.url.includes("age-band"),
          );
          if (ageBandExt) profile.ageBand = ageBandExt.valueString;
        } else if (resource.resourceType === "Condition") {
          profile.conditions.push(resource.code?.text || "Unknown condition");
        } else if (resource.resourceType === "Goal") {
          profile.goals.push(resource.description?.text || "Unknown goal");
        }
      });
    } else if (fhirData.resourceType === "Patient") {
      const ageBandExt = fhirData.extension?.find((e) =>
        e.url.includes("age-band"),
      );
      if (ageBandExt) profile.ageBand = ageBandExt.valueString;
    }

    return profile;
  };

  const handleExportConversation = () => {
    setShowExportModal(true);
  };

  const handleStartNewConversation = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
    }
    setMessages([]);
    setActiveConversationId(null);
    setInputValue("");
    setDraftMessage("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("health_draft_message");
  };

  const handleStopGenerating = () => {
    abortControllerRef.current?.abort();
  };

  const handleClearChat = async () => {
    // Delete from database if there's an active conversation
    if (user && supabase && activeConversationId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`/api/health-conversations/${activeConversationId}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
            },
          });
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
      }
      setActiveConversationId(null);
    }

    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowClearDialog(false);
  };

  const handleQuickAction = (action) => {
    let prompt = "";
    if (
      !userProfile &&
      action !== "audio-library" &&
      action !== "supplement-check" &&
      action !== "progress-tracker" &&
      action !== "body-composition"
    ) {
      setShowProfileModal(true);
      return;
    }

    const diet = userProfile?.dietaryPattern || "healthy";
    const cuisine = userProfile?.cuisinePreference || "diverse";
    const conditions =
      userProfile?.conditions?.length > 0 &&
      !userProfile.conditions.includes("None")
        ? userProfile.conditions.join(", ")
        : "general wellness";

    switch (action) {
      case "meal-plan":
        prompt = `Create me a ${diet} ${cuisine} meal plan for ${conditions} that fits my profile`;
        setActiveWorkspaceTab("plans");
        break;
      case "supplement-check":
        setShowSupplementChecker(true);
        setActiveWorkspaceTab("settings");
        return;
      case "weekly-plan":
        prompt =
          "Create a comprehensive weekly self-care plan including meals, exercise, and stress management";
        setActiveWorkspaceTab("plans");
        break;
      case "clinician-summary":
        prompt =
          "Please generate a clinician handoff summary of our conversation that I can share with my doctor.";
        setActiveWorkspaceTab("chat");
        break;
      case "audio-library":
        setShowAudioLibrary(true);
        setActiveWorkspaceTab("settings");
        return;
      case "progress-tracker":
        setShowProgressTracker(true);
        setActiveWorkspaceTab("tracker");
        return;
      case "body-composition":
        setShowBodyCompositionHistory(true);
        setActiveWorkspaceTab("body");
        return;
      default:
        break;
    }

    if (prompt) {
      sendMessage(prompt);
    }
  };

  const buildUserContext = () => {
    if (!userProfile) return "";

    let context = "User Profile: ";
    const parts = [];

    if (userProfile.ageBand) parts.push(`Age ${userProfile.ageBand}`);
    if (
      userProfile.conditions.length > 0 &&
      !userProfile.conditions.includes("None")
    ) {
      parts.push(`Conditions: ${userProfile.conditions.join(", ")}`);
    }
    if (userProfile.medications)
      parts.push(`Medications: ${userProfile.medications}`);
    if (userProfile.allergies)
      parts.push(`Allergies: ${userProfile.allergies}`);
    if (userProfile.dietaryPattern)
      parts.push(`Diet: ${userProfile.dietaryPattern}`);
    if (userProfile.cuisinePreference)
      parts.push(`Cuisine: ${userProfile.cuisinePreference}`);
    if (userProfile.budgetLevel)
      parts.push(`Budget: ${userProfile.budgetLevel}`);
    if (
      userProfile.pregnancyStatus &&
      userProfile.pregnancyStatus !== "Not pregnant"
    ) {
      parts.push(`Status: ${userProfile.pregnancyStatus}`);
    }
    if (userProfile.goals.length > 0) {
      parts.push(`Goals: ${userProfile.goals.join(", ")}`);
    }
    if (hasBodyCompositionInput(userProfile)) {
      const body = calculateBodyComposition(userProfile);
      const bodyParts = [];
      if (body.heightCm) bodyParts.push(`height ${body.heightCm} cm`);
      if (body.weightKg) bodyParts.push(`weight ${body.weightKg} kg`);
      if (body.bodyFatPercent)
        bodyParts.push(`body fat ${body.bodyFatPercent}%`);
      if (body.muscleMassKg) bodyParts.push(`muscle mass ${body.muscleMassKg} kg`);
      if (body.bodyWaterPercent)
        bodyParts.push(`body water ${body.bodyWaterPercent}%`);
      if (body.boneMassKg) bodyParts.push(`bone mass ${body.boneMassKg} kg`);
      if (body.visceralFatRating)
        bodyParts.push(`visceral fat rating ${body.visceralFatRating}`);
      if (body.bmi) bodyParts.push(`BMI ${body.bmi} (${body.bmiCategory})`);
      if (body.fatMassKg) bodyParts.push(`estimated fat mass ${body.fatMassKg} kg`);
      if (body.leanMassKg)
        bodyParts.push(`estimated lean mass ${body.leanMassKg} kg`);
      if (body.bodyFatCategory)
        bodyParts.push(`body fat category ${body.bodyFatCategory}`);
      if (body.weightToMuscleContext)
        bodyParts.push(body.weightToMuscleContext);
      if (body.bodyCompositionMethod)
        bodyParts.push(`method ${body.bodyCompositionMethod}`);
      if (body.bodyCompositionMeasuredAt)
        bodyParts.push(`measured ${body.bodyCompositionMeasuredAt}`);

      parts.push(`Latest body composition: ${bodyParts.join("; ")}`);
    }

    const bodyTrend = buildBodyCompositionTrend(bodyCompositionReadings);
    if (bodyTrend) {
      const trendParts = [
        bodyTrend.weight ? `weight ${bodyTrend.weight}` : null,
        bodyTrend.bodyFat ? `body fat ${bodyTrend.bodyFat}` : null,
        bodyTrend.muscle ? `muscle mass ${bodyTrend.muscle}` : null,
        bodyTrend.latestDate ? `latest measurement ${bodyTrend.latestDate}` : null,
      ].filter(Boolean);
      if (trendParts.length > 0) {
        parts.push(`Body composition trend from latest two readings: ${trendParts.join("; ")}`);
      }
    }

    if (hasBodyCompositionInput(userProfile) || bodyCompositionReadings.length > 0) {
      parts.push(
        "Body composition rule: use these values only to personalize nutrition, activity, and progress guidance; do not diagnose disease from them; mention method/device limitations when interpreting estimates.",
      );
    }
    if (
      trackerData.food.length > 0 ||
      trackerData.activities.length > 0 ||
      trackerData.symptoms.length > 0 ||
      trackerData.goals.length > 0 ||
      trackerData.log
    ) {
      const trackerParts = [];
      if (trackerData.log?.mood) trackerParts.push(`mood ${trackerData.log.mood}`);
      if (trackerData.log?.sleep_hours)
        trackerParts.push(`sleep ${trackerData.log.sleep_hours} hours`);
      if (trackerData.log?.water_liters)
        trackerParts.push(`water ${trackerData.log.water_liters} liters`);
      if (trackerData.food.length > 0)
        trackerParts.push(
          `foods logged: ${trackerData.food
            .slice(0, 5)
            .map((entry) => `${entry.meal_type}: ${entry.food_name}`)
            .join("; ")}`,
        );
      if (trackerData.activities.length > 0)
        trackerParts.push(
          `activities: ${trackerData.activities
            .slice(0, 4)
            .map((entry) => `${entry.activity_type} ${entry.duration_minutes || ""} min`)
            .join("; ")}`,
        );
      if (trackerData.symptoms.length > 0)
        trackerParts.push(
          `symptoms: ${trackerData.symptoms
            .slice(0, 5)
            .map((entry) => `${entry.body_zone}: ${entry.symptom} severity ${entry.severity || "not set"}`)
            .join("; ")}`,
        );
      if (trackerData.goals.length > 0)
        trackerParts.push(
          `active goals: ${trackerData.goals
            .slice(0, 5)
            .map((entry) => `${entry.title} (${entry.target || "no target"})`)
            .join("; ")}`,
        );
      parts.push(`Daily tracker context: ${trackerParts.join(", ")}`);
      parts.push(
        "Tracker rule: use logged meals, workouts, goals, symptoms, and daily notes to personalize plans; do not diagnose from tracker data.",
      );
    }
    if (avatarFocus?.region && avatarFocus?.system) {
      const highlightLabels = (avatarFocus.highlights || [])
        .slice(0, 6)
        .map((item) => item.label)
        .join("; ");
      parts.push(
        `Selected 3D avatar focus: ${avatarFocus.systemLabel} system and ${avatarFocus.regionLabel} region.`,
      );
      if (highlightLabels) {
        parts.push(`Manual avatar highlights: ${highlightLabels}`);
      }
      parts.push(
        "Avatar rule: manual highlights are user-selected coaching focus markers, not diagnostic findings.",
      );
    }

    context += parts.join(", ");
    return context;
  };

  // Database helper functions
  const loadProfileFromDb = async () => {
    if (!user || !supabase) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch("/api/health-profile", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) return null;

      const dbProfile = await response.json();
      if (!dbProfile) return null;

      return {
        ageBand: dbProfile.age_band || "",
        conditions: dbProfile.conditions || [],
        medications: dbProfile.medications || "",
        allergies: dbProfile.allergies || "",
        dietaryPattern: dbProfile.dietary_pattern || "",
        cuisinePreference: dbProfile.cuisine_preference || "",
        budgetLevel: dbProfile.budget_level || "",
        pregnancyStatus: dbProfile.pregnancy_status || "Not pregnant",
        goals: dbProfile.goals || [],
        ...fromBodyCompositionDb(dbProfile),
      };
    } catch (error) {
      console.error("Error loading health profile:", error);
      return null;
    }
  };

  const loadBodyCompositionReadings = async () => {
    if (!user || !supabase) return [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch("/api/health-body-composition", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : data.readings || [];
    } catch (error) {
      console.error("Error loading body composition readings:", error);
      return [];
    }
  };

  const handleDeleteBodyCompositionReading = async (readingId) => {
    if (!readingId || !user || !supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/health-body-composition?id=${encodeURIComponent(readingId)}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) return;

      const [readings, profile] = await Promise.all([
        loadBodyCompositionReadings(),
        loadProfileFromDb(),
      ]);
      setBodyCompositionReadings(readings);
      if (profile) {
        setUserProfile(profile);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (error) {
      console.error("Error deleting body composition reading:", error);
    }
  };

  const handleUpdateBodyCompositionReading = async (readingId, values) => {
    if (!readingId || !user || !supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/health-body-composition?id=${encodeURIComponent(readingId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) return;

      const [readings, profile] = await Promise.all([
        loadBodyCompositionReadings(),
        loadProfileFromDb(),
      ]);
      setBodyCompositionReadings(readings);
      if (profile) {
        setUserProfile(profile);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (error) {
      console.error("Error updating body composition reading:", error);
    }
  };

  const saveConversationToDb = async (conversationId, messagesToSave) => {
    if (!user || !supabase) return null;

    try {
      setIsSaving(true);
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      let convId = conversationId;

      // If no conversation ID, create new conversation
      if (!convId) {
        const firstMessage = messagesToSave.find(m => m.role === "user")?.content;
        const title = firstMessage 
          ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? "..." : "")
          : "New Conversation";

        const response = await fetch("/api/health-conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ title }),
        });

        if (response.ok) {
          const data = await response.json();
          convId = data.id;
          setActiveConversationId(convId);
        }
      }

      // Update conversation with messages
      if (convId) {
        const updateResponse = await fetch(`/api/health-conversations/${convId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: messagesToSave,
            message_count: messagesToSave.length,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update conversation");
        }
      }

      return convId;
    } catch (error) {
      console.error("Error saving conversation:", error);
      // Silently fail - localStorage fallback already active
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const loadConversationFromDb = async () => {
    if (!user || !supabase) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const response = await fetch("/api/health-conversations?limit=1&offset=0", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.conversations && data.conversations.length > 0) {
          const latestConv = data.conversations[0];

          const detailResponse = await fetch(`/api/health-conversations/${latestConv.id}`, {
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
            },
          });

          if (!detailResponse.ok) return false;

          const detail = await detailResponse.json();
          setActiveConversationId(detail.id);
          setMessages(detail.messages || []);
          
          // Update usage stats
          if (data.usage) {
            setUsageStats(data.usage);
          }
          
          return true;
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
    return false;
  };

  const fetchRelevantContext = async (userMessage) => {
    if (!user || !supabase) return [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch("/api/health-knowledge/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: userMessage,
          limit: 3,
          threshold: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
    } catch (error) {
      console.error("Error fetching context:", error);
    }
    return [];
  };

  const embedConversationSummary = async (conversationId, messagesToEmbed) => {
    if (!user || !supabase || !conversationId || messagesToEmbed.length < 5) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create a summary of the conversation
      const userMessages = messagesToEmbed.filter(m => m.role === "user");
      const botMessages = messagesToEmbed.filter(m => m.role === "assistant");
      
      const summary = `Health conversation summary:\n` +
        `User questions: ${userMessages.slice(-3).map(m => m.content.substring(0, 100)).join("; ")}\n` +
        `Key recommendations: ${botMessages.slice(-2).map(m => m.content.substring(0, 150)).join("; ")}`;

      await fetch("/api/health-knowledge/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: summary,
          content_type: "conversation_summary",
          metadata: {
            conditions: userProfile?.conditions || [],
            date: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      console.error("Error embedding summary:", error);
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || inputValue.trim();
    if (!text || isStreaming) return;

    const userMessage = { role: "user", content: text };
    let accumulatedContent = "";

    const messagesToSend = [...messages, userMessage]
      .filter((message) => ["user", "assistant"].includes(message.role))
      .slice(-MAX_HISTORY);

    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsStreaming(true);

    // Add empty assistant message for streaming
    const botMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, botMessage]);

    // Fetch relevant knowledge base context for personalization
    const kbContext = user ? await fetchRelevantContext(text) : [];

    try {
      abortControllerRef.current = new AbortController();

      // Get auth token if user is logged in
      let authHeaders = { "Content-Type": "application/json" };
      if (user && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          authHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch("/api/health-chat", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ 
          messages: messagesToSend,
          knowledgeContext: kbContext,
          profileContext: userProfile ? buildUserContext() : "",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle usage limit exceeded (429)
        if (response.status === 429) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "⚠️ **Monthly Message Limit Reached**\n\nYou've used all your messages for this month. Upgrade to Pro or Premium for more messages.\n\n[Upgrade to continue chatting](/pricing)",
              isError: true,
              canRetry: false,
            };
            return updated;
          });
          return;
        }

        if (response.status === 401) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "Please sign in to use the health chatbot. Health conversations can include sensitive personal data, so this feature requires an authenticated account.",
              isError: true,
              canRetry: false,
            };
            return updated;
          });
          return;
        }

        const friendlyErrors = {
          "Authentication database is not configured":
            "The health chat database connection is not configured. Check `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, then restart the dev server.",
          "OpenAI API key is not configured":
            "The AI provider is not configured. Add `OPENAI_API_KEY` and restart the dev server.",
          "AI provider is not configured":
            "The health AI provider is not configured. Start Ollama and pull the configured models, or set `HEALTH_AI_PROVIDER=openai` with `OPENAI_API_KEY`, then restart the dev server.",
          "Database not configured":
            "The health database is not configured. Add Supabase environment variables and restart the dev server.",
        };
        const rawError = errorData.error || "Failed to get response";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              friendlyErrors[rawError] ||
              `I could not complete that request: ${rawError}`,
            isError: true,
            canRetry: false,
          };
          return updated;
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          streamBuffer += decoder.decode();
          break;
        }

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n");
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                // Update the last message with accumulated content
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulatedContent,
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      if (streamBuffer.trim().startsWith("data: ")) {
        const data = streamBuffer.trim().slice(6);
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulatedContent += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: accumulatedContent,
                };
                return updated;
              });
            }
          } catch (e) {
            // Ignore a final malformed stream fragment.
          }
        }
      }

      // Clear retry count on success
      setRetryCount(0);

      // Save conversation to database if user is logged in
      if (user) {
        const updatedMessages = [...messages, userMessage, { role: "assistant", content: accumulatedContent }];
        const savedConversationId = await saveConversationToDb(activeConversationId, updatedMessages);

        // Check for special content types to embed separately
        const hasMealPlan = accumulatedContent.includes("## MEAL PLAN");
        const hasClinicianSummary = accumulatedContent.includes("## CLINICIAN HANDOFF SUMMARY");

        if (savedConversationId) {
          // Embed meal plan
          if (hasMealPlan) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                await fetch("/api/health-knowledge/embed", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    conversation_id: savedConversationId,
                    content_type: "meal_plan",
                    content: accumulatedContent,
                    metadata: {
                      conditions: userProfile?.conditions || [],
                      date: new Date().toISOString(),
                    },
                  }),
                });
              }
            } catch (error) {
              console.error("Error embedding meal plan:", error);
            }
          }

          // Embed clinician summary
          if (hasClinicianSummary) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                await fetch("/api/health-knowledge/embed", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    conversation_id: savedConversationId,
                    content_type: "clinician_summary",
                    content: accumulatedContent,
                    metadata: {
                      conditions: userProfile?.conditions || [],
                      date: new Date().toISOString(),
                    },
                  }),
                });
              }
            } catch (error) {
              console.error("Error embedding clinician summary:", error);
            }
          }
        }

        // Auto-embed conversation summary every 10 messages
        if (updatedMessages.length % 10 === 0 && savedConversationId) {
          await embedConversationSummary(savedConversationId, updatedMessages);
        }

        if (usageStats) {
          setUsageStats({
            ...usageStats,
            count: Math.min((usageStats.count || 0) + 1, usageStats.limit),
          });
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulatedContent
              ? `${accumulatedContent}\n\n_Response stopped._`
              : "_Response stopped._",
            isStopped: true,
          };
          return updated;
        });
      } else {
        console.error("Chat error:", error);

        // Determine error message and retry logic
        let errorMessage = "I apologize, but I encountered an error. ";
        let canRetry = false;

        if (error.message.includes("Too many requests")) {
          errorMessage +=
            "The system is busy. Please wait a moment and try again.";
          canRetry = false;
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network")
        ) {
          errorMessage +=
            "Network connection lost. Your message has been saved. Please check your connection and try again.";
          canRetry = true;
          setDraftMessage(text); // Save for retry
        } else {
          errorMessage += "Please try again.";
          canRetry = true;
        }

        // Update the bot message with error and retry button
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: errorMessage,
            isError: true,
            canRetry,
          };
          return updated;
        });

        // Auto-retry logic (up to 2 times)
        if (canRetry && retryCount < 2) {
          setRetryCount(retryCount + 1);
          setTimeout(
            () => {
              setMessages((prev) => prev.slice(0, -2)); // Remove error messages
              sendMessage(text);
            },
            2000 + retryCount * 1000,
          ); // Exponential backoff
        }
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Auto-detect keywords and show relevant components
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.content) {
        const content = lastMessage.content.toLowerCase();

        // Check for audio library triggers
        const audioKeywords = [
          "breathwork",
          "breathing",
          "meditation",
          "mindful",
          "stress management",
          "sleep",
          "insomnia",
          "anxiety",
          "chronic pain",
          "cravings",
          "urge",
          "self-compassion",
          "setback",
          "guided practice",
        ];

        if (
          audioKeywords.some((keyword) => content.includes(keyword)) &&
          !showAudioLibrary
        ) {
          setTimeout(() => setShowAudioLibrary(true), 1000);
        }

        // Check for supplement checker triggers
        const supplementKeywords = [
          "supplement",
          "vitamin",
          "mineral",
          "fish oil",
          "omega-3",
          "probiotic",
        ];
        if (
          supplementKeywords.some((keyword) => content.includes(keyword)) &&
          !showSupplementChecker
        ) {
          setTimeout(() => setShowSupplementChecker(true), 1000);
        }

        // Check for progress tracker triggers
        const progressKeywords = [
          "weekly goals",
          "track",
          "behavior change plan",
          "habit",
          "streak",
        ];
        if (
          progressKeywords.some((keyword) => content.includes(keyword)) &&
          !showProgressTracker
        ) {
          setTimeout(() => setShowProgressTracker(true), 1000);
        }
      }
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const latestAssistantMessage =
    [...messages].reverse().find((message) => message.role === "assistant" && message.content)
      ?.content || "";

  const handleBodyZoneSelect = (zone) => {
    setSelectedBodyZone(zone);
    setActiveWorkspaceTab("tracker");
  };

  const fetchFocusVideos = async (focus) => {
    const query = [
      "evidence based health education",
      focus?.systemLabel,
      focus?.regionLabel,
      "exercise lifestyle warning signs",
    ]
      .filter(Boolean)
      .join(" ");

    setYoutubeState({ query, videos: [], loading: true, error: "" });
    try {
      const response = await fetch(
        `/api/health-youtube-search?q=${encodeURIComponent(query)}&limit=8`,
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not load YouTube videos");
      }
      setYoutubeState({
        query: data.query || query,
        videos: data.videos || [],
        loading: false,
        error: "",
      });
    } catch (error) {
      setYoutubeState({
        query,
        videos: [],
        loading: false,
        error: error.message || "Could not load YouTube videos",
      });
    }
  };

  const handleAskAvatarCoach = (focus) => {
    if (!focus?.region || !focus?.system) return;
    const profileSignals = (focus.profileSignals || [])
      .slice(0, 5)
      .map((signal) => `${signal.label}${signal.detail ? ` (${signal.detail})` : ""}`)
      .join("; ");
    const bodySummary = focus.bodySummary
      ? [
          focus.bodySummary.bmi
            ? `BMI ${focus.bodySummary.bmi} (${focus.bodySummary.bmiCategory || "uncategorized"})`
            : null,
          focus.bodySummary.bodyFatCategory
            ? `body fat ${focus.bodySummary.bodyFatCategory}`
            : null,
          focus.bodySummary.weightToMuscleContext || null,
        ]
          .filter(Boolean)
          .join("; ")
      : "";
    fetchFocusVideos(focus);
    setActiveWorkspaceTab("videos");
    sendMessage(
      `Using my profile, tracker data, body composition, and selected 3D health avatar focus (${focus.systemLabel} system / ${focus.regionLabel} region), explain why this focus may matter for coaching, evidence-based lifestyle actions, warning signs, questions to ask a clinician, and one safe next step. Profile-linked avatar signals: ${profileSignals || "none selected"}. Body summary: ${bodySummary || "not available"}. Do not diagnose from this avatar selection or body composition estimates.`,
    );
  };

  const handleAskPlan = (planType) => {
    setActiveWorkspaceTab("chat");
    const prompts = {
      meal:
        "Create a daily meal plan using my profile, body composition, symptoms, goals, and food log. Include evidence level, safety cautions, and practical South Asian-friendly options if relevant.",
      workout:
        "Create a workout plan using my body composition, symptoms, underlying conditions, and goals. Include safety limits and progression guidance.",
      goals:
        "Set 3 realistic daily health goals using my body composition, food log, symptoms, workouts, and underlying conditions.",
    };
    sendMessage(prompts[planType] || prompts.meal);
  };

  const renderWorkspacePanel = () => {
    if (activeWorkspaceTab === "tracker") {
      return (
        <DailyTrackerPanel
          selectedZone={selectedBodyZone}
          onTrackerChange={setTrackerData}
        />
      );
    }

    if (activeWorkspaceTab === "body") {
      return (
        <BodyCompositionHistoryPanel
          readings={bodyCompositionReadings}
          onDelete={handleDeleteBodyCompositionReading}
          onUpdate={handleUpdateBodyCompositionReading}
          onClose={() => setShowBodyCompositionHistory(false)}
        />
      );
    }

    if (activeWorkspaceTab === "plans") {
      return (
        <PlansPanel
          latestAssistantMessage={latestAssistantMessage}
          onAskPlan={handleAskPlan}
          onSaved={() => setActiveWorkspaceTab("tracker")}
        />
      );
    }

    if (activeWorkspaceTab === "videos") {
      return (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Box sx={{ display: "grid", gap: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Related Health Videos
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              Search: {youtubeState.query || "Select a body focus and ask the coach"}
            </Typography>
          </Box>
          {youtubeState.loading && (
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              Searching YouTube...
            </Typography>
          )}
          {youtubeState.error && (
            <Alert severity="warning">{youtubeState.error}</Alert>
          )}
          {!youtubeState.loading && !youtubeState.error && youtubeState.videos.length === 0 && (
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              No videos loaded yet.
            </Typography>
          )}
          {youtubeState.videos.map((video) => (
            <Box
              key={video.id}
              component="a"
              href={video.url}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: "grid",
                gridTemplateColumns: "96px 1fr",
                gap: 1,
                p: 1,
                border: "1px solid #333",
                color: "inherit",
                textDecoration: "none",
                "&:hover": { borderColor: "#00e676" },
              }}
            >
              <Box
                component="img"
                src={video.thumbnail}
                alt=""
                sx={{ width: 96, height: 54, objectFit: "cover", bgcolor: "#111" }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {video.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "#9ca3af", display: "block" }}>
                  {video.channel} {video.duration ? `| ${video.duration}` : ""}
                </Typography>
                <Typography variant="caption" sx={{ color: "#9ca3af", display: "block" }}>
                  {[video.published, video.viewCount].filter(Boolean).join(" | ")}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      );
    }

    if (activeWorkspaceTab === "uploads") {
      return <UserUploadsPanel />;
    }

    if (activeWorkspaceTab === "documents") {
      return <DocumentsPanel />;
    }

    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        {showSupplementChecker && (
          <SupplementChecker
            userMedications={userProfile?.medications || ""}
            onClose={() => setShowSupplementChecker(false)}
          />
        )}
        {showAudioLibrary && (
          <GuidedAudioLibrary onClose={() => setShowAudioLibrary(false)} />
        )}
        {showProgressTracker && (
          <ProgressTracker onClose={() => setShowProgressTracker(false)} />
        )}
        {showBodyCompositionHistory && (
          <BodyCompositionHistoryPanel
            readings={bodyCompositionReadings}
            onDelete={handleDeleteBodyCompositionReading}
            onUpdate={handleUpdateBodyCompositionReading}
            onClose={() => setShowBodyCompositionHistory(false)}
          />
        )}
        <AccessibilityPanel
          open={showAccessibilityPanel}
          onClose={() => setShowAccessibilityPanel(false)}
          settings={accessibilitySettings}
          onSettingsChange={setAccessibilitySettings}
        />
      </Box>
    );
  };

  return (
    <>
      <PersonalizationIntakeModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
        initialProfile={userProfile}
        isSaving={profileSaving}
        saveError={profileSaveError}
      />

      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Clear Chat History?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all messages in this conversation. This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancel</Button>
          <Button onClick={handleClearChat} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showChatSettings}
        onClose={() => setShowChatSettings(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Health Coach Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 3, pt: 1 }}>
            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                Conversation
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button startIcon={<AddIcon />} onClick={handleStartNewConversation}>
                  New conversation
                </Button>
                <Button
                  startIcon={<HistoryIcon />}
                  onClick={() => {
                    setShowHistoryPanel(true);
                    setShowChatSettings(false);
                  }}
                  disabled={!user}
                >
                  History
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    handleExportConversation();
                    setShowChatSettings(false);
                  }}
                  disabled={messages.length === 0}
                >
                  Export
                </Button>
                <Button
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    setShowImportModal(true);
                    setShowChatSettings(false);
                  }}
                >
                  Import
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => {
                    setShowClearDialog(true);
                    setShowChatSettings(false);
                  }}
                  disabled={messages.length === 0}
                >
                  Clear
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                Health Tools
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  startIcon={<RestaurantIcon />}
                  onClick={() => {
                    handleQuickAction("meal-plan");
                    setShowChatSettings(false);
                  }}
                  disabled={isStreaming}
                >
                  Meal plan
                </Button>
                <Button
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => {
                    handleQuickAction("weekly-plan");
                    setShowChatSettings(false);
                  }}
                  disabled={isStreaming}
                >
                  Weekly plan
                </Button>
                <Button
                  startIcon={<LocalHospitalIcon />}
                  onClick={() => {
                    handleQuickAction("clinician-summary");
                    setShowChatSettings(false);
                  }}
                  disabled={isStreaming || messages.length === 0}
                >
                  Doctor summary
                </Button>
                <Button
                  startIcon={<MedicationIcon />}
                  onClick={() => {
                    handleQuickAction("supplement-check");
                    setShowChatSettings(false);
                  }}
                >
                  Supplements
                </Button>
                <Button
                  startIcon={<SpaIcon />}
                  onClick={() => {
                    handleQuickAction("audio-library");
                    setShowChatSettings(false);
                  }}
                >
                  Audio scripts
                </Button>
                <Button
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => {
                    handleQuickAction("progress-tracker");
                    setShowChatSettings(false);
                  }}
                >
                  Progress
                </Button>
                <Button
                  startIcon={<BarChartIcon />}
                  onClick={() => {
                    handleQuickAction("body-composition");
                    setShowChatSettings(false);
                  }}
                >
                  Body composition
                </Button>
                <Button
                  startIcon={<UploadIcon />}
                  onClick={() => {
                    setActiveWorkspaceTab("uploads");
                    setShowChatSettings(false);
                  }}
                >
                  Upload files
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                Preferences
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setProfileSaveError("");
                    setShowProfileModal(true);
                    setShowChatSettings(false);
                  }}
                >
                  Quick profile edit
                </Button>
                <Button
                  startIcon={<EditIcon />}
                  href="/dashboard/health/profile"
                >
                  Profile page
                </Button>
                <Button
                  startIcon={<SettingsAccessibilityIcon />}
                  onClick={() => {
                    setShowAccessibilityPanel(true);
                    setShowChatSettings(false);
                  }}
                >
                  Accessibility
                </Button>
                <Button
                  startIcon={<BarChartIcon />}
                  onClick={() => {
                    setShowInsights(true);
                    setShowChatSettings(false);
                  }}
                  disabled={messages.length === 0}
                >
                  Insights
                </Button>
                <Button
                  startIcon={<HelpOutlineIcon />}
                  onClick={() => {
                    setShowHelpPanel(true);
                    setShowChatSettings(false);
                  }}
                >
                  Help
                </Button>
                <Button
                  startIcon={<PrivacyTipIcon />}
                  onClick={() => {
                    setShowPrivacyNotice(true);
                    setShowChatSettings(false);
                  }}
                >
                  Privacy
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChatSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Phase 4 New Modals */}
      <AccessibilityPanel
        open={showAccessibilityPanel}
        onClose={() => setShowAccessibilityPanel(false)}
        settings={accessibilitySettings}
        onSettingsChange={setAccessibilitySettings}
      />

      <HelpPanel open={showHelpPanel} onClose={() => setShowHelpPanel(false)} />

      <PrivacyNotice
        open={showPrivacyNotice}
        onClose={() => setShowPrivacyNotice(false)}
      />

      <HealthInsights
        open={showInsights}
        onClose={() => setShowInsights(false)}
        messages={messages}
        userProfile={userProfile}
      />

      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        messages={messages}
        userProfile={userProfile}
        onExport={handleExport}
      />

      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <Box ref={containerRef} className={styles.chatContainer}>
        {/* Header Actions */}
        <Box className={styles.disclaimerIconContainer}>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <IconButton
              onClick={handleStartNewConversation}
              className={styles.actionButton}
              title="New Conversation"
              aria-label="Start a new conversation"
              sx={{
                color: theme.palette.mode === "dark" ? "#4caf50" : "#2e7d32",
              }}
            >
              <AddIcon />
            </IconButton>

            <Button
              onClick={() => setShowHistoryPanel(true)}
              startIcon={<HistoryIcon />}
              size="small"
              variant="outlined"
              sx={{
                border: "2px solid #333",
                color: "#dbeafe",
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Chats
            </Button>

            <IconButton
              onClick={() => {
                setProfileSaveError("");
                setShowProfileModal(true);
              }}
              className={styles.actionButton}
              title="Edit Profile"
              aria-label="Edit your health profile"
              sx={{
                color: theme.palette.mode === "dark" ? "#00e676" : "#00c853",
              }}
            >
              <EditIcon />
            </IconButton>

            <IconButton
              onClick={() => setShowChatSettings(true)}
              className={styles.actionButton}
              title="Settings"
              aria-label="Open health coach settings"
              sx={{
                color: theme.palette.mode === "dark" ? "#90caf9" : "#1565c0",
              }}
            >
              <SettingsIcon />
            </IconButton>

            <IconButton
              onClick={toggleDisclaimer}
              className={styles.actionButton}
              title="Medical disclaimer"
              aria-label="Show medical disclaimer"
              sx={{
                color: theme.palette.mode === "dark" ? "#ffb74d" : "#f57c00",
              }}
            >
              <WarningAmberIcon />
            </IconButton>
          </Box>

          {showDisclaimer && (
            <Box
              ref={disclaimerRef}
              className={styles.disclaimerTooltip}
              role="alert"
              aria-live="polite"
            >
              <WarningAmberIcon />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Educational information only. Not medical advice. Safety-first,
                evidence-based guidance. Always consult your healthcare provider
                before making changes.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Chat Header */}
        <Box className={styles.chatHeader}>
          <Typography variant="h1">Evidence-Based Health Coach</Typography>
        </Box>

        <Box className={styles.workspaceTabs}>
          {HEALTH_WORKSPACE_TABS.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveWorkspaceTab(tab.id)}
              className={
                activeWorkspaceTab === tab.id
                  ? styles.workspaceTabActive
                  : styles.workspaceTab
              }
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        {/* Messages List */}
        <Box className={styles.messageList}>
          {messages.length === 0 ? (
            <Box className={styles.emptyState}>
              <SpaIcon />
              <Typography variant="h3">
                Welcome to Evidence-Based Health Coach
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {isFirstVisit
                  ? "Get started by setting up your health profile for personalized, evidence-based guidance on lifestyle medicine, chronic disease management, and nutrition."
                  : "Ask me about lifestyle medicine, chronic disease management, nutrition, and evidence-based health strategies. I provide safety-first guidance with clear evidence levels for every recommendation."}
              </Typography>

              {isFirstVisit && (
                <Box
                  sx={{
                    mb: 2,
                    padding: "15px",
                    border: "2px solid #2196f3",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    <InfoIcon
                      sx={{
                        fontSize: "1rem",
                        verticalAlign: "middle",
                        mr: 0.5,
                      }}
                    />
                    Quick Start Tips:
                  </Typography>
                  <Box
                    component="ul"
                    sx={{
                      pl: 3,
                      mt: 1,
                      fontSize: "0.875rem",
                      "& li": { mb: 0.5 },
                    }}
                  >
                    <li>
                      Set up your profile by clicking the{" "}
                      <EditIcon
                        sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                      />{" "}
                      button above
                    </li>
                    <li>
                      Click{" "}
                      <HelpOutlineIcon
                        sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                      />{" "}
                      to learn how to use this chatbot effectively
                    </li>
                    <li>
                      Use the{" "}
                      <SettingsAccessibilityIcon
                        sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                      />{" "}
                      accessibility panel to adjust text size and contrast
                    </li>
                    <li>
                      All recommendations include evidence levels (Strong,
                      Moderate, Limited, Not recommended)
                    </li>
                  </Box>
                </Box>
              )}

              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                Try asking:
              </Typography>
              <Box className={styles.suggestionChips}>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <Chip
                    key={idx}
                    label={prompt}
                    onClick={() => handleSuggestionClick(prompt)}
                    className={styles.chip}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            messages
              .filter((m) => m.role !== "system")
              .map((msg, idx) => (
                <Box
                  key={idx}
                  className={`${styles.messageBubble} ${
                    msg.role === "user" ? styles.userBubble : styles.botBubble
                  }`}
                >
                  {msg.role === "assistant" && (
                    <Box className={`${styles.avatar} ${styles.botAvatar}`}>
                      <SmartToyIcon fontSize="small" />
                    </Box>
                  )}
                  <Box
                    className={`${styles.messageContent} ${
                      msg.role === "user"
                        ? styles.userContent
                        : styles.botContent
                    }`}
                  >
                    {msg.content ? (
                      msg.role === "assistant" ? (
                        <FormattedMessage content={msg.content} />
                      ) : (
                        msg.content
                      )
                    ) : (
                      <Box className={styles.typingIndicator}>
                        <Box className={styles.typingDot} />
                        <Box className={styles.typingDot} />
                        <Box className={styles.typingDot} />
                      </Box>
                    )}
                  </Box>
                  {msg.role === "user" && (
                    <Box className={`${styles.avatar} ${styles.userAvatar}`}>
                      <PersonIcon fontSize="small" />
                    </Box>
                  )}
                </Box>
              ))
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Box className={styles.workspaceSidePanel}>
          <BodyDashboardPanel
            userProfile={userProfile}
            bodyCompositionReadings={bodyCompositionReadings}
            trackerData={trackerData}
            onZoneSelect={handleBodyZoneSelect}
            onAskCoach={handleAskAvatarCoach}
            onFocusChange={setAvatarFocus}
          />
          <Box className={styles.workspaceToolPanel}>
            {renderWorkspacePanel()}
          </Box>
        </Box>

        {/* Usage Stats Display */}
        {user && usageStats && (
          <Box
            sx={{
              gridColumn: 1,
              px: 2,
              py: 1,
              borderTop: "2px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: theme.palette.mode === "dark" ? "#0d0d0d" : "#f5f5f5",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Monthly Usage: <strong>{usageStats.count} / {usageStats.limit === 999999 ? "∞" : usageStats.limit}</strong> messages
            </Typography>
            <Chip
              label={usageStats.tier.toUpperCase()}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.7rem",
                bgcolor: usageStats.tier === "premium" ? "#4caf50" : usageStats.tier === "pro" ? "#2196f3" : "#9e9e9e",
                color: "#fff",
              }}
            />
          </Box>
        )}

        {/* Input Bar */}
        <Box
          className={styles.inputBar}
          role="form"
          aria-label="Message input form"
        >
          <TextField
            className={styles.inputField}
            multiline
            maxRows={4}
            placeholder="Ask about evidence-based health strategies, chronic disease management, nutrition..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isStreaming}
            variant="outlined"
            aria-label="Type your health question here"
            aria-describedby="input-help-text"
            inputProps={{
              "aria-label": "Health question input",
              "aria-required": "false",
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
                "& fieldset": {
                  borderColor: "#333",
                  borderWidth: "2px",
                },
                "&:hover fieldset": {
                  borderColor: "#00e676",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#00e676",
                },
              },
            }}
          />
          <Typography
            id="input-help-text"
            variant="caption"
            sx={{
              position: "absolute",
              left: "-9999px",
              ...(accessibilitySettings.screenReaderMode && {
                position: "static",
                left: 0,
                pl: 1,
              }),
            }}
          >
            Press Enter to send message, Shift+Enter for new line
          </Typography>
          {isStreaming ? (
            <IconButton
              className={styles.stopButton}
              onClick={handleStopGenerating}
              aria-label="Stop generating"
              title="Stop generating"
            >
              <StopIcon />
            </IconButton>
          ) : (
            <IconButton
              className={styles.sendButton}
              onClick={() => sendMessage()}
              disabled={!inputValue.trim()}
              aria-label="Send message"
              title="Send message"
            >
              <SendIcon />
            </IconButton>
          )}
        </Box>

        {/* Screen reader live region for streaming messages */}
        {accessibilitySettings.screenReaderMode && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="false"
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            {isStreaming && "Generating response..."}
            {messages.length > 0 &&
              messages[messages.length - 1].role === "assistant" &&
              !isStreaming &&
              "Response complete"}
          </div>
        )}

        {/* Conversation History Sidebar */}
        <ConversationHistory
          open={showHistoryPanel}
          onClose={() => setShowHistoryPanel(false)}
          activeConversationId={activeConversationId}
          user={user}
          onSelect={async (id) => {
            try {
              if (!supabase) return;
              
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const response = await fetch(`/api/health-conversations/${id}`, {
                headers: {
                  "Authorization": `Bearer ${session.access_token}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
                setActiveConversationId(id);
                setShowHistoryPanel(false);
              }
            } catch (error) {
              console.error("Error loading conversation:", error);
            }
          }}
        />
      </Box>
    </>
  );
};

export default HealthChatbot;
