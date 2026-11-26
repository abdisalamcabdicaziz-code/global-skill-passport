import { assessCompliance } from "./compliance";
import { SKILLS, SKILL_BY_ID, roleFamilyFor } from "./taxonomy";
import type {
  BridgingStep,
  ClaimedSkill,
  Level,
  Passport,
  PassportRecord,
  ProjectHighlight,
  ReadinessNote,
  SkillResult,
  Strength,
  TrustComponent,
} from "./types";

const sentences = (t: string) =>
  t
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

const clip = (s: string, n = 170) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Figures cited in the text, ignoring calendar years. */
function countMetrics(text: string): number {
  const found = text.match(/(?<![A-Za-z0-9.])\d[\d,.]*/g) ?? [];
  return found.filter((x) => !/^(19|20)\d{2}$/.test(x.replace(/[,.]$/, ""))).length;
}

const OUTCOME = /\b(reduc\w*|increas\w*|improv\w*|launch\w*|deliver\w*|built|designed|implemented|completed|cut|rose|reopened|adopted|used by|in use|handles)\b/i;
const LEAD = /\b(led|trained|mentored|supervised|coordinated|team of)\b/i;
const SHIP = /\b(deployed|launched|launch|in use|used by|is used|live|production|adopted|rolled out|reopened|handles|serving)\b/i;
const CONSTRAINED = /\b(offline|low.bandwidth|low.cost|camp|settlement|power cuts|no electricity|shortage|scarce|limited resources|connectivity|without smartphones|earthquake|schools closed)\b/i;
const COMMUNITY = /\b(community|ngo|clinic|clinics|school|refugee|refugees|families|volunteer|volunteers|humanitarian|mothers|members)\b/i;

export const LEVEL_ORDER: Level[] = ["Foundational", "Working", "Proficient", "Advanced"];

export const LEVEL_MEANING: Record<Level, string> = {
  Foundational: "Mentioned in the evidence with limited supporting detail",
  Working: "Applied in at least one described project",
  Proficient: "Applied repeatedly, with stated outcomes",
  Advanced: "Strong evidence corroborated across sources",
};

/** The published rubric: where the 100 Evidence Score points come from. */
export const RUBRIC = [
  { label: "Repository / portfolio analysis", max: 30, how: "A public GitHub repository or account is read live: languages, README, topics, recent activity. Other portfolio links earn a few points and are flagged for a human reviewer." },
  { label: "Project detail", max: 30, how: "Case studies are read for specifics: what was done, with which tools, for whom, and what happened." },
  { label: "Measurable outcomes", max: 15, how: "Figures an employer can ask about or check, such as people served, time saved or percentages." },
  { label: "Claims match the evidence", max: 15, how: "The share of the target role's core skills that actually appear in the evidence." },
  { label: "Profile completeness", max: 10, how: "Name, location, languages, target role and background are filled in. Self-reported." },
] as const;

const RECOGNITION: Record<string, { title: string; detail: string }> = {
  health: {
    title: "Start nursing registration in the host country",
    detail: "Contact the national nursing and midwifery council about recognition of prior learning or a competency assessment. Supervised practice or a health-assistant role can run alongside it.",
  },
  civil: {
    title: "Apply for engineering recognition or supervised practice",
    detail: "Ask the national engineers' board about a competency interview or a graduate-engineer route. Until then, target site-supervisor or technician roles under a registered engineer.",
  },
  education: {
    title: "Begin teacher qualification recognition",
    detail: "Request an equivalence assessment from the education authority. Teaching-assistant, tutoring and language-support roles are usually open while it is processed.",
  },
};

export function levelFor(score: number): Level {
  if (score >= 66) return "Advanced";
  if (score >= 48) return "Proficient";
  if (score >= 28) return "Working";
  return "Foundational";
}

function tierFor(score: number): string {
  if (score >= 75) return "Strong evidence";
  if (score >= 50) return "Solid evidence";
  if (score >= 30) return "Developing evidence";
  return "Mostly self-reported";
}

