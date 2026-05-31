import Head from "next/head";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import styles from "../../styles/public-portfolio.module.css";

export default function PublicPortfolio({ profile, skills, projects, error }) {
  if (error) {
    return (
      <div className={styles.container}>
        <p style={{ color: "#f44336", marginTop: "2rem" }}>{error}</p>
      </div>
    );
  }

  // Group skills by category
  const skillsByCategory = (skills || []).reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>{profile.full_name || profile.username} — Portfolio</title>
        <meta name="description" content={profile.bio || ""} />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#121212",
          paddingBottom: "2rem",
        }}
      >
        <div className={styles.container}>
          {/* Hero */}
          <div className={styles.hero}>
            <h1 className={styles.heroName}>
              {profile.full_name || profile.username}
            </h1>
            <p className={styles.heroHandle}>@{profile.username}</p>
            {profile.bio && (
              <p
                style={{ color: "#ccc", marginTop: "0.75rem", lineHeight: 1.6 }}
              >
                {profile.bio}
              </p>
            )}
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              {profile.location && (
                <span style={{ color: "#888", fontSize: "0.9rem" }}>
                  📍 {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#00e676",
                    fontSize: "0.9rem",
                    textDecoration: "none",
                  }}
                >
                  🌐 {profile.website}
                </a>
              )}
            </div>
          </div>

          {/* Skills */}
          {Object.keys(skillsByCategory).length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Skills</h2>
              {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                <div key={category} className={styles.skillCategory}>
                  <p
                    style={{
                      color: "#aaa",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {category}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {catSkills.map((skill) => (
                      <div key={skill.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "3px",
                          }}
                        >
                          <span style={{ color: "#fff", fontSize: "0.9rem" }}>
                            {skill.name}
                          </span>
                          <span style={{ color: "#888", fontSize: "0.8rem" }}>
                            {skill.proficiency}/10
                          </span>
                        </div>
                        <div className={styles.skillBar}>
                          <div
                            className={styles.skillFill}
                            style={{
                              width: `${(skill.proficiency / 10) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Projects</h2>
              <div className={styles.projectGrid}>
                {projects.map((project) => (
                  <div key={project.id} className={styles.projectCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h3
                        style={{ color: "#fff", margin: 0, fontSize: "1.1rem" }}
                      >
                        {project.title}
                      </h3>
                      {project.featured && (
                        <span className={styles.featuredBadge}>Featured</span>
                      )}
                    </div>

                    {project.description && (
                      <p
                        style={{
                          color: "#aaa",
                          fontSize: "0.9rem",
                          lineHeight: 1.5,
                          margin: "0.5rem 0",
                        }}
                      >
                        {project.description}
                      </p>
                    )}

                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.4rem",
                          margin: "0.75rem 0",
                        }}
                      >
                        {(Array.isArray(project.tech_stack)
                          ? project.tech_stack
                          : project.tech_stack.split(",")
                        ).map((tech) => (
                          <span
                            key={tech}
                            style={{
                              background: "#2a2a2a",
                              border: "1px solid #444",
                              color: "#ccc",
                              fontSize: "0.75rem",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        marginTop: "0.75rem",
                      }}
                    >
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#00e676",
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            border: "1px solid #00e676",
                            padding: "2px 10px",
                            borderRadius: "4px",
                          }}
                        >
                          GitHub
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#fff",
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            border: "1px solid #555",
                            padding: "2px 10px",
                            borderRadius: "4px",
                          }}
                        >
                          Live
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer badge */}
          <div className={styles.museForgeFooter}>
            Built with <strong style={{ color: "#00e676" }}>MuseForge</strong>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  if (!supabase) {
    return {
      props: { error: "Database not configured" },
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .single();

  if (profileError || !profile) {
    return { notFound: true };
  }

  // Check if portfolio is public
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("is_public")
    .eq("user_id", profile.id)
    .single();

  // If portfolio exists and is not public, return 404
  if (portfolio && !portfolio.is_public) {
    return { notFound: true };
  }

  const [{ data: skills }, { data: projects }] = await Promise.all([
    supabase.from("skills").select("*").eq("user_id", profile.id).order('display_order', { ascending: true, nullsFirst: false }),
    supabase.from("projects").select("*").eq("user_id", profile.id).order('display_order', { ascending: true, nullsFirst: false }),
  ]);

  return {
    props: {
      profile,
      skills: skills || [],
      projects: projects || [],
    },
  };
}
