import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import bookKnowledge from "../lib/health-book-knowledge.cjs";

const ADMIN_EMAIL = "gautammaddyson@gmail.com";
const BOOK_CATEGORIES = bookKnowledge.BOOK_CATEGORIES;
const SUPPORTING_BOOK_TAGS = bookKnowledge.SUPPORTING_BOOK_TAGS;
const BODY_SYSTEMS = [
  { id: "surface", label: "Surface body", color: 0x18c7c9 },
  { id: "skeletal", label: "Skeletal", color: 0xe8eef7 },
  { id: "muscular", label: "Muscular", color: 0xff7043 },
  { id: "nervous", label: "Nervous", color: 0xffd54f },
  { id: "cardiovascular", label: "Cardiovascular", color: 0xef5350 },
  { id: "respiratory", label: "Respiratory", color: 0x64b5f6 },
  { id: "digestive", label: "Digestive", color: 0xffb74d },
  { id: "endocrine", label: "Endocrine", color: 0xba68c8 },
  { id: "urinary", label: "Urinary", color: 0x4dd0e1 },
  { id: "skin", label: "Skin", color: 0xa5d6a7 },
];

const BODY_REGIONS = [
  { id: "head", label: "Head / brain", trackerZone: "head" },
  { id: "neck", label: "Neck / throat", trackerZone: "head" },
  { id: "chest", label: "Chest / heart / lungs", trackerZone: "chest" },
  { id: "abdomen", label: "Abdomen / digestive", trackerZone: "abdomen" },
  { id: "pelvis", label: "Pelvis / urinary", trackerZone: "abdomen" },
  { id: "back", label: "Back / spine", trackerZone: "back" },
  { id: "left-arm", label: "Left arm", trackerZone: "arms" },
  { id: "right-arm", label: "Right arm", trackerZone: "arms" },
  { id: "left-leg", label: "Left leg", trackerZone: "legs" },
  { id: "right-leg", label: "Right leg", trackerZone: "legs" },
];

const BODY_ZONES = ["general", ...BODY_REGIONS.map((region) => region.trackerZone)]
  .filter((zone, index, zones) => zones.indexOf(zone) === index);

const PROFILE_SIGNAL_RULES = [
  {
    match: ["hypertension", "high blood pressure", "cvd", "coronary", "heart", "stroke", "cholesterol", "triglycerides"],
    system: "cardiovascular",
    region: "chest",
    label: "Cardiometabolic profile",
  },
  {
    match: ["asthma", "copd", "sleep apnea"],
    system: "respiratory",
    region: "chest",
    label: "Breathing and sleep profile",
  },
  {
    match: ["type 2 diabetes", "type 1 diabetes", "prediabetes", "metabolic", "pcos", "thyroid"],
    system: "endocrine",
    region: "abdomen",
    label: "Metabolic profile",
  },
  {
    match: ["ibd", "ibs", "gerd", "celiac", "fatty liver", "nafld"],
    system: "digestive",
    region: "abdomen",
    label: "Digestive profile",
  },
  {
    match: ["kidney", "urinary"],
    system: "urinary",
    region: "pelvis",
    label: "Kidney and urinary profile",
  },
  {
    match: ["depression", "anxiety", "adhd", "ptsd", "insomnia", "migraine"],
    system: "nervous",
    region: "head",
    label: "Brain, sleep, and stress profile",
  },
  {
    match: ["chronic pain", "arthritis", "osteoarthritis", "osteoporosis", "lupus", "rheumatoid", "psoriatic"],
    system: "muscular",
    region: "back",
    label: "Pain, joints, and mobility profile",
  },
  {
    match: ["endometriosis"],
    system: "endocrine",
    region: "pelvis",
    label: "Hormonal and pelvic profile",
  },
  {
    match: ["anemia"],
    system: "cardiovascular",
    region: "chest",
    label: "Energy and blood profile",
  },
];

const systemLabel = (id) =>
  BODY_SYSTEMS.find((system) => system.id === id)?.label || "Surface body";

const regionLabel = (id) =>
  BODY_REGIONS.find((region) => region.id === id)?.label || id;

