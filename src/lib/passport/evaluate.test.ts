import { describe, expect, it } from "vitest";

import { evaluate } from "./evaluate";
import { SAMPLE_RECORDS } from "./samples";
import { decodeRecord, encodeRecord } from "./store";
import type { PassportRecord } from "./types";

const base: PassportRecord = {
  id: "GSP-TEST-0001",
  createdAt: "2026-11-24T00:00:00Z",
  sample: false,
  evidence: { status: "none" },
  input: {
    name: "Test Person",
    location: "Nairobi, Kenya",
    languages: ["English"],
    targetRole: "Frontend Developer",
    background: "I know Python and Docker.",
    yearsExperience: 2,
    evidenceUrl: "",
    compliance: { id: "unknown", work: "unknown", payment: "unknown" },
    projects: [
      { title: "Shop site", description: "Built a React site for 3 shops and cut order time by 40%.", link: "" },
    ],
  },
};

describe("skill evaluation", () => {
  it("keeps skills that are only stated in the background out of verified evidence", () => {
    const p = evaluate(base);
    const verified = p.verifiedSkills.map((s) => s.id);
    const claimed = p.claimedSkills.map((s) => s.id);

    expect(verified).toContain("react");
    expect(verified).not.toContain("python");
    expect(claimed).toEqual(expect.arrayContaining(["python", "devops"]));
  });

  it("does not raise proficiency levels from self-reported years of experience", () => {
    const junior = evaluate(base);
    const veteran = evaluate({ ...base, input: { ...base.input, yearsExperience: 25 } });

    expect(veteran.verifiedSkills.map((s) => [s.id, s.score])).toEqual(
      junior.verifiedSkills.map((s) => [s.id, s.score]),
    );
  });

  it("gives no repository trust points when no link was analysed", () => {
    const without = evaluate(base).trust.components[0];
    const amina = SAMPLE_RECORDS[0];
    expect(amina).toBeDefined();
    const withRepo = amina ? evaluate(amina).trust.components[0] : undefined;

    expect(without?.score).toBe(0);
    expect(withRepo?.score).toBeGreaterThan(0);
  });

  it("keeps self-declared compliance out of the Evidence Score and skill levels", () => {
    const undeclared = evaluate(base);
    const declared = evaluate({
      ...base,
      input: { ...base.input, compliance: { id: "refugee-id", work: "authorized", payment: "bank" } },
    });

    expect(declared.trust.score).toBe(undeclared.trust.score);
    expect(declared.verifiedSkills).toEqual(undeclared.verifiedSkills);
    expect(undeclared.compliance.score).toBe(0);
    expect(declared.compliance.score).toBe(100);
  });

  it("recommends a recognition step for regulated professions", () => {
    const nurse = evaluate({ ...base, input: { ...base.input, targetRole: "Community Health Nurse" } });
    const dev = evaluate(base);

    expect(nurse.bridging.some((b) => b.area === "Recognition")).toBe(true);
    expect(dev.bridging.some((b) => b.area === "Recognition")).toBe(false);
  });

  it("opens share links created before the compliance checklist existed", () => {
    const { compliance: _dropped, ...legacyInput } = base.input;
    const decoded = decodeRecord(encodeRecord({ ...base, input: legacyInput } as PassportRecord));

    expect(decoded?.input.compliance).toEqual({ id: "unknown", work: "unknown", payment: "unknown" });
  });

  it("round-trips a passport through its share link", () => {
    const record = { ...base, input: { ...base.input, name: "Zoé Ünal — مريم" } };
    expect(decodeRecord(encodeRecord(record))).toEqual(record);
  });

  it("rejects a tampered share link instead of rendering it", () => {
    expect(decodeRecord("not-a-passport")).toBeNull();
  });
});