const firstMatch = (text: string, re: RegExp) => sentences(text).find((s) => re.test(s));

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * Turns a candidate's submission into a Skill Passport.
 *
 * Rule that everything else hangs on: proficiency levels and "verified" status come only
 * from analysed project write-ups and repository data. The background statement, target
 * role and years of experience are self-reported and never raise a level.
 */
export function evaluate(record: PassportRecord): Passport {
  const { input, evidence } = record;
  const projects = input.projects.filter((p) => p.description.trim().length > 0);
  const projText = projects.map((p) => `${p.title}. ${p.description}`);
  const allProjText = projText.join(" ");
  const claimText = `${input.targetRole}. ${input.background}`;
  const analyzed = evidence.status === "analyzed" ? evidence : null;
  const totalBytes = analyzed ? Object.values(analyzed.languages).reduce((a, b) => a + b, 0) : 0;
  const repoMeta = analyzed ? `${analyzed.topics.join(" ")} ${analyzed.description}` : "";
  const stats = projText.map((t) => ({ metrics: countMetrics(t), outcome: OUTCOME.test(t), length: t.length }));

  const verified: SkillResult[] = [];
  const claimed: ClaimedSkill[] = [];
  const projectSkills: string[][] = projects.map(() => []);

  for (const s of SKILLS) {
    let mentions = 0;
    let distinct = 0;
    let depth = 0;
    const ev: string[] = [];

    projText.forEach((t, i) => {
      const count = t.match(s.re)?.length ?? 0;
      if (count === 0) return;
      const st = stats[i];
      const p = projects[i];
      if (!st || !p) return;
      mentions += count;
      distinct += 1;
      projectSkills[i]?.push(s.name);
      depth = Math.max(depth, (st.metrics > 0 ? 7 : 0) + (st.outcome ? 5 : 0) + (st.length > 300 ? 4 : 0));
      if (ev.length === 0) {
        const quote = firstMatch(p.description, s.reOne) ?? p.title;
        ev.push(`“${clip(quote)}” — ${p.title || `Project ${i + 1}`}`);
      }
    });
    const projScore = mentions > 0 ? Math.min(3, mentions) * 10 + Math.min(2, distinct) * 8 + depth : 0;

    let repoScore = 0;
    if (analyzed) {
      const langs = s.gh.filter((l) => (analyzed.languages[l] ?? 0) > 0);
      const bytes = langs.reduce((a, l) => a + (analyzed.languages[l] ?? 0), 0);
      const share = totalBytes > 0 ? bytes / totalBytes : 0;
      const mentioned = analyzed.readmeSkills.includes(s.id) || s.reOne.test(repoMeta);
      let repoEv = "";
      if (share >= 0.03) {
        repoScore += 10 + share * 30;
        repoEv = `${langs.join(" + ")} makes up ${Math.round(share * 100)}% of the code in ${analyzed.fullName}`;
      }
      if (mentioned) {
        repoScore += 12;
        if (!repoEv) repoEv = `Referenced in the README or topics of ${analyzed.fullName}`;
      }
      if (repoScore > 0) {
        repoScore += (analyzed.hasReadme ? 4 : 0) + (analyzed.stars >= 5 ? 4 : 0);
        ev.unshift(repoEv);
      }
    }

    const alsoClaimed = s.reOne.test(claimText);
    const evidenceScore = projScore + repoScore;
    if (evidenceScore > 0) {
      const score = Math.min(100, Math.round(evidenceScore + (alsoClaimed ? 5 : 0)));
      verified.push({
        id: s.id,
        name: s.name,
        category: s.category,
        level: levelFor(score),
        score,
        source: projScore > 0 && repoScore > 0 ? "both" : repoScore > 0 ? "repository" : "project",
        evidence: ev.slice(0, 2),
        alsoClaimed,
      });
    } else if (alsoClaimed) {
      claimed.push({ id: s.id, name: s.name, category: s.category });
    }
  }
  verified.sort((a, b) => b.score - a.score);
  const verifiedIds = new Set(verified.map((v) => v.id));

  // ---- Highlighted projects -------------------------------------------------
  const highlights: ProjectHighlight[] = projects.map((p, i) => {
    const st = stats[i] ?? { metrics: 0, outcome: false, length: 0 };
    const signals: string[] = [];
    if (st.metrics > 0) signals.push(`${st.metrics} measurable figure${st.metrics === 1 ? "" : "s"}`);
    if (st.outcome) signals.push("States a concrete outcome");
    if (SHIP.test(p.description)) signals.push("In real-world use");
    if (LEAD.test(p.description)) signals.push("Led or trained others");
    const strength =
      st.length > 350 && st.metrics >= 2 && st.outcome
        ? "Strong"
        : st.length > 160 && (st.metrics > 0 || st.outcome)
          ? "Moderate"
          : "Light";
    return {
      title: p.title || `Project ${i + 1}`,
      summary: clip(sentences(p.description).slice(0, 3).join(" "), 340),
      link: p.link,
      skills: (projectSkills[i] ?? []).slice(0, 7),
      signals,
      strength,
    };
  });

  // ---- Real-world strengths -------------------------------------------------
  const strengths: Strength[] = [];
  const totalMetrics = stats.reduce((a, s) => a + s.metrics, 0);
  const addFromText = (title: string, re: RegExp) => {
    const quote = firstMatch(projects.map((p) => p.description).join(" "), re);
    if (quote) strengths.push({ title, detail: `“${clip(quote, 200)}”`, basis: "evidence" });
  };
  if (totalMetrics >= 2) {
    const quote = firstMatch(projects.map((p) => p.description).join(" "), /\d+\s?%|\bfrom \d/);
    strengths.push({
      title: "Measures results",
      detail: quote
        ? `“${clip(quote, 200)}”`
        : `Cites ${totalMetrics} concrete figures across the described projects.`,
      basis: "evidence",
    });
  }
  addFromText("Delivers work people actually use", SHIP);
  addFromText("Leads and trains others", LEAD);
  addFromText("Gets results in constrained settings", CONSTRAINED);
  if (strengths.length < 4) addFromText("Works close to the community", COMMUNITY);
  if (analyzed) {
    strengths.push({
      title: "Work open to inspection",
      detail:
        analyzed.kind === "repo"
          ? `Public repository ${analyzed.fullName} can be reviewed line by line.`
          : `${analyzed.repoCount} public repositories under ${analyzed.fullName} can be reviewed.`,
      basis: "evidence",
    });
  }
  if (input.languages.length >= 3) {
    strengths.push({
      title: "Multilingual",
      detail: `Works across ${input.languages.length} languages: ${list(input.languages)}.`,
      basis: "self-reported",
    });
  }

  // ---- Trust breakdown ------------------------------------------------------
  const components: TrustComponent[] = [];

  let repoPts = 0;
  let repoNote = "No repository or portfolio link was provided.";
  if (analyzed) {
    const recent = Date.now() - new Date(analyzed.lastPush).getTime() < 1000 * 60 * 60 * 24 * 548;
    const langCount = Object.keys(analyzed.languages).length;
    repoPts =
      (analyzed.kind === "repo" ? 16 : 14) +
      (analyzed.hasReadme ? 4 : 0) +
      (langCount >= 2 ? 3 : 0) +
      (recent ? 4 : 0) +
      (analyzed.stars > 0 ? 3 : 0);
    repoNote = `${analyzed.sample ? "Sample repository data" : "Read live from GitHub"}: ${analyzed.fullName}, ${langCount} language${langCount === 1 ? "" : "s"}, ${analyzed.stars} star${analyzed.stars === 1 ? "" : "s"}${recent ? ", recently active" : ""}. Ownership of the account is not confirmed.`;
  } else if (evidence.status === "link") {
    repoPts = 6;
    repoNote = "A portfolio link was provided but its contents could not be read automatically. A reviewer should open it.";
  } else if (evidence.status === "unreachable") {
    repoPts = 2;
    repoNote = `The link could not be analysed: ${evidence.reason}`;
  }
  components.push({ label: "Repository / portfolio analysis", score: repoPts, max: 30, note: repoNote });

  const perProject = stats
    .map((s) => Math.min(1, s.length / 450) * 14 + (s.outcome ? 4 : 0))
    .sort((a, b) => b - a);
  const depthPts = Math.min(30, Math.round((perProject[0] ?? 0) + (perProject.slice(1, 3).reduce((a, b) => a + b, 0) / 18) * 6));
  components.push({
    label: "Project detail",
    score: depthPts,
    max: 30,
    note:
      projects.length === 0
        ? "No project case studies were described."
        : `${projects.length} project case stud${projects.length === 1 ? "y" : "ies"} analysed for specifics: what was done, with which tools, and what happened.`,
  });

  const metricPts = Math.min(15, totalMetrics * 3);
  components.push({
    label: "Measurable outcomes",
    score: metricPts,
    max: 15,
    note: totalMetrics > 0 ? `${totalMetrics} figures cited that an employer can ask about or check.` : "No figures were given. Numbers make claims checkable.",
  });

  const family = roleFamilyFor(input.targetRole);
  const coreNames = (ids: string[]) => ids.map((id) => SKILL_BY_ID.get(id)?.name ?? id);
  const coreEvidenced = family.core.filter((id) => verifiedIds.has(id));
  const coreMissing = family.core.filter((id) => !verifiedIds.has(id));
  let consistencyPts: number;
  let consistencyNote: string;
  if (family.core.length > 0) {
    consistencyPts = Math.round((coreEvidenced.length / family.core.length) * 15);
    consistencyNote = `${coreEvidenced.length} of ${family.core.length} core skills for ${family.label} are backed by evidence.`;
  } else {
    const all = verified.length + claimed.length;
    consistencyPts = all === 0 ? 0 : Math.round((verified.length / all) * 15);
    consistencyNote = `${verified.length} of ${all} skills mentioned are backed by evidence.`;
  }
  components.push({ label: "Claims match the evidence", score: consistencyPts, max: 15, note: consistencyNote });

  const filled = [input.name, input.location, input.languages.join(""), input.targetRole, input.background].filter(
    (v) => v.trim().length > 0,
  ).length;
  components.push({
    label: "Profile completeness",
    score: filled * 2,
    max: 10,
    note: `${filled} of 5 profile sections filled in. These details are self-reported.`,
  });

  const trustScore = components.reduce((a, c) => a + c.score, 0);

  // ---- Work readiness notes -------------------------------------------------
  const readiness: ReadinessNote[] = [];
  const strong = verified.filter((v) => v.level === "Advanced" || v.level === "Proficient");
  const role = input.targetRole || family.label;
  if (strong.length >= 3) {
    readiness.push({
      tone: "ready",
      text: `Evidence supports independent contribution as ${role}: ${list(strong.slice(0, 3).map((s) => s.name))} are shown at Proficient level or above.`,
    });
  } else if (verified.length >= 2) {
    readiness.push({
      tone: "ready",
      text: `Evidence supports an entry-level or supervised start as ${role}, with a skills interview to confirm depth.`,
    });
  } else {
    readiness.push({
      tone: "gap",
      text: "There is not yet enough evidence to estimate readiness. More project detail or work samples are needed.",
    });
  }
  if (family.core.length > 0) {
    readiness.push(
      coreMissing.length === 0
        ? { tone: "ready", text: `All core skills for ${family.label} appear in the evidence.` }
        : {
            tone: "gap",
            text: `Core skills for ${family.label} not yet evidenced: ${list(coreNames(coreMissing))}. Ask about these in interview.`,
          },
    );
  }
  if (analyzed && ["frontend", "backend", "mobile", "data", "design"].includes(family.id)) {
    readiness.push({ tone: "ready", text: "Public work is available for technical review, which suits remote hiring." });
  }
  if (family.regulated) {
    readiness.push({
      tone: "note",
      text: "This is often a regulated profession. The passport shows practical competence; it does not replace local licensing or registration.",
    });
  }
  if (input.languages.length > 0) {
    readiness.push({
      tone: "note",
      text: `Working languages (self-reported): ${list(input.languages)}.${input.yearsExperience ? ` States ${input.yearsExperience} years of experience.` : ""}`,
    });
  }
  if (claimed.length > 0) {
    readiness.push({
      tone: "gap",
      text: `Stated but not shown in any project or repository: ${list(claimed.map((c) => c.name))}.`,
    });
  }
  if (evidence.status === "link") {
    readiness.push({
      tone: "note",
      text: "A portfolio link is attached but was not read automatically. Open it to review the work samples directly.",
    });
  } else if (!analyzed) {
    readiness.push({
      tone: "note",
      text: "To strengthen this passport: add work samples (a portfolio, reports, photos or a code repository) or a reference who can confirm one project.",
    });
  }

  // ---- Bridging and re-certification steps ----------------------------------
  const compliance = assessCompliance(input.compliance);
  const bridging: BridgingStep[] = [];
  const recognition = RECOGNITION[family.id];
  if (recognition) bridging.push({ area: "Recognition", ...recognition });
  if (coreMissing.length > 0) {
    bridging.push({
      area: "Skills",
      title: `Show evidence for ${list(coreNames(coreMissing.slice(0, 3)))}`,
      detail: `These are core to ${family.label} and are not in the evidence yet. A short micro-credential or one small project that uses them, described here, would close the gap.`,
    });
  }
  if (claimed.length > 0) {
    bridging.push({
      area: "Skills",
      title: `Turn stated skills into evidence: ${list(claimed.slice(0, 3).map((c) => c.name))}`,
      detail: "These are mentioned in the background but not in any project. Add a case study or a work sample that uses them.",
    });
  }
  if (!analyzed) {
    bridging.push({
      area: "Evidence",
      title: evidence.status === "link" ? "Ask a reviewer to confirm the portfolio" : "Add work samples someone can open",
      detail:
        evidence.status === "link"
          ? "The portfolio link could not be read automatically. A mentor or partner hub can review it and confirm one project."
          : "A portfolio, reports, photos of completed work or a code repository. A reference letter from a supervisor or NGO partner also helps.",
    });
  }
  if (totalMetrics < 2) {
    bridging.push({
      area: "Evidence",
      title: "Add figures to your case studies",
      detail: "How many people, how long, how much changed. Numbers give an employer something to ask about.",
    });
  }
  if (input.compliance.id === "none" || input.compliance.id === "asylum") {
    bridging.push({
      area: "Compliance",
      title: input.compliance.id === "none" ? "Obtain proof of registration" : "Follow up on your registration",
      detail: "A UNHCR or government refugee ID is the document most employers, banks and mobile-money agents ask for. The nearest registration desk or a legal-aid partner can advise.",
    });
  }
  if (input.compliance.work === "none" || input.compliance.work === "pending") {
    bridging.push({
      area: "Compliance",
      title: input.compliance.work === "pending" ? "Track the work permit application" : "Check the route to work authorisation",
      detail: "Rules differ by country. Meanwhile, remote freelance contracts through an employer-of-record or a partner hub may be possible.",
    });
  }
  if (input.compliance.payment === "none" || input.compliance.payment === "pending") {
    bridging.push({
      area: "Compliance",
      title: "Set up a way to be paid",
      detail: "A bank account or a registered mobile-money wallet in your own name. Some banks and wallets accept a refugee ID; a partner hub can point to one.",
    });
  }

  return {
    record,
    roleFamily: { id: family.id, label: family.label },
    verifiedSkills: verified,
    claimedSkills: claimed,
    projects: highlights,
    strengths: strengths.slice(0, 6),
    readiness,
    roleMatch: family.core.length > 0 ? Math.round((coreEvidenced.length / family.core.length) * 100) : null,
    compliance,
    bridging,
    trust: { score: trustScore, tier: tierFor(trustScore), components },
  };
}
