import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SaveIcon from "@mui/icons-material/Save";
import * as THREE from "three";
import { createSupabaseClient } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import { calculateBodyComposition } from "../lib/body-composition";

const ADMIN_EMAIL = "gautammaddyson@gmail.com";
const BODY_ZONES = ["head", "chest", "abdomen", "arms", "legs", "back"];

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function metric(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "Not set";
  return `${value}${suffix}`;
}

function useAuthedFetch() {
  const supabase = createSupabaseClient();

  return async (url, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not signed in");

    return fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  };
}

export function BodyDashboardPanel({
  userProfile,
  bodyCompositionReadings,
  trackerData,
  onZoneSelect,
}) {
  const canvasRef = useRef(null);
  const selectedRef = useRef(null);
  const symptoms = trackerData?.symptoms || [];
  const body = calculateBodyComposition(userProfile || {});
  const zoneCounts = useMemo(
    () =>
      symptoms.reduce((acc, entry) => {
        acc[entry.body_zone] = (acc[entry.body_zone] || 0) + 1;
        return acc;
      }, {}),
    [symptoms],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.2, 7);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.PointLight(0x7dd3fc, 2, 20);
    light.position.set(4, 5, 6);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const material = new THREE.MeshStandardMaterial({
      color: 0x1e88e5,
      roughness: 0.42,
      metalness: 0.15,
    });
    const hotMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5252,
      roughness: 0.4,
      metalness: 0.1,
    });

    const addPart = (name, geometry, position, scale = [1, 1, 1]) => {
      const mesh = new THREE.Mesh(geometry, zoneCounts[name] ? hotMaterial : material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      scene.add(mesh);
      return mesh;
    };

    addPart("head", new THREE.SphereGeometry(0.45, 32, 32), [0, 2.65, 0]);
    addPart("chest", new THREE.CapsuleGeometry(0.62, 1.1, 10, 24), [0, 1.55, 0], [1, 1, 0.9]);
    addPart("abdomen", new THREE.CapsuleGeometry(0.55, 0.9, 10, 24), [0, 0.55, 0], [1, 1, 0.9]);
    addPart("arms", new THREE.CapsuleGeometry(0.18, 1.6, 8, 16), [-0.95, 1.2, 0], [1, 1, 1]);
    addPart("arms", new THREE.CapsuleGeometry(0.18, 1.6, 8, 16), [0.95, 1.2, 0], [1, 1, 1]);
    addPart("legs", new THREE.CapsuleGeometry(0.23, 1.75, 8, 16), [-0.32, -1.15, 0]);
    addPart("legs", new THREE.CapsuleGeometry(0.23, 1.75, 8, 16), [0.32, -1.15, 0]);
    addPart("back", new THREE.TorusGeometry(0.8, 0.04, 12, 60), [0, 1.1, -0.18], [1, 1.4, 1]);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const meshes = scene.children.filter((child) => child.isMesh);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };

    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes)[0];
      if (hit?.object?.name) {
        selectedRef.current = hit.object.name;
        onZoneSelect?.(hit.object.name);
      }
    };

    let frameId;
    const animate = () => {
      scene.rotation.y += 0.004;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    canvas.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      renderer.dispose();
    };
  }, [onZoneSelect, zoneCounts]);

  const xp =
    (trackerData?.food?.length || 0) * 10 +
    (trackerData?.activities?.length || 0) * 15 +
    (trackerData?.goals?.filter((goal) =>
      goal.health_goal_checkins?.some((checkin) => checkin.completed),
    ).length || 0) *
      20;
  const level = Math.max(1, Math.floor(xp / 100) + 1);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ height: 340, border: "2px solid #111", bgcolor: "#050b12" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip label={`Level ${level}`} />
        <Chip label={`${xp} XP today`} />
        <Chip label={`${bodyCompositionReadings?.length || 0} body readings`} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
        <Chip label={`Weight ${metric(body.weightKg, " kg")}`} />
        <Chip label={`BMI ${metric(body.bmi)}`} />
        <Chip label={`Fat mass ${metric(body.fatMassKg, " kg")}`} />
        <Chip label={`Lean mass ${metric(body.leanMassKg, " kg")}`} />
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {BODY_ZONES.map((zone) => (
          <Button key={zone} size="small" variant="outlined" onClick={() => onZoneSelect?.(zone)}>
            {zone} {zoneCounts[zone] ? `(${zoneCounts[zone]})` : ""}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

export function DailyTrackerPanel({ selectedZone, onTrackerChange }) {
  const authedFetch = useAuthedFetch();
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState({ log: null, food: [], activities: [], symptoms: [], goals: [] });
  const [log, setLog] = useState({ mood: "", sleepHours: "", waterLiters: "", energyLevel: "", stressLevel: "", notes: "" });
  const [food, setFood] = useState({ mealType: "breakfast", foodName: "", quantity: "", calories: "", proteinG: "", notes: "" });
  const [activity, setActivity] = useState({ activityType: "", durationMinutes: "", intensity: "moderate", notes: "" });
  const [symptom, setSymptom] = useState({ bodyZone: selectedZone || "general", symptom: "", severity: "", notes: "" });
  const [goal, setGoal] = useState({ goalType: "nutrition", title: "", target: "", cadence: "daily" });

  const load = async () => {
    const response = await authedFetch(`/api/health-daily-log?date=${date}`);
    if (!response.ok) return;
    const nextData = await response.json();
    setData(nextData);
    setLog({
      mood: nextData.log?.mood || "",
      sleepHours: nextData.log?.sleep_hours || "",
      waterLiters: nextData.log?.water_liters || "",
      energyLevel: nextData.log?.energy_level || "",
      stressLevel: nextData.log?.stress_level || "",
      notes: nextData.log?.notes || "",
    });
    onTrackerChange?.(nextData);
  };

  useEffect(() => {
    load().catch((error) => console.error("Tracker load error:", error));
  }, [date]);

  useEffect(() => {
    if (selectedZone) setSymptom((current) => ({ ...current, bodyZone: selectedZone }));
  }, [selectedZone]);

  const saveLog = async () => {
    await authedFetch("/api/health-daily-log", {
      method: "POST",
      body: JSON.stringify({ ...log, logDate: date }),
    });
    await load();
  };

  const addFood = async () => {
    if (!food.foodName) return;
    await authedFetch("/api/health-food-entry", {
      method: "POST",
      body: JSON.stringify({ ...food, logDate: date }),
    });
    setFood({ mealType: "breakfast", foodName: "", quantity: "", calories: "", proteinG: "", notes: "" });
    await load();
  };

  const addActivity = async () => {
    if (!activity.activityType) return;
    await authedFetch("/api/health-activity-entry", {
      method: "POST",
      body: JSON.stringify({ ...activity, logDate: date }),
    });
    setActivity({ activityType: "", durationMinutes: "", intensity: "moderate", notes: "" });
    await load();
  };

  const addSymptom = async () => {
    if (!symptom.symptom) return;
    await authedFetch("/api/health-symptom-entry", {
      method: "POST",
      body: JSON.stringify({ ...symptom, logDate: date }),
    });
    setSymptom({ bodyZone: selectedZone || "general", symptom: "", severity: "", notes: "" });
    await load();
  };

  const addGoal = async () => {
    if (!goal.title) return;
    await authedFetch("/api/health-goals", {
      method: "POST",
      body: JSON.stringify(goal),
    });
    setGoal({ goalType: "nutrition", title: "", target: "", cadence: "daily" });
    await load();
  };

  const removeEntry = async (endpoint, id) => {
    await authedFetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    await load();
  };

  const checkGoal = async (goalId, completed) => {
    await authedFetch("/api/health-goals", {
      method: "POST",
      body: JSON.stringify({ goalId, checkin: true, checkinDate: date, completed }),
    });
    await load();
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <TextField type="date" label="Tracker Date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 1 }}>
        <TextField label="Mood" value={log.mood} onChange={(e) => setLog({ ...log, mood: e.target.value })} />
        <TextField label="Sleep hrs" type="number" value={log.sleepHours} onChange={(e) => setLog({ ...log, sleepHours: e.target.value })} />
        <TextField label="Water L" type="number" value={log.waterLiters} onChange={(e) => setLog({ ...log, waterLiters: e.target.value })} />
        <TextField label="Energy 1-10" type="number" value={log.energyLevel} onChange={(e) => setLog({ ...log, energyLevel: e.target.value })} />
        <TextField label="Stress 1-10" type="number" value={log.stressLevel} onChange={(e) => setLog({ ...log, stressLevel: e.target.value })} />
      </Box>
      <TextField label="Daily notes" multiline rows={2} value={log.notes} onChange={(e) => setLog({ ...log, notes: e.target.value })} />
      <Button startIcon={<SaveIcon />} variant="contained" onClick={saveLog}>Save Daily Summary</Button>

      <Typography variant="h6">Food Log</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr 110px 110px", gap: 1 }}>
        <FormControl>
          <InputLabel>Meal</InputLabel>
          <Select label="Meal" value={food.mealType} onChange={(e) => setFood({ ...food, mealType: e.target.value })}>
            {["breakfast", "lunch", "dinner", "snack"].map((meal) => <MenuItem key={meal} value={meal}>{meal}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Food" value={food.foodName} onChange={(e) => setFood({ ...food, foodName: e.target.value })} />
        <TextField label="Quantity" value={food.quantity} onChange={(e) => setFood({ ...food, quantity: e.target.value })} />
        <TextField label="Calories" type="number" value={food.calories} onChange={(e) => setFood({ ...food, calories: e.target.value })} />
        <TextField label="Protein g" type="number" value={food.proteinG} onChange={(e) => setFood({ ...food, proteinG: e.target.value })} />
      </Box>
      <Button onClick={addFood}>Add Food</Button>

      <Typography variant="h6">Workout</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 150px 150px", gap: 1 }}>
        <TextField label="Activity" value={activity.activityType} onChange={(e) => setActivity({ ...activity, activityType: e.target.value })} />
        <TextField label="Minutes" type="number" value={activity.durationMinutes} onChange={(e) => setActivity({ ...activity, durationMinutes: e.target.value })} />
        <FormControl>
          <InputLabel>Intensity</InputLabel>
          <Select label="Intensity" value={activity.intensity} onChange={(e) => setActivity({ ...activity, intensity: e.target.value })}>
            {["low", "moderate", "high"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button onClick={addActivity}>Add Workout</Button>

      <Typography variant="h6">Symptoms</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "150px 1fr 120px", gap: 1 }}>
        <FormControl>
          <InputLabel>Zone</InputLabel>
          <Select label="Zone" value={symptom.bodyZone} onChange={(e) => setSymptom({ ...symptom, bodyZone: e.target.value })}>
            {["general", ...BODY_ZONES].map((zone) => <MenuItem key={zone} value={zone}>{zone}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Symptom" value={symptom.symptom} onChange={(e) => setSymptom({ ...symptom, symptom: e.target.value })} />
        <TextField label="Severity" type="number" value={symptom.severity} onChange={(e) => setSymptom({ ...symptom, severity: e.target.value })} />
      </Box>
      <Button onClick={addSymptom}>Add Symptom</Button>

      <Typography variant="h6">Goals</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr 130px", gap: 1 }}>
        <TextField label="Type" value={goal.goalType} onChange={(e) => setGoal({ ...goal, goalType: e.target.value })} />
        <TextField label="Goal" value={goal.title} onChange={(e) => setGoal({ ...goal, title: e.target.value })} />
        <TextField label="Target" value={goal.target} onChange={(e) => setGoal({ ...goal, target: e.target.value })} />
        <FormControl>
          <InputLabel>Cadence</InputLabel>
          <Select label="Cadence" value={goal.cadence} onChange={(e) => setGoal({ ...goal, cadence: e.target.value })}>
            {["daily", "weekly", "monthly"].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Button onClick={addGoal}>Add Goal</Button>

      <Box sx={{ display: "grid", gap: 1 }}>
        {[...data.food, ...data.activities, ...data.symptoms].map((entry) => {
          const endpoint = entry.food_name ? "/api/health-food-entry" : entry.activity_type ? "/api/health-activity-entry" : "/api/health-symptom-entry";
          const label = entry.food_name || entry.activity_type || `${entry.body_zone}: ${entry.symptom}`;
          return (
            <Box key={entry.id} sx={{ display: "flex", justifyContent: "space-between", border: "1px solid #333", p: 1 }}>
              <Typography variant="body2">{label}</Typography>
              <IconButton size="small" onClick={() => removeEntry(endpoint, entry.id)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          );
        })}
        {data.goals.map((item) => (
          <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", border: "1px solid #333", p: 1 }}>
            <Typography variant="body2">{item.title} - {item.target}</Typography>
            <Box>
              <Button size="small" onClick={() => checkGoal(item.id, true)}>Done</Button>
              <IconButton size="small" onClick={() => removeEntry("/api/health-goals", item.id)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function PlansPanel({ latestAssistantMessage, onAskPlan, onSaved }) {
  const authedFetch = useAuthedFetch();
  const [mealText, setMealText] = useState("");
  const [workoutText, setWorkoutText] = useState("");
  const [goalText, setGoalText] = useState("");

  useEffect(() => {
    if (latestAssistantMessage) setMealText(latestAssistantMessage.slice(0, 1200));
  }, [latestAssistantMessage]);

  const saveMeal = async () => {
    if (!mealText.trim()) return;
    await authedFetch("/api/health-food-entry", {
      method: "POST",
      body: JSON.stringify({
        logDate: todayIso(),
        mealType: "lunch",
        foodName: "AI drafted meal plan",
        notes: mealText,
      }),
    });
    onSaved?.();
  };

  const saveWorkout = async () => {
    if (!workoutText.trim()) return;
    await authedFetch("/api/health-activity-entry", {
      method: "POST",
      body: JSON.stringify({
        logDate: todayIso(),
        activityType: "AI drafted workout",
        notes: workoutText,
      }),
    });
    onSaved?.();
  };

  const saveGoal = async () => {
    if (!goalText.trim()) return;
    await authedFetch("/api/health-goals", {
      method: "POST",
      body: JSON.stringify({
        goalType: "ai-plan",
        title: goalText.slice(0, 80),
        target: goalText,
        cadence: "daily",
      }),
    });
    onSaved?.();
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={() => onAskPlan?.("meal")}>Ask Daily Meal Plan</Button>
        <Button variant="contained" onClick={() => onAskPlan?.("workout")}>Ask Workout Plan</Button>
        <Button variant="contained" onClick={() => onAskPlan?.("goals")}>Ask Goal Settings</Button>
      </Box>
      <TextField label="Meal plan to save" multiline rows={5} value={mealText} onChange={(e) => setMealText(e.target.value)} />
      <Button onClick={saveMeal}>Save Meal Plan To Today</Button>
      <TextField label="Workout plan to save" multiline rows={3} value={workoutText} onChange={(e) => setWorkoutText(e.target.value)} />
      <Button onClick={saveWorkout}>Save Workout To Today</Button>
      <TextField label="Goal to save" multiline rows={2} value={goalText} onChange={(e) => setGoalText(e.target.value)} />
      <Button onClick={saveGoal}>Save Goal</Button>
    </Box>
  );
}

export function DocumentsPanel() {
  const { user } = useAuth();
  const authedFetch = useAuthedFetch();
  const fileRef = useRef(null);
  const [state, setState] = useState({ documents: [], isAdmin: false });
  const [selected, setSelected] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [form, setForm] = useState({ title: "", author: "", tags: "", visibility: "shared" });
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL && state.isAdmin;

  const load = async () => {
    const response = await authedFetch("/api/health-documents");
    if (!response.ok) return;
    setState(await response.json());
  };

  useEffect(() => {
    load().catch((error) => console.error("Documents load error:", error));
  }, []);

  const upload = async (documentId) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("title", form.title || file.name);
    body.append("author", form.author);
    body.append("tags", form.tags);
    body.append("visibility", form.visibility);
    if (documentId) body.append("documentId", documentId);

    await authedFetch("/api/health-documents/upload", {
      method: "POST",
      body,
    });
    if (fileRef.current) fileRef.current.value = "";
    await load();
  };

  const preview = async (document) => {
    const response = await authedFetch(`/api/health-documents/${document.id}`);
    if (!response.ok) return;
    const data = await response.json();
    setSelected(data.document);
    setChunks(data.chunks || []);
    setForm({
      title: data.document.title || "",
      author: data.document.author || "",
      tags: (data.document.tags || []).join(", "),
      visibility: data.document.visibility || "shared",
    });
  };

  const saveMetadata = async () => {
    if (!selected) return;
    await authedFetch(`/api/health-documents/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    await preview(selected);
    await load();
  };

  const reprocess = async (document) => {
    await authedFetch(`/api/health-documents/${document.id}/reprocess`, { method: "POST" });
    await load();
  };

  const remove = async (document) => {
    await authedFetch(`/api/health-documents/${document.id}`, { method: "DELETE" });
    setSelected(null);
    setChunks([]);
    await load();
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {isAdmin && (
        <Box sx={{ border: "1px solid #333", p: 2, display: "grid", gap: 1 }}>
          <Typography variant="h6">Admin Library Upload</Typography>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 140px", gap: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <TextField label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <FormControl>
              <InputLabel>Visibility</InputLabel>
              <Select label="Visibility" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                <MenuItem value="shared">shared</MenuItem>
                <MenuItem value="admin_only">admin only</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button startIcon={<UploadIcon />} variant="contained" onClick={() => upload()}>Upload PDF</Button>
            {selected && <Button onClick={() => upload(selected.id)}>Replace Selected PDF</Button>}
            {selected && <Button startIcon={<SaveIcon />} onClick={saveMetadata}>Save Metadata</Button>}
          </Box>
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 1 }}>
        {state.documents.map((document) => (
          <Box key={document.id} sx={{ border: "1px solid #333", p: 1.5, display: "grid", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{document.title}</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip size="small" label={document.status} />
                <Chip size="small" label={`${document.chunk_count || 0} chunks`} />
                <Button size="small" onClick={() => preview(document)}>Preview</Button>
                {isAdmin && <IconButton size="small" onClick={() => reprocess(document)}><AutorenewIcon fontSize="small" /></IconButton>}
                {isAdmin && <IconButton size="small" onClick={() => remove(document)}><DeleteIcon fontSize="small" /></IconButton>}
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              {document.author || "Unknown author"} | {document.visibility} | v{document.version || 1}
              {document.error_message ? ` | ${document.error_message}` : ""}
            </Typography>
          </Box>
        ))}
      </Box>
      {selected && (
        <Box sx={{ border: "1px solid #333", p: 2, display: "grid", gap: 1 }}>
          <Typography variant="h6">Citation Preview: {selected.title}</Typography>
          {chunks.slice(0, 6).map((chunk) => (
            <Box key={chunk.id} sx={{ borderTop: "1px solid #333", pt: 1 }}>
              <Typography variant="caption">
                Chunk {chunk.chunk_index}
                {chunk.chapter ? ` | ${chunk.chapter}` : ""}
                {chunk.page_start ? ` | page ${chunk.page_start}` : ""}
              </Typography>
              <Typography variant="body2">{chunk.content.slice(0, 420)}...</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