const regionTrackerZone = (id) =>
  BODY_REGIONS.find((region) => region.id === id)?.trackerZone || "general";

const highlightKey = (region, system) => `${system}:${region}`;

const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getHealthProfileAvatarSignals = (profile = {}, body = {}) => {
  const conditions = normalizeList(profile.conditions)
    .filter((condition) => condition && condition.toLowerCase() !== "none");
  const goals = normalizeList(profile.goals);
  const text = [...conditions, ...goals].join(" ").toLowerCase();
  const signals = [];

  PROFILE_SIGNAL_RULES.forEach((rule) => {
    if (rule.match.some((keyword) => text.includes(keyword))) {
      signals.push({
        source: "profile",
        system: rule.system,
        region: rule.region,
        label: rule.label,
        detail: conditions.filter((condition) =>
          rule.match.some((keyword) => condition.toLowerCase().includes(keyword)),
        ).join(", "),
      });
    }
  });

  if (body.bmi && body.bmi >= 30) {
    signals.push({
      source: "body-composition",
      system: "endocrine",
      region: "abdomen",
      label: "Weight and metabolic risk context",
      detail: `BMI ${body.bmi} (${body.bmiCategory})`,
    });
  } else if (body.bmi && body.bmi < 18.5) {
    signals.push({
      source: "body-composition",
      system: "muscular",
      region: "abdomen",
      label: "Low weight context",
      detail: `BMI ${body.bmi} (${body.bmiCategory})`,
    });
  }

  if (body.bodyFatCategory === "Elevated estimate") {
    signals.push({
      source: "body-composition",
      system: "endocrine",
      region: "abdomen",
      label: "Elevated body fat estimate",
      detail: `${body.bodyFatPercent}% body fat`,
    });
  }

  if (body.weightToMuscleContext === "Lower reported muscle share") {
    signals.push({
      source: "body-composition",
      system: "muscular",
      region: "left-leg",
      label: "Strength and muscle context",
      detail: body.weightToMuscleContext,
    });
    signals.push({
      source: "body-composition",
      system: "muscular",
      region: "right-leg",
      label: "Strength and muscle context",
      detail: body.weightToMuscleContext,
    });
  }

  return signals.filter(
    (signal, index, list) =>
      list.findIndex((item) => item.system === signal.system && item.region === signal.region && item.label === signal.label) === index,
  );
};

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
  onAskCoach,
  onFocusChange,
}) {
  const canvasRef = useRef(null);
  const authedFetch = useAuthedFetch();
  const symptoms = trackerData?.symptoms || [];
  const body = useMemo(
    () => calculateBodyComposition(userProfile || {}),
    [userProfile],
  );
  const [selectedSystem, setSelectedSystem] = useState("surface");
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [manualHighlights, setManualHighlights] = useState([]);
  const [focusedRegion, setFocusedRegion] = useState("chest");
  const [viewRotation, setViewRotation] = useState(0);
  const [zoom, setZoom] = useState(7);
  const [saveStatus, setSaveStatus] = useState("");

  const zoneCounts = useMemo(
    () =>
      symptoms.reduce((acc, entry) => {
        acc[entry.body_zone] = (acc[entry.body_zone] || 0) + 1;
        return acc;
      }, {}),
    [symptoms],
  );
  const profileSignals = useMemo(
    () => getHealthProfileAvatarSignals(userProfile || {}, body),
    [body, userProfile],
  );
  const signalCountsByRegion = useMemo(
    () =>
      profileSignals.reduce((acc, signal) => {
        acc[signal.region] = (acc[signal.region] || 0) + 1;
        return acc;
      }, {}),
    [profileSignals],
  );
  const focusedSignals = useMemo(
    () =>
      profileSignals.filter(
        (signal) => signal.region === focusedRegion || signal.system === selectedSystem,
      ),
    [focusedRegion, profileSignals, selectedSystem],
  );
  const selectedFocus = useMemo(
    () => ({
      system: selectedSystem,
      systemLabel: systemLabel(selectedSystem),
      region: focusedRegion,
      regionLabel: regionLabel(focusedRegion),
      highlights: manualHighlights,
      profileSignals: focusedSignals,
      bodySummary: {
        bmi: body.bmi,
        bmiCategory: body.bmiCategory,
        bodyFatCategory: body.bodyFatCategory,
        weightToMuscleContext: body.weightToMuscleContext,
      },
    }),
    [body, focusedRegion, focusedSignals, manualHighlights, selectedSystem],
  );

  useEffect(() => {
    const storedHighlights = trackerData?.log?.summary?.avatar_highlights;
    if (Array.isArray(storedHighlights)) {
      setManualHighlights(storedHighlights);
      if (storedHighlights[0]) {
        setFocusedRegion(storedHighlights[0].region);
        setSelectedSystem(storedHighlights[0].system);
      }
    }
  }, [trackerData?.log?.id]);

  useEffect(() => {
    onFocusChange?.(selectedFocus);
  }, [onFocusChange, selectedFocus]);

  const persistHighlights = async (nextHighlights) => {
    try {
      const currentLog = trackerData?.log || {};
      await authedFetch("/api/health-daily-log", {
        method: "POST",
        body: JSON.stringify({
          logDate: currentLog.log_date || todayIso(),
          mood: currentLog.mood || "",
          sleepHours: currentLog.sleep_hours ?? "",
          waterLiters: currentLog.water_liters ?? "",
          energyLevel: currentLog.energy_level ?? "",
          stressLevel: currentLog.stress_level ?? "",
          notes: currentLog.notes || "",
          summary: {
            ...(currentLog.summary || {}),
            avatar_highlights: nextHighlights,
          },
        }),
      });
      setSaveStatus("Saved to today's health log");
    } catch (error) {
      setSaveStatus("Saved locally for this session");
    }
  };

  const toggleHighlight = (region, system = selectedSystem) => {
    const key = highlightKey(region, system);
    const exists = manualHighlights.some(
      (item) => highlightKey(item.region, item.system) === key,
    );
    const nextHighlights = exists
      ? manualHighlights.filter((item) => highlightKey(item.region, item.system) !== key)
      : [
          ...manualHighlights,
          {
            region,
            system,
            label: `${systemLabel(system)} focus: ${regionLabel(region)}`,
            created_at: new Date().toISOString(),
          },
        ];

    setFocusedRegion(region);
    setSelectedSystem(system);
    setSelectedRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    );
    setManualHighlights(nextHighlights);
    onZoneSelect?.(regionTrackerZone(region));
    persistHighlights(nextHighlights);
  };

  const clearHighlights = () => {
    setSelectedRegions([]);
    setManualHighlights([]);
    setSaveStatus("");
    persistHighlights([]);
  };

  const askCoach = () => {
    onAskCoach?.(selectedFocus);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.15, zoom);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.PointLight(0x7dd3fc, 2, 20);
    light.position.set(4, 5, 6);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const regionMeshes = [];
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0ea5a8,
      roughness: 0.48,
      metalness: 0.08,
      transparent: true,
      opacity: 0.72,
    });
    const selectedMaterial = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x004d5c,
      roughness: 0.35,
      metalness: 0.12,
      transparent: true,
      opacity: 0.9,
    });
    const symptomMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7043,
      emissive: 0x4a1408,
      roughness: 0.45,
      metalness: 0.08,
      transparent: true,
      opacity: 0.86,
    });
    const profileMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x2f155f,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.84,
    });
    const overlayMaterial = (system, opacity = 0.82) =>
      new THREE.MeshStandardMaterial({
        color: BODY_SYSTEMS.find((item) => item.id === system)?.color || 0xffffff,
        roughness: 0.5,
        transparent: true,
        opacity,
      });
    const lineMaterial = (system) =>
      new THREE.LineBasicMaterial({
        color: BODY_SYSTEMS.find((item) => item.id === system)?.color || 0xffffff,
        transparent: true,
        opacity: 0.9,
      });

    const isRegionHighlighted = (region) =>
      manualHighlights.some((item) => item.region === region) ||
      selectedRegions.includes(region);

    const materialForRegion = (region) => {
      const trackerZone = regionTrackerZone(region);
      if (isRegionHighlighted(region)) return selectedMaterial;
      if (zoneCounts[trackerZone]) return symptomMaterial;
      if (signalCountsByRegion[region]) return profileMaterial;
      return baseMaterial;
    };

    const addRegion = (region, geometry, position, scale = [1, 1, 1]) => {
      const mesh = new THREE.Mesh(geometry, materialForRegion(region));
      mesh.name = region;
      mesh.userData = { region, system: selectedSystem };
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      scene.add(mesh);
      regionMeshes.push(mesh);
      return mesh;
    };

    const root = new THREE.Group();
    root.rotation.y = viewRotation;
    scene.add(root);

    const addToRoot = (object) => {
      root.add(object);
      return object;
    };

    [
      addRegion("head", new THREE.SphereGeometry(0.45, 32, 32), [0, 2.65, 0]),
      addRegion("neck", new THREE.CapsuleGeometry(0.17, 0.32, 8, 16), [0, 2.15, 0]),
      addRegion("chest", new THREE.CapsuleGeometry(0.66, 1.05, 10, 28), [0, 1.42, 0], [1, 1, 0.9]),
      addRegion("abdomen", new THREE.CapsuleGeometry(0.55, 0.82, 10, 28), [0, 0.45, 0], [1, 1, 0.92]),
      addRegion("pelvis", new THREE.SphereGeometry(0.5, 24, 16), [0, -0.2, 0], [1.18, 0.55, 0.82]),
      addRegion("back", new THREE.TorusGeometry(0.8, 0.035, 12, 60), [0, 1.05, -0.24], [1, 1.4, 1]),
      addRegion("left-arm", new THREE.CapsuleGeometry(0.17, 1.55, 8, 16), [-0.95, 1.08, 0]),
      addRegion("right-arm", new THREE.CapsuleGeometry(0.17, 1.55, 8, 16), [0.95, 1.08, 0]),
      addRegion("left-leg", new THREE.CapsuleGeometry(0.22, 1.7, 8, 16), [-0.32, -1.15, 0]),
      addRegion("right-leg", new THREE.CapsuleGeometry(0.22, 1.7, 8, 16), [0.32, -1.15, 0]),
    ].forEach((mesh) => addToRoot(mesh));

    const addMesh = (system, geometry, position, scale = [1, 1, 1], opacity = 0.82) => {
      const mesh = new THREE.Mesh(geometry, overlayMaterial(system, opacity));
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      addToRoot(mesh);
      return mesh;
    };

    const addLine = (system, points) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map((point) => new THREE.Vector3(...point)),
      );
      addToRoot(new THREE.Line(geometry, lineMaterial(system)));
    };

    if (selectedSystem === "skeletal") {
      addMesh("skeletal", new THREE.SphereGeometry(0.25, 18, 18), [0, 2.65, 0], [1, 1.15, 0.8], 0.9);
      addMesh("skeletal", new THREE.CylinderGeometry(0.06, 0.06, 2.7, 12), [0, 0.95, -0.05]);
      addMesh("skeletal", new THREE.BoxGeometry(1.25, 0.08, 0.08), [0, 1.75, 0]);
      addMesh("skeletal", new THREE.BoxGeometry(0.08, 1.55, 0.08), [-0.95, 1.05, 0]);
      addMesh("skeletal", new THREE.BoxGeometry(0.08, 1.55, 0.08), [0.95, 1.05, 0]);
      addMesh("skeletal", new THREE.BoxGeometry(0.08, 1.65, 0.08), [-0.32, -1.15, 0]);
      addMesh("skeletal", new THREE.BoxGeometry(0.08, 1.65, 0.08), [0.32, -1.15, 0]);
    }

    if (selectedSystem === "muscular") {
      addMesh("muscular", new THREE.CapsuleGeometry(0.42, 1.15, 8, 18), [-0.22, 1.05, 0.08], [0.9, 1, 0.65], 0.78);
      addMesh("muscular", new THREE.CapsuleGeometry(0.42, 1.15, 8, 18), [0.22, 1.05, 0.08], [0.9, 1, 0.65], 0.78);
      addMesh("muscular", new THREE.CapsuleGeometry(0.12, 1.55, 8, 12), [-0.95, 1.08, 0.08], [1.1, 1, 1.1], 0.84);
      addMesh("muscular", new THREE.CapsuleGeometry(0.12, 1.55, 8, 12), [0.95, 1.08, 0.08], [1.1, 1, 1.1], 0.84);
      addMesh("muscular", new THREE.CapsuleGeometry(0.16, 1.65, 8, 12), [-0.32, -1.15, 0.08], [1, 1, 1], 0.84);
      addMesh("muscular", new THREE.CapsuleGeometry(0.16, 1.65, 8, 12), [0.32, -1.15, 0.08], [1, 1, 1], 0.84);
    }

    if (selectedSystem === "nervous") {
      addMesh("nervous", new THREE.SphereGeometry(0.22, 20, 20), [0, 2.66, 0.05], [1.15, 0.8, 0.95], 0.9);
      addLine("nervous", [[0, 2.35, 0.08], [0, 1.5, 0.08], [0, 0.2, 0.08], [0, -1.6, 0.08]]);
      addLine("nervous", [[0, 1.45, 0.08], [-0.95, 1.05, 0.08]]);
      addLine("nervous", [[0, 1.45, 0.08], [0.95, 1.05, 0.08]]);
      addLine("nervous", [[0, 0.05, 0.08], [-0.32, -1.8, 0.08]]);
      addLine("nervous", [[0, 0.05, 0.08], [0.32, -1.8, 0.08]]);
    }

    if (selectedSystem === "cardiovascular") {
      addMesh("cardiovascular", new THREE.SphereGeometry(0.18, 24, 18), [-0.12, 1.35, 0.28], [1, 1.15, 0.8], 0.95);
      addLine("cardiovascular", [[-0.12, 1.35, 0.25], [0, 1.8, 0.18], [0, 2.35, 0.12]]);
      addLine("cardiovascular", [[-0.12, 1.35, 0.25], [0, 0.2, 0.15], [0, -1.8, 0.15]]);
      addLine("cardiovascular", [[0, 1.45, 0.18], [-0.95, 1.05, 0.12]]);
      addLine("cardiovascular", [[0, 1.45, 0.18], [0.95, 1.05, 0.12]]);
    }

    if (selectedSystem === "respiratory") {
      addMesh("respiratory", new THREE.CapsuleGeometry(0.23, 0.65, 12, 18), [-0.28, 1.42, 0.25], [1, 1.2, 0.55], 0.78);
      addMesh("respiratory", new THREE.CapsuleGeometry(0.23, 0.65, 12, 18), [0.28, 1.42, 0.25], [1, 1.2, 0.55], 0.78);
      addMesh("respiratory", new THREE.CylinderGeometry(0.055, 0.055, 0.78, 14), [0, 2.0, 0.25], [1, 1, 1], 0.9);
    }

    if (selectedSystem === "digestive") {
      addMesh("digestive", new THREE.SphereGeometry(0.24, 24, 16), [-0.22, 0.62, 0.28], [1.25, 0.8, 0.75], 0.86);
      addMesh("digestive", new THREE.TorusKnotGeometry(0.28, 0.045, 80, 8), [0.06, 0.08, 0.28], [1.05, 0.8, 0.7], 0.86);
    }

    if (selectedSystem === "endocrine") {
      addMesh("endocrine", new THREE.SphereGeometry(0.08, 16, 12), [0, 2.58, 0.28], [1, 1, 1], 0.95);
      addMesh("endocrine", new THREE.SphereGeometry(0.08, 16, 12), [0, 2.05, 0.28], [1.8, 0.8, 0.8], 0.95);
      addMesh("endocrine", new THREE.SphereGeometry(0.08, 16, 12), [0, 0.72, 0.28], [1.4, 0.8, 0.8], 0.95);
    }

    if (selectedSystem === "urinary") {
      addMesh("urinary", new THREE.SphereGeometry(0.14, 18, 14), [-0.28, 0.45, -0.02], [0.8, 1.15, 0.6], 0.9);
      addMesh("urinary", new THREE.SphereGeometry(0.14, 18, 14), [0.28, 0.45, -0.02], [0.8, 1.15, 0.6], 0.9);
      addLine("urinary", [[-0.28, 0.35, -0.02], [-0.08, -0.18, 0.08]]);
      addLine("urinary", [[0.28, 0.35, -0.02], [0.08, -0.18, 0.08]]);
      addMesh("urinary", new THREE.SphereGeometry(0.16, 18, 14), [0, -0.28, 0.16], [1, 0.75, 0.7], 0.88);
    }

    if (selectedSystem === "skin") {
      addMesh("skin", new THREE.CapsuleGeometry(0.75, 3.6, 16, 32), [0, 0.7, 0], [1.25, 1, 0.82], 0.2);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

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
      const hit = raycaster.intersectObjects(regionMeshes)[0];
      if (hit?.object?.userData?.region) {
        toggleHighlight(hit.object.userData.region, selectedSystem);
      }
    };

    let frameId;
    const animate = () => {
      root.rotation.y += 0.0025;
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
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [focusedRegion, manualHighlights, onZoneSelect, selectedRegions, selectedSystem, signalCountsByRegion, viewRotation, zoom, zoneCounts]);

  const xp =
    (trackerData?.food?.length || 0) * 10 +
    (trackerData?.activities?.length || 0) * 15 +
    (trackerData?.goals?.filter((goal) =>
      goal.health_goal_checkins?.some((checkin) => checkin.completed),
    ).length || 0) *
      20;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const selectedTrackerZone = regionTrackerZone(focusedRegion);
  const relevantSymptoms = symptoms.filter(
    (entry) => entry.body_zone === selectedTrackerZone,
  );
  const relevantActivities = (trackerData?.activities || []).slice(0, 3);
  const relevantGoals = (trackerData?.goals || []).slice(0, 3);

  return (
    <Box className="healthAvatarCockpit" sx={{ display: "grid", gap: 2 }}>
      <Box className="healthCockpitHeader">
        <Box sx={{ display: "grid", gap: 0.5 }}>
          <Typography variant="caption" className="healthCockpitEyebrow">
            3D FOCUS SELECTOR
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Health Profile Avatar
          </Typography>
        </Box>
        <Chip size="small" color="primary" label={`${systemLabel(selectedSystem)} / ${regionLabel(focusedRegion)}`} />
      </Box>

      <Typography variant="caption" sx={{ color: "#9ca3af" }}>
        Purple areas are profile-linked, orange areas are symptom logs, and cyan areas are manual coaching focus. This is not diagnosis.
      </Typography>

      <Box className="healthSystemControls">
        {BODY_SYSTEMS.map((system) => (
          <Button
            key={system.id}
            size="small"
            variant={selectedSystem === system.id ? "contained" : "outlined"}
            onClick={() => setSelectedSystem(system.id)}
            aria-label={`Show ${system.label} system`}
          >
            {system.label}
          </Button>
        ))}
      </Box>

      <Box className="healthAvatarCanvas">
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </Box>

      <Box className="healthAvatarActions">
        <Button size="small" onClick={() => setViewRotation(0)}>Front</Button>
        <Button size="small" onClick={() => setViewRotation(Math.PI)}>Back</Button>
        <Button size="small" onClick={() => setZoom((current) => Math.max(5.5, current - 0.5))}>Zoom In</Button>
        <Button size="small" onClick={() => setZoom((current) => Math.min(9, current + 0.5))}>Zoom Out</Button>
        <Button size="small" color="error" onClick={clearHighlights}>Clear Highlights</Button>
      </Box>

      <Box className="healthSignalStrip">
        <Chip label={`Level ${level}`} />
        <Chip label={`${xp} XP today`} />
        <Chip label={`${bodyCompositionReadings?.length || 0} body readings`} />
        <Chip label={`${profileSignals.length} profile signals`} />
      </Box>
      <Box className="healthMetricGrid">
        <Chip label={`Weight ${metric(body.weightKg, " kg")}`} />
        <Chip label={`BMI ${metric(body.bmi)}`} />
        <Chip label={`Fat mass ${metric(body.fatMassKg, " kg")}`} />
        <Chip label={`Lean mass ${metric(body.leanMassKg, " kg")}`} />
      </Box>
      <Box className="healthRegionControls">
        {BODY_REGIONS.map((region) => (
          <Button
            key={region.id}
            size="small"
            variant={focusedRegion === region.id ? "contained" : "outlined"}
            onClick={() => toggleHighlight(region.id, selectedSystem)}
            aria-label={`Select ${region.label}`}
          >
            {region.label}
            {zoneCounts[region.trackerZone] ? ` S${zoneCounts[region.trackerZone]}` : ""}
            {signalCountsByRegion[region.id] ? ` P${signalCountsByRegion[region.id]}` : ""}
          </Button>
        ))}
      </Box>

      <Box className="healthFocusCard">
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
          Selected focus
        </Typography>
        <Typography variant="body2">
          {systemLabel(selectedSystem)} / {regionLabel(focusedRegion)}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {focusedSignals.slice(0, 5).map((signal) => (
            <Chip
              key={`${signal.source}-${signal.system}-${signal.region}-${signal.label}`}
              size="small"
              color="secondary"
              label={`${signal.label}${signal.detail ? `: ${signal.detail}` : ""}`}
            />
          ))}
          {relevantSymptoms.map((item) => (
            <Chip
              key={item.id}
              size="small"
              color="warning"
              label={`${item.symptom} severity ${item.severity || "n/a"}`}
            />
          ))}
          {relevantActivities.map((item) => (
            <Chip key={item.id} size="small" color="info" label={item.activity_type} />
          ))}
          {relevantGoals.map((item) => (
            <Chip key={item.id} size="small" color="secondary" label={item.title} />
          ))}
          {focusedSignals.length === 0 && relevantSymptoms.length === 0 && relevantActivities.length === 0 && relevantGoals.length === 0 && (
            <Chip size="small" label="No tracker signals for this focus yet" />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
          Use this view to choose a coaching topic from your profile, body composition, symptoms, goals, and habits. It should guide questions, not label disease.
        </Typography>
        <Box className="healthCockpitActions">
          <Button variant="contained" onClick={askCoach}>
            Ask Coach
          </Button>
          <Button variant="outlined" onClick={askCoach}>
            Find Videos
          </Button>
          <Button variant="outlined" onClick={() => toggleHighlight(focusedRegion, selectedSystem)}>
            Log Focus
          </Button>
          <Button variant="outlined" color="error" onClick={clearHighlights}>
            Clear
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 0.75 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
          Manual highlights
        </Typography>
        {manualHighlights.length === 0 ? (
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            Click the avatar or a region button to mark a coaching focus.
          </Typography>
        ) : (
          manualHighlights.map((item) => (
            <Chip
              key={highlightKey(item.region, item.system)}
              label={item.label}
              onDelete={() => toggleHighlight(item.region, item.system)}
            />
          ))
        )}
        {saveStatus && (
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            {saveStatus}
          </Typography>
        )}
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
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "naturopathy",
    tags: "",
    visibility: "shared",
  });
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL && state.isAdmin;
  const bookDocuments = state.documents.filter((document) => document.source_kind === "book");
  const readyBookCount = bookDocuments.filter((document) => document.status === "ready").length;
  const totalBookChunks = bookDocuments.reduce(
    (sum, document) => sum + (document.chunk_count || 0),
    0,
  );

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
    body.append("category", form.category);
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
      category: data.document.metadata?.category || "naturopathy",
      tags: (data.document.tags || []).join(", "),
      visibility: data.document.visibility || "shared",
    });
  };

  const saveMetadata = async () => {
    if (!selected) return;
    await authedFetch(`/api/health-documents/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...form,
        metadata: selected.metadata || {},
      }),
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
          <input ref={fileRef} type="file" accept="application/pdf,application/epub+zip,.pdf,.epub" />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1fr) minmax(0, 1fr) 170px minmax(0, 1fr) 140px",
              },
              gap: 1,
            }}
          >
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <FormControl>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {BOOK_CATEGORIES.map((category) => (
                  <MenuItem key={category.id} value={category.id}>{category.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <Button startIcon={<UploadIcon />} variant="contained" onClick={() => upload()}>Upload Book</Button>
            {selected && <Button onClick={() => upload(selected.id)}>Replace Selected File</Button>}
            {selected && <Button startIcon={<SaveIcon />} onClick={saveMetadata}>Save Metadata</Button>}
          </Box>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Suggested tags: {SUPPORTING_BOOK_TAGS.join(", ")}
          </Typography>
        </Box>
      )}
      <Box sx={{ border: "1px solid #243244", p: 2, display: "grid", gap: 1, background: "#071018" }}>
        <Typography variant="h6">Health Book Knowledge Base</Typography>
        <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
          Imported books are categorized, chunked, embedded, and used as supporting context in chat responses.
          Natural-health book claims are treated as source context, not diagnosis or proof.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={`${readyBookCount}/${bookDocuments.length} books ready`} />
          <Chip size="small" label={`${totalBookChunks} embedded chunks`} />
          <Chip size="small" label="vitamin/mineral intake guidance enabled" />
        </Box>
        {isAdmin && (
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Local folder import: run npm run import:health-books after applying supabase/health-bot-migration.sql.
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "grid", gap: 1 }}>
        {state.documents.map((document) => (
          <Box key={document.id} sx={{ border: "1px solid #333", p: 1.5, display: "grid", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{document.title}</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip size="small" label={document.source_kind || "document"} />
                <Chip size="small" label={document.metadata?.category || "uncategorized"} />
                {document.metadata?.source === "books-folder" && (
                  <Chip size="small" label="books/" color="primary" />
                )}
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

export function UserUploadsPanel() {
  const authedFetch = useAuthedFetch();
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const response = await authedFetch("/api/health-user-files");
    if (!response.ok) return;
    const data = await response.json();
    setFiles(data.files || []);
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message || "Failed to load uploads"));
  }, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("notes", notes);

      const response = await authedFetch("/api/health-user-files/upload", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.error_message || "Upload processing failed");
      }

      setStatus("Uploaded and saved to your health knowledge base.");
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed");
      await load().catch(() => {});
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    setError("");
    setStatus("");
    const response = await authedFetch(`/api/health-user-files?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to delete upload");
      return;
    }
    setStatus("Upload deleted.");
    await load();
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Personal Health Uploads
        </Typography>
        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
          Upload PDFs, text files, or images. Extracted content is saved privately to your health knowledge base.
        </Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {status && <Alert severity="success">{status}</Alert>}
      <Box sx={{ border: "1px solid #333", p: 2, display: "grid", gap: 1 }}>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,text/plain,text/markdown,application/json,.txt,.md,.json,.csv,image/png,image/jpeg,image/webp"
        />
        <TextField
          label="Upload notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          multiline
          rows={2}
        />
        <Button
          startIcon={<UploadIcon />}
          variant="contained"
          onClick={upload}
          disabled={uploading}
        >
          {uploading ? "Processing..." : "Upload to Knowledge Base"}
        </Button>
      </Box>
      <Box sx={{ display: "grid", gap: 1 }}>
        {files.length === 0 && (
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            No personal uploads yet.
          </Typography>
        )}
        {files.map((file) => (
          <Box key={file.id} sx={{ border: "1px solid #333", p: 1.5, display: "grid", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                {file.file_name}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip size="small" label={file.status} />
                <IconButton size="small" onClick={() => remove(file.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              {file.mime_type || "unknown type"} | {new Date(file.created_at).toLocaleString()}
              {file.metadata?.knowledge_chunks ? ` | ${file.metadata.knowledge_chunks} knowledge chunks` : ""}
            </Typography>
            {file.error_message && (
              <Alert severity="warning">{file.error_message}</Alert>
            )}
            {file.summary && (
              <Typography variant="body2">
                {file.summary.slice(0, 700)}
                {file.summary.length > 700 ? "..." : ""}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
