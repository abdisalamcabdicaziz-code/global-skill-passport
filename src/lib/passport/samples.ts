import { evaluate } from "./evaluate";
import type { Evidence, Passport, PassportRecord } from "./types";

// Fictional people, written to be realistic. Repository figures are baked in and marked
// as sample data so the demo works without the network.
const repo = (
  fullName: string,
  description: string,
  languages: Record<string, number>,
  topics: string[],
  stars: number,
  forks: number,
  lastPush: string,
  readmeSkills: string[],
): Evidence => ({
  status: "analyzed",
  url: `https://github.com/${fullName}`,
  kind: "repo",
  fullName,
  description,
  languages,
  topics,
  stars,
  forks,
  repoCount: 1,
  lastPush,
  hasReadme: true,
  readmeSkills,
  sample: true,
});

export const SAMPLE_RECORDS: PassportRecord[] = [
  {
    id: "GSP-AMINA-7K2Q",
    createdAt: "2026-11-02T09:14:00Z",
    sample: true,
    input: {
      name: "Amina Yusuf",
      location: "Kakuma, Kenya",
      languages: ["Somali", "Swahili", "English", "Arabic"],
      targetRole: "Frontend Developer",
      yearsExperience: 4,
      background:
        "Self-taught web developer. I studied computer science for two years in Mogadishu before displacement and my transcripts could not be recovered. I have built websites and tools for community organisations since 2021 and want a remote frontend role. I also know some Python and Docker.",
      evidenceUrl: "https://github.com/amina-yusuf/clinic-queue",
      compliance: { id: "refugee-id", work: "authorized", payment: "mobile-money" },
      projects: [
        {
          title: "Clinic Queue: offline-first patient queue",
          description:
            "Built a React and TypeScript web app that lets a camp health clinic register patients and manage the waiting queue on low-cost Android tablets. The app works offline-first as a PWA and syncs when connectivity returns. Designed a responsive layout with Tailwind CSS and tested it with 6 nurses. Since launch it is used by 3 clinics and cut average registration time from 9 minutes to 4 minutes.",
          link: "https://github.com/amina-yusuf/clinic-queue",
        },
        {
          title: "Kakuma market prices board",
          description:
            "Designed and built a JavaScript site with a small REST API so 40 traders can post daily prices by SMS. Trained 2 volunteers to maintain it and wrote the documentation in Swahili and English. Reviewed pull requests on GitHub for a team of 3.",
          link: "",
        },
      ],
    },
    evidence: repo(
      "amina-yusuf/clinic-queue",
      "Offline-first patient queue for small clinics",
      { TypeScript: 148200, CSS: 21400, JavaScript: 9800, HTML: 6200 },
      ["react", "pwa", "offline-first", "healthcare"],
      14,
      3,
      "2026-10-02T16:20:00Z",
      ["react", "typescript", "offline-first", "testing", "accessibility"],
    ),
  },
  {
    id: "GSP-OMAR-3F9D",
    createdAt: "2026-10-21T12:40:00Z",
    sample: true,
    input: {
      name: "Omar Al-Khatib",
      location: "Gaziantep, Türkiye",
      languages: ["Arabic", "Turkish", "English"],
      targetRole: "Site Engineer (Civil)",
      yearsExperience: 9,
      background:
        "Civil engineer with 9 years on residential and public building works in Aleppo. My university diploma is not recognised here without documents I cannot obtain. Experienced with Revit and solar installations.",
      evidenceUrl: "https://omar-alkhatib.example/portfolio",
      compliance: { id: "refugee-id", work: "pending", payment: "bank" },
      projects: [
        {
          title: "School rehabilitation, 12 classrooms",
          description:
            "Led site supervision for the rehabilitation of a 12-classroom primary school damaged by the earthquake. Carried out structural assessment of the reinforced concrete frames, prepared load calculations and AutoCAD technical drawings for the repairs, and coordinated 3 contractors. Delivered the works 2 weeks ahead of the timeline and 8% under budget. The school reopened to 540 students.",
          link: "",
        },
        {
          title: "Transitional shelter programme",
          description:
            "Designed foundations and drainage for 220 transitional shelters with an NGO partner. Prepared the bill of quantities, trained a team of 15 local workers in safe construction methods and reported weekly progress to stakeholders.",
          link: "",
        },
        {
          title: "Water network extension",
          description:
            "Surveyed and designed a 1.4 km water supply extension with 6 tap stands serving about 900 people, including the sanitation and latrine layout.",
          link: "",
        },
      ],
    },
    evidence: { status: "link", url: "https://omar-alkhatib.example/portfolio" },
  },
  {
    id: "GSP-OKSANA-8M1T",
    createdAt: "2026-11-10T08:05:00Z",
    sample: true,
    input: {
      name: "Oksana Melnyk",
      location: "Warsaw, Poland",
      languages: ["Ukrainian", "Polish", "English"],
      targetRole: "Data Analyst",
      yearsExperience: 6,
      background:
        "Six years as a financial analyst at a logistics company in Kharkiv. Degree in economics; the original diploma was left behind. Comfortable with Power BI and Tableau, and currently learning machine learning.",
      evidenceUrl: "https://github.com/oksana-melnyk/aid-distribution-analysis",
      compliance: { id: "national", work: "authorized", payment: "bank" },
      projects: [
        {
          title: "Aid distribution analysis for a volunteer hub",
          description:
            "Analysed 18 months of distribution records (62,000 rows) for a volunteer hub using Python and pandas. Cleaned the dataset, wrote SQL queries in PostgreSQL and built a dashboard that showed which districts were under-served. The hub changed 4 delivery routes and reduced duplicate deliveries by 23%.",
          link: "https://github.com/oksana-melnyk/aid-distribution-analysis",
        },
        {
          title: "Volunteer shift forecasting",
          description:
            "Built an Excel model with pivot tables to forecast volunteer shifts for 3 warehouses. Presented the charts to coordinators every week and documented the method in a short user guide.",
          link: "",
        },
      ],
    },
    evidence: repo(
      "oksana-melnyk/aid-distribution-analysis",
      "Notebook analysis of humanitarian aid distribution records",
      { "Jupyter Notebook": 218000, Python: 41200, PLpgSQL: 12400 },
      ["data-analysis", "pandas", "humanitarian", "dashboard"],
      6,
      1,
      "2026-09-18T11:02:00Z",
      ["python", "data-analysis", "sql", "data-viz"],
    ),
  },
  {
    id: "GSP-JEAN-5R4N",
    createdAt: "2026-10-29T15:22:00Z",
    sample: true,
    input: {
      name: "Jean-Baptiste Nkurunziza",
      location: "Nakivale, Uganda",
      languages: ["French", "Kirundi", "Swahili", "English"],
      targetRole: "Community Health Nurse",
      yearsExperience: 11,
      background:
        "Registered nurse for 11 years in Bujumbura, including 4 years as a ward supervisor. My nursing licence and diploma were lost. I am seeking a clinical or community health role while I complete local registration. Trained in CPR.",
      evidenceUrl: "",
      compliance: { id: "refugee-id", work: "authorized", payment: "mobile-money" },
      projects: [
        {
          title: "Mobile immunization outreach",
          description:
            "Coordinated a mobile immunization outreach across 5 zones of the settlement with a team of 8 community health workers. Planned home visits, kept vaccination and patient records, and reported weekly figures to the health partner. Coverage for children under five rose from 61% to 84% in 7 months.",
          link: "",
        },
        {
          title: "Maternal health education sessions",
          description:
            "Designed and delivered antenatal health education sessions in Kirundi, Swahili and French for 300 mothers. Carried out nutrition screening, identified 42 cases of malnutrition and arranged referrals to the clinic.",
          link: "",
        },
        {
          title: "Night triage at the health post",
          description:
            "Volunteer nurse on the night shift: triage, wound care, vital signs and emergency stabilisation before referral, typically 25 patients per shift.",
          link: "",
        },
      ],
    },
    evidence: { status: "none" },
  },
  {
    id: "GSP-FARIDA-2H6W",
    createdAt: "2026-11-14T10:48:00Z",
    sample: true,
    input: {
      name: "Farida Rahimi",
      location: "Berlin, Germany",
      languages: ["Dari", "Pashto", "English", "German"],
      targetRole: "Secondary Mathematics Teacher",
      yearsExperience: 8,
      background:
        "Taught secondary mathematics for 8 years in Herat. My teaching certificate is not yet recognised in Germany. Interested in instructional design and in running courses on Moodle.",
      evidenceUrl: "https://farida-rahimi.example/lessons",
      compliance: { id: "asylum", work: "pending", payment: "pending" },
      projects: [
        {
          title: "Remote maths classes for girls",
          description:
            "Taught algebra and geometry to 85 girls through WhatsApp classes and recorded video lessons after schools closed. Designed a 30-week curriculum with weekly worksheets and assessments. 71 students completed the year and average test scores improved by 19 points.",
          link: "",
        },
        {
          title: "Catch-up tutoring in Berlin",
          description:
            "Volunteer tutoring in mathematics for newly arrived students aged 12 to 16 at a community centre. Wrote lesson plans in German and Dari, trained 4 volunteers and tracked learning outcomes each month.",
          link: "",
        },
      ],
    },
    evidence: { status: "link", url: "https://farida-rahimi.example/lessons" },
  },
  {
    id: "GSP-DANIEL-9C3X",
    createdAt: "2026-11-18T07:30:00Z",
    sample: true,
    input: {
      name: "Daniel Tesfay",
      location: "Addis Ababa, Ethiopia",
      languages: ["Tigrinya", "Amharic", "English"],
      targetRole: "Backend Developer",
      yearsExperience: 5,
      background:
        "Backend developer for 5 years at a telecom company in Asmara. I cannot request references or employment letters from my former employer. Familiar with Kubernetes and Java.",
      evidenceUrl: "https://github.com/daniel-tesfay/remit-ledger-api",
      compliance: { id: "refugee-id", work: "remote-only", payment: "none" },
      projects: [
        {
          title: "Remit Ledger: savings group API",
          description:
            "Built a Python REST API with PostgreSQL for 14 community savings groups to record contributions and loans. Wrote unit tests with pytest reaching 87% test coverage, packaged it with Docker and set up CI/CD with GitHub Actions. The API handles about 3,000 transactions per month for 420 members.",
          link: "https://github.com/daniel-tesfay/remit-ledger-api",
        },
        {
          title: "USSD balance checker",
          description:
            "Designed a USSD and SMS service so members without smartphones can check balances offline. Worked with 2 other developers using Git and code review.",
          link: "",
        },
      ],
    },
    evidence: repo(
      "daniel-tesfay/remit-ledger-api",
      "Ledger API for community savings groups",
      { Python: 96400, PLpgSQL: 8800, Shell: 2300, Dockerfile: 1900 },
      ["api", "postgresql", "docker", "fintech"],
      22,
      5,
      "2026-11-05T19:45:00Z",
      ["python", "api", "sql", "devops", "testing"],
    ),
  },
];

export const SAMPLE_PASSPORTS: Passport[] = SAMPLE_RECORDS.map(evaluate);

export const findSample = (id: string) => SAMPLE_PASSPORTS.find((p) => p.record.id.toLowerCase() === id.toLowerCase());

/** Sample profiles carry their own repository data, so judges can re-run them offline. */
export function sampleEvidenceFor(url: string): Evidence | null {
  const hit = SAMPLE_RECORDS.find((r) => r.input.evidenceUrl !== "" && r.input.evidenceUrl === url.trim());
  return hit ? hit.evidence : null;
}
