export type SkillDef = {
  id: string;
  name: string;
  category: string;
  /** GitHub language names that count as code evidence for this skill. */
  gh: string[];
  re: RegExp;
  reOne: RegExp;
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

function def(id: string, name: string, category: string, keywords: string[], gh: string[] = []): SkillDef {
  const src = `(?<![A-Za-z0-9-])(?:${keywords.map(esc).join("|")})(?![A-Za-z0-9])`;
  return { id, name, category, gh, re: new RegExp(src, "gi"), reOne: new RegExp(src, "i") };
}

const SW = "Software";
const DATA = "Data";
const DES = "Design";
const ENG = "Engineering";
const HEALTH = "Healthcare";
const EDU = "Education";
const PRO = "Professional";

export const SKILLS: SkillDef[] = [
  def("javascript", "JavaScript", SW, ["javascript", "es6", "vue", "vue.js"], ["JavaScript", "Vue"]),
  def("typescript", "TypeScript", SW, ["typescript"], ["TypeScript"]),
  def("react", "React", SW, ["react", "react.js", "next.js", "nextjs", "react native"]),
  def("html-css", "HTML & CSS", SW, ["html", "css", "tailwind", "tailwind css", "sass", "responsive design", "responsive layout"], ["HTML", "CSS", "SCSS"]),
  def("python", "Python", SW, ["python", "django", "flask", "fastapi"], ["Python", "Jupyter Notebook"]),
  def("node", "Node.js", SW, ["node.js", "nodejs", "node", "express"]),
  def("sql", "SQL & Databases", SW, ["sql", "postgresql", "postgres", "mysql", "sqlite", "database design", "relational database", "sql queries"], ["PLpgSQL", "TSQL", "PLSQL"]),
  def("api", "API Design", SW, ["rest api", "rest apis", "api", "apis", "graphql", "webhook", "webhooks"]),
  def("mobile", "Mobile Development", SW, ["android app", "ios app", "flutter", "react native", "kotlin", "swift", "mobile app", "mobile apps"], ["Kotlin", "Swift", "Dart"]),
  def("java", "Java", SW, ["java", "spring boot", "spring"], ["Java"]),
  def("php", "PHP", SW, ["php", "laravel", "wordpress"], ["PHP"]),
  def("devops", "Cloud & DevOps", SW, ["docker", "kubernetes", "ci/cd", "aws", "azure", "linux", "github actions", "vercel", "netlify", "cloud hosting"], ["Dockerfile", "Shell", "HCL"]),
  def("git", "Version Control & Code Review", SW, ["git", "github", "gitlab", "pull request", "pull requests", "code review"]),
  def("testing", "Software Testing", SW, ["unit test", "unit tests", "automated tests", "jest", "pytest", "test coverage", "vitest"]),
  def("offline-first", "Offline-First & Low-Bandwidth Design", SW, ["offline", "offline-first", "low bandwidth", "low-bandwidth", "low connectivity", "sms", "ussd", "pwa"]),
  def("accessibility", "Accessibility", SW, ["accessibility", "accessible", "wcag", "screen reader", "screen readers"]),

  def("data-analysis", "Data Analysis", DATA, ["data analysis", "analytics", "analysed", "analyzed", "pandas", "dataset", "datasets", "statistics", "statistical"]),
  def("excel", "Spreadsheets & Excel", DATA, ["excel", "spreadsheet", "spreadsheets", "google sheets", "pivot table", "pivot tables"]),
  def("data-viz", "Dashboards & Data Visualisation", DATA, ["dashboard", "dashboards", "power bi", "tableau", "visualization", "visualisation", "charts"]),
  def("ml", "Machine Learning", DATA, ["machine learning", "model training", "scikit-learn", "tensorflow", "pytorch", "nlp", "prediction model"]),
  def("gis", "GIS & Mapping", DATA, ["gis", "qgis", "arcgis", "geospatial", "openstreetmap", "mapped"]),

  def("ux", "UX / UI Design", DES, ["ux", "ui design", "user research", "wireframe", "wireframes", "prototype", "prototypes", "figma", "usability"]),
  def("graphic", "Graphic Design", DES, ["graphic design", "photoshop", "illustrator", "branding", "posters", "canva"]),

  def("structural", "Structural & Civil Engineering", ENG, ["structural", "civil engineering", "reinforced concrete", "load calculation", "load calculations", "foundation", "foundations", "site supervision"]),
  def("cad", "CAD & Technical Drawing", ENG, ["autocad", "cad", "revit", "technical drawing", "technical drawings", "blueprints", "bim"]),
  def("construction", "Construction Management", ENG, ["construction", "contractor", "contractors", "bill of quantities", "boq", "building works", "shelter", "shelters", "rehabilitation"]),
  def("wash", "Water & Sanitation (WASH)", ENG, ["water supply", "sanitation", "borehole", "boreholes", "latrine", "latrines", "water network", "drainage", "tap stands"]),
  def("electrical", "Electrical & Solar Systems", ENG, ["electrical", "solar", "wiring", "inverter", "generator", "pv system"]),

  def("clinical", "Clinical Nursing Care", HEALTH, ["nursing", "patient care", "ward", "triage", "wound care", "vital signs", "clinical"]),
  def("maternal", "Maternal & Child Health", HEALTH, ["maternal", "antenatal", "midwife", "midwifery", "newborn", "immunization", "immunisation", "vaccination", "child health", "nutrition screening", "malnutrition"]),
  def("community-health", "Community Health Outreach", HEALTH, ["community health", "health education", "outreach", "health workers", "health promotion", "home visits"]),
  def("health-records", "Health Records & Reporting", HEALTH, ["patient records", "health records", "dhis2", "medical records", "case reporting", "surveillance"]),
  def("firstaid", "Emergency Care & Referral", HEALTH, ["first aid", "emergency", "emergencies", "cpr", "referral", "referrals", "stabilisation", "stabilization"]),

  def("teaching", "Teaching & Classroom Instruction", EDU, ["teaching", "taught", "lessons", "classes", "pupils", "tutoring"]),
  def("curriculum", "Curriculum & Lesson Design", EDU, ["curriculum", "lesson plan", "lesson plans", "syllabus", "learning materials", "worksheets", "instructional design", "course design"]),
  def("assessment", "Learning Assessment", EDU, ["assessments", "exams", "grading", "pass rate", "test scores", "learning outcomes"]),
  def("math", "Mathematics", EDU, ["mathematics", "maths", "math", "algebra", "geometry", "calculus"]),
  def("elearning", "Digital & Remote Learning", EDU, ["e-learning", "online course", "online classes", "moodle", "google classroom", "remote learning", "whatsapp classes", "video lessons", "kolibri"]),

  def("pm", "Project Management", PRO, ["project management", "timeline", "milestones", "budget", "budgets", "stakeholders", "scrum", "agile", "coordinated"]),
  def("leadership", "Team Leadership & Training", PRO, ["led", "supervised", "supervisor", "trained", "mentored", "mentoring", "team of"]),
  def("translation", "Translation & Interpretation", PRO, ["translation", "translated", "interpreter", "interpreting", "interpretation"]),
  def("bookkeeping", "Bookkeeping & Finance", PRO, ["bookkeeping", "accounting", "invoices", "ledger", "payroll", "financial records", "cash flow", "financial analyst"]),
  def("mne", "Monitoring & Evaluation", PRO, ["monitoring and evaluation", "m&e", "survey", "surveys", "kobotoolbox", "data collection", "indicators", "baseline"]),
  def("support", "Customer Support", PRO, ["customer support", "customer service", "help desk", "helpdesk"]),
  def("writing", "Reports & Documentation", PRO, ["documentation", "documented", "proposal", "proposals", "manual", "manuals", "user guide"]),
];

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export type RoleFamily = {
  id: string;
  label: string;
  match: RegExp;
  core: string[];
  /** Regulated professions usually need local licensing on top of proven skill. */
  regulated: boolean;
};

// Order matters: the first family whose pattern matches the target role wins.
export const ROLE_FAMILIES: RoleFamily[] = [
  { id: "frontend", label: "Frontend Development", match: /front|web dev|ui dev|react/i, core: ["javascript", "typescript", "react", "html-css", "git"], regulated: false },
  { id: "mobile", label: "Mobile Development", match: /mobile|android|ios|flutter/i, core: ["mobile", "api", "git", "testing"], regulated: false },
  { id: "data", label: "Data & Analytics", match: /data|analyst|analytics|\bbi\b/i, core: ["data-analysis", "sql", "excel", "data-viz", "python"], regulated: false },
  { id: "design", label: "Design", match: /design|\bux\b|\bui\b/i, core: ["ux", "graphic", "accessibility"], regulated: false },
  { id: "backend", label: "Backend & Software Engineering", match: /back|software|full.?stack|developer|programmer|devops|\bapi\b/i, core: ["api", "sql", "git", "testing", "devops"], regulated: false },
  { id: "civil", label: "Civil & Construction Engineering", match: /civil|structur|site engineer|construction|engineer/i, core: ["structural", "cad", "construction", "pm"], regulated: true },
  { id: "health", label: "Nursing & Community Health", match: /nurs|health|midwi|clinic|medical/i, core: ["clinical", "maternal", "community-health", "health-records", "firstaid"], regulated: true },
  { id: "education", label: "Teaching & Training", match: /teach|tutor|instruct|educat|trainer|lecturer/i, core: ["teaching", "curriculum", "assessment", "elearning"], regulated: true },
  { id: "operations", label: "Project & Programme Management", match: /project|program|coordinator|manager|officer|operations/i, core: ["pm", "leadership", "writing", "mne"], regulated: false },
];

export const GENERAL_FAMILY: RoleFamily = { id: "general", label: "General Professional", match: /.*/, core: [], regulated: false };

export function roleFamilyFor(role: string): RoleFamily {
  return ROLE_FAMILIES.find((f) => f.match.test(role)) ?? GENERAL_FAMILY;
}

/** Skill ids mentioned anywhere in a block of text (used for READMEs and descriptions). */
export function detectSkillIds(text: string): string[] {
  return SKILLS.filter((s) => s.reOne.test(text)).map((s) => s.id);
}
