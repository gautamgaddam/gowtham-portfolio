import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "../../../lib/auth-context";
import { createSupabaseClient } from "../../../lib/supabase";
import {
  BODY_COMPOSITION_METHODS,
  calculateBodyComposition,
  fromBodyCompositionDb,
} from "../../../lib/body-composition";

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

const GOALS = [
  "Manage condition",
  "Lose weight",
  "Improve energy",
  "Better sleep",
  "Reduce stress",
  "Improve diet",
  "Increase activity",
];

const EMPTY_PROFILE = {
  ageBand: "",
  conditions: [],
  medications: "",
  allergies: "",
  dietaryPattern: "",
  cuisinePreference: "",
  budgetLevel: "",
  pregnancyStatus: "Not pregnant",
  goals: [],
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

function normalizeConditionList(conditions = []) {
  const cleaned = (Array.isArray(conditions) ? conditions : [])
    .map((condition) => String(condition || "").trim())
    .filter(Boolean);
  if (cleaned.includes("None")) return ["None"];
  return Array.from(new Set(cleaned));
}

function profileFromDb(row) {
  if (!row) return EMPTY_PROFILE;
  return {
    ...EMPTY_PROFILE,
    ageBand: row.age_band || "",
    conditions: normalizeConditionList(row.conditions || []),
    medications: row.medications || "",
    allergies: row.allergies || "",
    dietaryPattern: row.dietary_pattern || "",
    cuisinePreference: row.cuisine_preference || "",
    budgetLevel: row.budget_level || "",
    pregnancyStatus: row.pregnancy_status || "Not pregnant",
    goals: row.goals || [],
    ...fromBodyCompositionDb(row),
  };
}

function readingFromDb(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    ...fromBodyCompositionDb(row),
  };
}

function HealthProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createSupabaseClient();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [readings, setReadings] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const calculated = useMemo(() => calculateBodyComposition(profile), [profile]);

  const authedFetch = async (url, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not signed in");

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  };

  const load = async () => {
    if (!user || !supabase) return;
    setPageLoading(true);
    setError("");
    try {
      const [profileResponse, readingsResponse] = await Promise.all([
        authedFetch("/api/health-profile"),
        authedFetch("/api/health-body-composition"),
      ]);

      if (profileResponse.ok) {
        setProfile(profileFromDb(await profileResponse.json()));
      }
      if (readingsResponse.ok) {
        const rows = await readingsResponse.json();
        setReadings((rows || []).map(readingFromDb));
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load health profile.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) load();
  }, [loading, user]);

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await authedFetch("/api/health-profile", {
        method: "POST",
        body: JSON.stringify({
          ...profile,
          conditions: normalizeConditionList(profile.conditions),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Failed to save profile.");

      setProfile(profileFromDb(body));
      setStatus("Health profile saved.");
    } catch (saveError) {
      setError(saveError.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveReading = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await authedFetch("/api/health-body-composition", {
        method: "POST",
        body: JSON.stringify(profile),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Failed to save reading.");
      setStatus("Body composition reading saved.");
      await load();
    } catch (saveError) {
      setError(saveError.message || "Failed to save reading.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await authedFetch("/api/health-profile", {
        method: "DELETE",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Failed to delete profile.");
      setProfile(EMPTY_PROFILE);
      setStatus("Health profile deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete profile.");
    } finally {
      setSaving(false);
    }
  };

  const deleteReading = async (id) => {
    setError("");
    setStatus("");
    try {
      const response = await authedFetch(`/api/health-body-composition?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Failed to delete reading.");
      setStatus("Body composition reading deleted.");
      await load();
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete reading.");
    }
  };

  const saveProfileReport = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const report = [
        "Detailed user health profile report",
        `Generated: ${new Date().toISOString()}`,
        `Age band: ${profile.ageBand || "not set"}`,
        `Conditions: ${profile.conditions.length ? profile.conditions.join(", ") : "none listed"}`,
        `Medications: ${profile.medications || "not set"}`,
        `Allergies: ${profile.allergies || "not set"}`,
        `Dietary pattern: ${profile.dietaryPattern || "not set"}`,
        `Cuisine preference: ${profile.cuisinePreference || "not set"}`,
        `Budget level: ${profile.budgetLevel || "not set"}`,
        `Pregnancy status: ${profile.pregnancyStatus || "not set"}`,
        `Goals: ${profile.goals.length ? profile.goals.join(", ") : "none listed"}`,
        `Height: ${calculated.heightCm || "not set"} cm`,
        `Weight: ${calculated.weightKg || "not set"} kg`,
        `Body fat: ${calculated.bodyFatPercent || "not set"}%`,
        `Muscle mass: ${calculated.muscleMassKg || "not set"} kg`,
        `BMI: ${calculated.bmi || "not available"} (${calculated.bmiCategory || "not categorized"})`,
        `Fat mass: ${calculated.fatMassKg || "not available"} kg`,
        `Lean mass: ${calculated.leanMassKg || "not available"} kg`,
        `Body composition method: ${calculated.bodyCompositionMethod || "not set"}`,
        `Body composition notes: ${calculated.bodyCompositionNotes || "not set"}`,
        `Saved body readings: ${readings.length}`,
      ].join("\n");

      const response = await authedFetch("/api/health-knowledge/embed", {
        method: "POST",
        body: JSON.stringify({
          content: report,
          content_type: "progress_report",
          metadata: {
            source: "profile_page",
            report_type: "profile_snapshot",
            created_at: new Date().toISOString(),
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Failed to save profile report.");
      setStatus("Detailed profile report saved to your health knowledge base.");
    } catch (reportError) {
      setError(reportError.message || "Failed to save profile report.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0d0d0d", color: "#e2e8f0", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 900 }}>
              Health Profile
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Configure the profile, body composition, and health context used by the coach.
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/dashboard/health")}
            variant="outlined"
          >
            Back to coach
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.35fr 0.65fr" }, gap: 3 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ border: "2px solid #000", bgcolor: "#151515", p: 2, display: "grid", gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Medical Context
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Age Band</InputLabel>
                <Select
                  value={profile.ageBand}
                  label="Age Band"
                  onChange={(event) => setProfile({ ...profile, ageBand: event.target.value })}
                >
                  {["18-30", "31-45", "46-60", "61-75", "76+"].map((value) => (
                    <MenuItem key={value} value={value}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Autocomplete
                multiple
                freeSolo
                options={CONDITIONS}
                value={profile.conditions}
                onChange={(_event, value) =>
                  setProfile({ ...profile, conditions: normalizeConditionList(value) })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Diagnosed Conditions" />
                )}
              />
              <TextField
                label="Current Medications"
                multiline
                rows={2}
                value={profile.medications}
                onChange={(event) => setProfile({ ...profile, medications: event.target.value })}
              />
              <TextField
                label="Allergies / Intolerances"
                multiline
                rows={2}
                value={profile.allergies}
                onChange={(event) => setProfile({ ...profile, allergies: event.target.value })}
              />
            </Box>

            <Box sx={{ border: "2px solid #000", bgcolor: "#151515", p: 2, display: "grid", gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Lifestyle Preferences
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Dietary Pattern</InputLabel>
                  <Select
                    value={profile.dietaryPattern}
                    label="Dietary Pattern"
                    onChange={(event) => setProfile({ ...profile, dietaryPattern: event.target.value })}
                  >
                    {["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Halal", "Kosher", "Other"].map((value) => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Cuisine Preference</InputLabel>
                  <Select
                    value={profile.cuisinePreference}
                    label="Cuisine Preference"
                    onChange={(event) => setProfile({ ...profile, cuisinePreference: event.target.value })}
                  >
                    {["American", "Mediterranean", "South Asian", "East Asian", "Middle Eastern", "African", "Latin American", "Other"].map((value) => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Budget Level</InputLabel>
                  <Select
                    value={profile.budgetLevel}
                    label="Budget Level"
                    onChange={(event) => setProfile({ ...profile, budgetLevel: event.target.value })}
                  >
                    {["Low", "Medium", "High"].map((value) => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Pregnancy Status</InputLabel>
                  <Select
                    value={profile.pregnancyStatus}
                    label="Pregnancy Status"
                    onChange={(event) => setProfile({ ...profile, pregnancyStatus: event.target.value })}
                  >
                    {["Not pregnant", "Pregnant", "Breastfeeding", "Trying to conceive", "Prefer not to say"].map((value) => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Autocomplete
                multiple
                options={GOALS}
                value={profile.goals}
                onChange={(_event, value) => setProfile({ ...profile, goals: value })}
                renderInput={(params) => <TextField {...params} label="Health Goals" />}
              />
            </Box>

            <Box sx={{ border: "2px solid #000", bgcolor: "#151515", p: 2, display: "grid", gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Body Composition
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                {[
                  ["heightCm", "Height cm"],
                  ["weightKg", "Weight kg"],
                  ["bodyFatPercent", "Body fat %"],
                  ["muscleMassKg", "Muscle mass kg"],
                  ["bodyWaterPercent", "Body water %"],
                  ["boneMassKg", "Bone mass kg"],
                  ["visceralFatRating", "Visceral fat rating"],
                ].map(([key, label]) => (
                  <TextField
                    key={key}
                    type="number"
                    label={label}
                    value={profile[key]}
                    onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
                  />
                ))}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Measurement Method</InputLabel>
                  <Select
                    value={profile.bodyCompositionMethod}
                    label="Measurement Method"
                    onChange={(event) => setProfile({ ...profile, bodyCompositionMethod: event.target.value })}
                  >
                    {BODY_COMPOSITION_METHODS.map((value) => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="date"
                  label="Measured At"
                  value={profile.bodyCompositionMeasuredAt || ""}
                  onChange={(event) => setProfile({ ...profile, bodyCompositionMeasuredAt: event.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <TextField
                label="Body composition notes"
                multiline
                rows={2}
                value={profile.bodyCompositionNotes}
                onChange={(event) => setProfile({ ...profile, bodyCompositionNotes: event.target.value })}
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`BMI ${calculated.bmi || "n/a"}`} />
                <Chip label={`Fat mass ${calculated.fatMassKg || "n/a"} kg`} />
                <Chip label={`Lean mass ${calculated.leanMassKg || "n/a"} kg`} />
                {calculated.bodyFatCategory && <Chip label={calculated.bodyFatCategory} />}
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={saveProfile}
                disabled={saving}
              >
                Save profile
              </Button>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={saveReading}
                disabled={saving}
              >
                Save body reading
              </Button>
              <Button
                startIcon={<SaveIcon />}
                variant="outlined"
                onClick={saveProfileReport}
                disabled={saving}
              >
                Save report to knowledge base
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                color="error"
                onClick={deleteProfile}
                disabled={saving}
              >
                Delete profile
              </Button>
            </Box>
          </Box>

          <Box sx={{ border: "2px solid #000", bgcolor: "#151515", p: 2, alignSelf: "start" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Reading History
            </Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {readings.length === 0 && (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  No body composition readings saved yet.
                </Typography>
              )}
              {readings.map((reading) => (
                <Box
                  key={reading.id}
                  sx={{
                    border: "1px solid #333",
                    p: 1.5,
                    display: "grid",
                    gap: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    {reading.bodyCompositionMeasuredAt || new Date(reading.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Weight {reading.weightKg || "n/a"} kg | Body fat {reading.bodyFatPercent || "n/a"}% | Muscle {reading.muscleMassKg || "n/a"} kg
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => deleteReading(reading.id)}
                  >
                    Delete reading
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

HealthProfilePage.hideChrome = true;

export default HealthProfilePage;
