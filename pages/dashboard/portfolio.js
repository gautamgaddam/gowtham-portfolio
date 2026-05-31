import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  IconButton,
  Paper,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import { useAuth } from "../../lib/auth-context";
import { createSupabaseClient } from "../../lib/supabase";

const SKILL_CATEGORIES = [
  "JavaScript",
  "Backend",
  "Web Development",
  "Database",
  "DevOps",
  "Design",
  "Other",
];

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PortfolioEditor() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const supabase = createSupabaseClient();

  // Tab state
  const [tab, setTab] = useState(0);

  // Profile tab state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    bio: "",
    location: "",
    website: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState(null);

  // Skills tab state
  const [skills, setSkills] = useState([]);
  const [skillForm, setSkillForm] = useState({
    category: "JavaScript",
    name: "",
    proficiency: 5,
  });
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillAlert, setSkillAlert] = useState(null);

  // Projects tab state
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    tech_stack: "",
    github_url: "",
    live_url: "",
    featured: false,
  });
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectAlert, setProjectAlert] = useState(null);

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Populate profile form from profile context
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.full_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  // Fetch skills on mount (not just tab switch)
  useEffect(() => {
    if (user && supabase) {
      fetchSkills();
    }
  }, [user, supabase]);

  // Fetch projects on mount (not just tab switch)
  useEffect(() => {
    if (user && supabase) {
      fetchProjects();
    }
  }, [user, supabase]);

  async function fetchSkills() {
    if (!supabase) return;
    setSkillsLoading(true);
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
      setSkillAlert({ type: "error", message: "Failed to load skills" });
    } finally {
      setSkillsLoading(false);
    }
  }

  async function fetchProjects() {
    if (!supabase) return;
    setProjectsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjectAlert({ type: "error", message: "Failed to load projects" });
    } finally {
      setProjectsLoading(false);
    }
  }

  // Profile save
  async function handleSaveProfile() {
    if (!supabase) {
      setProfileAlert({ type: "error", message: "Supabase not configured" });
      return;
    }
    setProfileSaving(true);
    setProfileAlert(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.fullName,
          bio: profileForm.bio,
          location: profileForm.location,
          website: profileForm.website,
        })
        .eq("id", user.id);
      if (error) throw error;
      setProfileAlert({
        type: "success",
        message: "Profile saved successfully!",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      setProfileAlert({ type: "error", message: error.message || "Failed to save profile" });
    } finally {
      setProfileSaving(false);
    }
  }

  // Skill add
  async function handleAddSkill() {
    if (!supabase) {
      setSkillAlert({ type: "error", message: "Supabase not configured" });
      return;
    }
    if (!skillForm.name.trim()) {
      setSkillAlert({ type: "error", message: "Skill name is required" });
      return;
    }
    setSkillAlert(null);
    try {
      const { error } = await supabase.from("skills").insert({
        user_id: user.id,
        category: skillForm.category,
        name: skillForm.name.trim(),
        proficiency: skillForm.proficiency,
      });
      if (error) throw error;
      setSkillForm({ category: "JavaScript", name: "", proficiency: 5 });
      setSkillAlert({ type: "success", message: "Skill added successfully!" });
      fetchSkills();
    } catch (error) {
      console.error("Error adding skill:", error);
      setSkillAlert({ type: "error", message: error.message || "Failed to add skill" });
    }
  }

  // Skill delete
  async function handleDeleteSkill(skillId) {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("skills").delete().eq("id", skillId);
      if (error) throw error;
      setSkillAlert({ type: "success", message: "Skill deleted" });
      fetchSkills();
    } catch (error) {
      console.error("Error deleting skill:", error);
      setSkillAlert({ type: "error", message: "Failed to delete skill" });
    }
  }

  // Project add
  async function handleAddProject() {
    if (!supabase) {
      setProjectAlert({ type: "error", message: "Supabase not configured" });
      return;
    }
    if (!projectForm.title.trim()) {
      setProjectAlert({ type: "error", message: "Project title is required" });
      return;
    }
    setProjectAlert(null);
    try {
      const techArray = projectForm.tech_stack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        tech_stack: techArray,
        github_url: projectForm.github_url.trim(),
        live_url: projectForm.live_url.trim(),
        featured: projectForm.featured,
      });
      if (error) throw error;
      setProjectForm({
        title: "",
        description: "",
        tech_stack: "",
        github_url: "",
        live_url: "",
        featured: false,
      });
      setProjectAlert({ type: "success", message: "Project added successfully!" });
      fetchProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      setProjectAlert({ type: "error", message: error.message || "Failed to add project" });
    }
  }

  // Project delete
  async function handleDeleteProject(projectId) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
      setProjectAlert({ type: "success", message: "Project deleted" });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      setProjectAlert({ type: "error", message: "Failed to delete project" });
    }
  }

  // Guard: Supabase not configured
  if (!supabase) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 400 }}>
          Supabase not configured. Please add your environment variables.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" sx={{ color: "#fff" }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0d0d0d", py: 4 }}>
      <Container maxWidth="md">
        <Typography
          variant="h4"
          sx={{ color: "#66bb6a", fontWeight: "bold", mb: 3 }}
        >
          Portfolio Editor
        </Typography>

        <Box
          sx={{
            border: "4px solid #000",
            boxShadow: "8px 8px #000",
            borderRadius: "12px",
            bgcolor: "#1a1a1a",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: "2px solid #333",
              "& .MuiTab-root": { color: "#aaa", fontWeight: "bold" },
              "& .Mui-selected": { color: "#66bb6a !important" },
              "& .MuiTabs-indicator": { bgcolor: "#66bb6a" },
            }}
          >
            <Tab label="Profile" />
            <Tab label="Skills" />
            <Tab label="Projects" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* ── PROFILE TAB ── */}
            <TabPanel value={tab} index={0}>
              <Stack spacing={2}>
                {profileAlert && (
                  <Alert severity={profileAlert.type}>
                    {profileAlert.message}
                  </Alert>
                )}
                <TextField
                  label="Full Name"
                  value={profileForm.fullName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, fullName: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <TextField
                  label="Bio"
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bio: e.target.value })
                  }
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <TextField
                  label="Location"
                  value={profileForm.location}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, location: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <TextField
                  label="Website"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  sx={{
                    bgcolor: "#66bb6a",
                    color: "#000",
                    fontWeight: "bold",
                    border: "2px solid #000",
                    boxShadow: "3px 3px #000",
                    "&:hover": { bgcolor: "#57a05a" },
                    alignSelf: "flex-start",
                  }}
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </Button>
              </Stack>
            </TabPanel>

            {/* ── SKILLS TAB ── */}
            <TabPanel value={tab} index={1}>
              <Stack spacing={2}>
                {skillAlert && (
                  <Alert severity={skillAlert.type}>{skillAlert.message}</Alert>
                )}

                {/* Existing skills list */}
                {skillsLoading ? (
                  <Typography sx={{ color: "#aaa" }}>
                    Loading skills...
                  </Typography>
                ) : skills.length === 0 ? (
                  <Typography sx={{ color: "#aaa" }}>
                    No skills added yet.
                  </Typography>
                ) : (
                  skills.map((skill) => (
                    <Paper
                      key={skill.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        bgcolor: "#252525",
                        border: "2px solid #333",
                        borderRadius: "8px",
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: "#fff", fontWeight: "bold" }}>
                          {skill.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          {skill.category} · Proficiency: {skill.proficiency}/10
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => handleDeleteSkill(skill.id)}
                        sx={{ color: "#f44336" }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  ))
                )}

                <Divider sx={{ borderColor: "#333", my: 1 }} />

                {/* Add skill form */}
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#66bb6a", fontWeight: "bold" }}
                >
                  Add Skill
                </Typography>
                <FormControl fullWidth variant="outlined">
                  <InputLabel sx={{ color: "#aaa" }}>Category</InputLabel>
                  <Select
                    value={skillForm.category}
                    onChange={(e) =>
                      setSkillForm({ ...skillForm, category: e.target.value })
                    }
                    label="Category"
                    sx={{
                      color: "#fff",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#444",
                      },
                      "& .MuiSvgIcon-root": { color: "#aaa" },
                    }}
                  >
                    {SKILL_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Skill Name"
                  value={skillForm.name}
                  onChange={(e) =>
                    setSkillForm({ ...skillForm, name: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <Box>
                  <Typography sx={{ color: "#aaa", mb: 1 }}>
                    Proficiency: {skillForm.proficiency}/10
                  </Typography>
                  <Slider
                    value={skillForm.proficiency}
                    onChange={(_, v) =>
                      setSkillForm({ ...skillForm, proficiency: v })
                    }
                    min={0}
                    max={10}
                    step={1}
                    sx={{ color: "#66bb6a" }}
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddSkill}
                  sx={{
                    bgcolor: "#66bb6a",
                    color: "#000",
                    fontWeight: "bold",
                    border: "2px solid #000",
                    boxShadow: "3px 3px #000",
                    "&:hover": { bgcolor: "#57a05a" },
                    alignSelf: "flex-start",
                  }}
                >
                  Add Skill
                </Button>
              </Stack>
            </TabPanel>

            {/* ── PROJECTS TAB ── */}
            <TabPanel value={tab} index={2}>
              <Stack spacing={2}>
                {projectAlert && (
                  <Alert severity={projectAlert.type}>
                    {projectAlert.message}
                  </Alert>
                )}

                {/* Existing projects list */}
                {projectsLoading ? (
                  <Typography sx={{ color: "#aaa" }}>
                    Loading projects...
                  </Typography>
                ) : projects.length === 0 ? (
                  <Typography sx={{ color: "#aaa" }}>
                    No projects added yet.
                  </Typography>
                ) : (
                  projects.map((project) => (
                    <Paper
                      key={project.id}
                      sx={{
                        p: 2,
                        bgcolor: "#252525",
                        border: "2px solid #333",
                        borderRadius: "8px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                color: "#fff",
                                fontWeight: "bold",
                                fontSize: "1rem",
                              }}
                            >
                              {project.title}
                            </Typography>
                            {project.featured && (
                              <Chip
                                label="Featured"
                                size="small"
                                sx={{
                                  bgcolor: "#66bb6a",
                                  color: "#000",
                                  fontWeight: "bold",
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Box>
                          {project.description && (
                            <Typography
                              variant="body2"
                              sx={{ color: "#aaa", mt: 0.5 }}
                            >
                              {project.description}
                            </Typography>
                          )}
                          {project.tech_stack &&
                            project.tech_stack.length > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#666",
                                  mt: 0.5,
                                  display: "block",
                                }}
                              >
                                {Array.isArray(project.tech_stack)
                                  ? project.tech_stack.join(", ")
                                  : project.tech_stack}
                              </Typography>
                            )}
                          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                            {project.github_url && (
                              <Typography
                                variant="caption"
                                sx={{ color: "#66bb6a" }}
                              >
                                GitHub
                              </Typography>
                            )}
                            {project.live_url && (
                              <Typography
                                variant="caption"
                                sx={{ color: "#66bb6a" }}
                              >
                                Live
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteProject(project.id)}
                          sx={{ color: "#f44336" }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))
                )}

                <Divider sx={{ borderColor: "#333", my: 1 }} />

                {/* Add project form */}
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#66bb6a", fontWeight: "bold" }}
                >
                  Add Project
                </Typography>
                <TextField
                  label="Title"
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, title: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <TextField
                  label="Description"
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <TextField
                  label="Tech Stack (comma-separated)"
                  value={projectForm.tech_stack}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      tech_stack: e.target.value,
                    })
                  }
                  fullWidth
                  variant="outlined"
                  placeholder="React, Node.js, PostgreSQL"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <TextField
                  label="GitHub URL"
                  value={projectForm.github_url}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      github_url: e.target.value,
                    })
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <TextField
                  label="Live URL"
                  value={projectForm.live_url}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, live_url: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ style: { color: "#aaa" } }}
                  inputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#444" },
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={projectForm.featured}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          featured: e.target.checked,
                        })
                      }
                      sx={{ "& .MuiSwitch-thumb": { bgcolor: "#66bb6a" } }}
                    />
                  }
                  label={
                    <Typography sx={{ color: "#aaa" }}>
                      Featured Project
                    </Typography>
                  }
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddProject}
                  sx={{
                    bgcolor: "#66bb6a",
                    color: "#000",
                    fontWeight: "bold",
                    border: "2px solid #000",
                    boxShadow: "3px 3px #000",
                    "&:hover": { bgcolor: "#57a05a" },
                    alignSelf: "flex-start",
                  }}
                >
                  Add Project
                </Button>
              </Stack>
            </TabPanel>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
