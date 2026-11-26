export type Project = { title: string; description: string; link: string };

/** Everything the candidate types in. All of it is self-reported until evidence backs it. */
export type CandidateInput = {
  name: string;
  location: string;
  languages: string[];
  targetRole: string;
  background: string;
  yearsExperience: number | null;
  projects: Project[];
  evidenceUrl: string;
  compliance: Compliance;
};

/** Hire-and-pay readiness as the candidate declares it. No document is inspected. */
export type Compliance = {
  id: "unknown" | "national" | "refugee-id" | "asylum" | "none";
  work: "unknown" | "authorized" | "remote-only" | "pending" | "none";
  payment: "unknown" | "bank" | "mobile-money" | "pending" | "none";
};

export type ReadyState = "ready" | "partial" | "missing";

export type ComplianceResult = {
  score: number;
  tier: string;
  items: { key: keyof Compliance; label: string; status: string; points: number; max: number; state: ReadyState }[];
  local: { state: ReadyState; note: string };
  remote: { state: ReadyState; note: string };
};

export type BridgingStep = {
  area: "Recognition" | "Skills" | "Evidence" | "Compliance";
  title: string;
  detail: string;
};

/** What we could actually read from the repository / portfolio link. */
export type Evidence =
  | { status: "none" }
  | { status: "link"; url: string }
  | { status: "unreachable"; url: string; reason: string }
  | {
      status: "analyzed";
      url: string;
      kind: "repo" | "account";
      fullName: string;
      description: string;
      languages: Record<string, number>;
      topics: string[];
      stars: number;
      forks: number;
      repoCount: number;
      lastPush: string;
      hasReadme: boolean;
      readmeSkills: string[];
      sample: boolean;
    };

export type PassportRecord = {
  id: string;
  createdAt: string;
  input: CandidateInput;
  evidence: Evidence;
  sample: boolean;
};

export type Level = "Foundational" | "Working" | "Proficient" | "Advanced";

export type SkillResult = {
  id: string;
  name: string;
  category: string;
  level: Level;
  score: number;
  source: "repository" | "project" | "both";
  evidence: string[];
  alsoClaimed: boolean;
};

export type ClaimedSkill = { id: string; name: string; category: string };

export type ProjectHighlight = {
  title: string;
  summary: string;
  link: string;
  skills: string[];
  signals: string[];
  strength: "Strong" | "Moderate" | "Light";
};

export type Strength = { title: string; detail: string; basis: "evidence" | "self-reported" };

export type ReadinessNote = { tone: "ready" | "note" | "gap"; text: string };

export type TrustComponent = { label: string; score: number; max: number; note: string };

export type Passport = {
  record: PassportRecord;
  roleFamily: { id: string; label: string };
  verifiedSkills: SkillResult[];
  claimedSkills: ClaimedSkill[];
  projects: ProjectHighlight[];
  strengths: Strength[];
  readiness: ReadinessNote[];
  /** Share of the target role's core skills that are backed by evidence, 0-100. Null when the role has no defined core. */
  roleMatch: number | null;
  compliance: ComplianceResult;
  bridging: BridgingStep[];
  trust: { score: number; tier: string; components: TrustComponent[] };
};
