import type { Compliance, ComplianceResult, ReadyState } from "./types";

type Option<V extends string> = { value: V; label: string; points: number };

// Rubric for hire-and-pay readiness. Everything here is declared by the candidate:
// no document is uploaded or inspected, so it is scored apart from the Evidence Score.
export const ID_OPTIONS: Option<Compliance["id"]>[] = [
  { value: "unknown", label: "Prefer not to say", points: 0 },
  { value: "national", label: "Passport or national ID", points: 35 },
  { value: "refugee-id", label: "UNHCR or government-issued refugee ID", points: 35 },
  { value: "asylum", label: "Asylum-seeker certificate or registration in progress", points: 20 },
  { value: "none", label: "No identity document at present", points: 0 },
];

export const WORK_OPTIONS: Option<Compliance["work"]>[] = [
  { value: "unknown", label: "Prefer not to say", points: 0 },
  { value: "authorized", label: "Authorised to work where I live", points: 35 },
  { value: "remote-only", label: "Remote or freelance contracts only", points: 22 },
  { value: "pending", label: "Work permit applied for", points: 18 },
  { value: "none", label: "Not authorised to work yet", points: 0 },
];

export const PAYMENT_OPTIONS: Option<Compliance["payment"]>[] = [
  { value: "unknown", label: "Prefer not to say", points: 0 },
  { value: "bank", label: "Bank account in my name", points: 30 },
  { value: "mobile-money", label: "Mobile money or digital wallet", points: 24 },
  { value: "pending", label: "Account being opened", points: 12 },
  { value: "none", label: "No way to receive payment yet", points: 0 },
];

export const COMPLIANCE_UNKNOWN: Compliance = { id: "unknown", work: "unknown", payment: "unknown" };

/** A candidate at or above this score can be contracted and paid without further onboarding. */
export const COMPLIANCE_READY_AT = 80;

const pick = <V extends string>(options: Option<V>[], value: V): Option<V> =>
  options.find((o) => o.value === value) ?? { value, label: "Not stated", points: 0 };

const stateFor = (points: number, max: number): ReadyState =>
  points >= max * 0.75 ? "ready" : points > 0 ? "partial" : "missing";

export function assessCompliance(c: Compliance): ComplianceResult {
  const id = pick(ID_OPTIONS, c.id);
  const work = pick(WORK_OPTIONS, c.work);
  const payment = pick(PAYMENT_OPTIONS, c.payment);
  const stated = (o: Option<string>) => (o.value === "unknown" ? "Not stated" : o.label);

  const items = [
    { key: "id" as const, label: "Identity / UNHCR documentation", status: stated(id), points: id.points, max: 35, state: stateFor(id.points, 35) },
    { key: "work" as const, label: "Work authorisation", status: stated(work), points: work.points, max: 35, state: stateFor(work.points, 35) },
    { key: "payment" as const, label: "Payment pathway", status: stated(payment), points: payment.points, max: 30, state: stateFor(payment.points, 30) },
  ];
  const score = items.reduce((a, i) => a + i.points, 0);

  const hasId = c.id === "national" || c.id === "refugee-id";
  const canBePaid = c.payment === "bank" || c.payment === "mobile-money";

  const local: ComplianceResult["local"] =
    c.work === "authorized" && hasId
      ? { state: "ready", note: "States the right to work locally and holds an identity document." }
      : c.work === "authorized" || c.work === "pending"
        ? { state: "partial", note: c.work === "pending" ? "Work permit is still being processed." : "Right to work stated, but identity documentation is incomplete." }
        : { state: "missing", note: c.work === "unknown" ? "Work authorisation was not stated." : "No local work authorisation stated yet." };

  const remote: ComplianceResult["remote"] =
    hasId && canBePaid && (c.work === "authorized" || c.work === "remote-only")
      ? { state: "ready", note: "Holds ID a contractor platform can check and a way to receive payment." }
      : (hasId || c.id === "asylum") && c.payment !== "none" && c.payment !== "unknown" && c.work !== "none"
        ? { state: "partial", note: "Close: one of ID, contract status or payment route still needs completing." }
        : { state: "missing", note: "Needs an identity document and a payment route before a remote contract." };

  const tier = score >= COMPLIANCE_READY_AT ? "Ready to hire and pay" : score >= 50 ? "Nearly ready" : score > 0 ? "Needs onboarding support" : "Not stated";
  return { score, tier, items, local, remote };
}
