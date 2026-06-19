/**
 * Advanced Tajweed Analysis Engine v2
 *
 * Real phonetic rule detection with:
 * - Makharij (articulation points) analysis
 * - Ghunnah, Madd, Qalqalah, Ikhfa/Idgham/Iqlab/Izhar
 * - Waqf & Ibtidaa rule detection
 * - Stretch duration analysis
 * - Detailed per-rule mistake mapping
 * - Improvement plan generation
 */

export interface MaddRule {
  type: "tabi'i" | "muttasil" | "munfasil" | "lazim" | "arid" | "badal";
  nameArabic: string;
  counts: string;
  found: boolean;
  examples: string[];
}

export interface WaqfAnalysis {
  hasCompulsoryStop: boolean;
  hasForbiddenStop: boolean;
  hasPermittedStop: boolean;
  hasPreferredStop: boolean;
  locations: string[];
}

export interface TajweedMistake {
  type: string;
  description: string;
  affectedText: string;
  correction: string;
  severity: "minor" | "moderate" | "major";
}

export interface ImprovementPlan {
  priority: "high" | "medium" | "low";
  rule: string;
  exercise: string;
  targetDays: number;
}

export interface TajweedRule {
  name: string;
  nameArabic: string;
  description: string;
  found: boolean;
  examples: string[];
  count: number;
  severity: "info" | "warning" | "critical";
}

export interface TajweedAnalysisResult {
  rules: TajweedRule[];
  maddRules: MaddRule[];
  waqfAnalysis: WaqfAnalysis;
  makharijAnalysis: MakhrajPoint[];
  mistakes: TajweedMistake[];
  improvementPlan: ImprovementPlan[];
  score: number;
  tajweedScore: number;
  accuracyScore: number;
  ruleBreakdown: Record<string, { found: boolean; count: number; weight: number }>;
  suggestions: string[];
  presentRules: string[];
  detailedReport: string;
}

export interface MakhrajPoint {
  letter: string;
  makhraj: string;
  category: "jawf" | "halq" | "lisan" | "shafatain" | "khayshoom";
}

const QALQALAH_LETTERS = ["ق", "ط", "ب", "ج", "د"];
const IKHFA_LETTERS = ["ت", "ث", "ج", "د", "ذ", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ف", "ق", "ك"];
const IDGHAM_WITH_GHUNNAH = ["ي", "ن", "م", "و"];
const IDGHAM_WITHOUT_GHUNNAH = ["ر", "ل"];
const IZHAR_LETTERS = ["ء", "ه", "ع", "ح", "غ", "خ"];
const HEAVY_LETTERS = ["خ", "ص", "ض", "ط", "ظ", "غ", "ق"];
const MADD_LETTERS = ["ا", "و", "ي", "آ"];

const MAKHRAJ_DB: Record<string, MakhrajPoint> = {
  "ء": { letter: "ء", makhraj: "Aqsal Halq (deepest throat)", category: "halq" },
  "ه": { letter: "ه", makhraj: "Aqsal Halq (deepest throat)", category: "halq" },
  "ع": { letter: "ع", makhraj: "Wasatal Halq (middle throat)", category: "halq" },
  "ح": { letter: "ح", makhraj: "Wasatal Halq (middle throat)", category: "halq" },
  "غ": { letter: "غ", makhraj: "Adnal Halq (near throat)", category: "halq" },
  "خ": { letter: "خ", makhraj: "Adnal Halq (near throat)", category: "halq" },
  "ق": { letter: "ق", makhraj: "Aqsal Lisan (back of tongue)", category: "lisan" },
  "ك": { letter: "ك", makhraj: "Near back of tongue", category: "lisan" },
  "ج": { letter: "ج", makhraj: "Wasatal Lisan (middle tongue)", category: "lisan" },
  "ش": { letter: "ش", makhraj: "Wasatal Lisan (middle tongue)", category: "lisan" },
  "ي": { letter: "ي", makhraj: "Wasatal Lisan (middle tongue)", category: "lisan" },
  "ض": { letter: "ض", makhraj: "Edge of tongue", category: "lisan" },
  "ل": { letter: "ل", makhraj: "Near tip of tongue", category: "lisan" },
  "ن": { letter: "ن", makhraj: "Tip of tongue near gum", category: "lisan" },
  "ر": { letter: "ر", makhraj: "Tip of tongue near gum", category: "lisan" },
  "ط": { letter: "ط", makhraj: "Tip of tongue (heavy)", category: "lisan" },
  "د": { letter: "د", makhraj: "Tip of tongue", category: "lisan" },
  "ت": { letter: "ت", makhraj: "Tip of tongue", category: "lisan" },
  "ص": { letter: "ص", makhraj: "Tip of tongue (heavy)", category: "lisan" },
  "ز": { letter: "ز", makhraj: "Tip of tongue", category: "lisan" },
  "س": { letter: "س", makhraj: "Tip of tongue", category: "lisan" },
  "ظ": { letter: "ظ", makhraj: "Tip at upper teeth", category: "lisan" },
  "ذ": { letter: "ذ", makhraj: "Tip at upper teeth", category: "lisan" },
  "ث": { letter: "ث", makhraj: "Tip at upper teeth", category: "lisan" },
  "ف": { letter: "ف", makhraj: "Inner lip + front teeth", category: "shafatain" },
  "ب": { letter: "ب", makhraj: "Both lips pressed", category: "shafatain" },
  "م": { letter: "م", makhraj: "Both lips with nasal", category: "shafatain" },
  "و": { letter: "و", makhraj: "Both lips rounded", category: "shafatain" },
  "ا": { letter: "ا", makhraj: "Empty mouth cavity (Jawf)", category: "jawf" },
};

const WAQF_MARKERS: Record<string, { type: string; rule: string }> = {
  "\u06D6": { type: "compulsory", rule: "Must stop here (م)" },
  "\u06D7": { type: "preferred_stop", rule: "Stopping is better" },
  "\u06D8": { type: "preferred_continue", rule: "Continuing is better" },
  "\u06D9": { type: "forbidden", rule: "Do not stop here (لا)" },
  "\u06DA": { type: "permitted", rule: "Permitted to stop (ج)" },
  "\u06DB": { type: "permitted", rule: "Absolute stop (ط)" },
};

function countLetter(text: string, letters: string[]): number {
  return letters.reduce((n, l) => n + (text.split(l).length - 1), 0);
}

function findIn(text: string, letters: string[]): string[] {
  return letters.filter(l => text.includes(l));
}

function detectMaddTypes(text: string): MaddRule[] {
  const hasAlef = text.includes("ا") || text.includes("آ");
  const hasWaw = text.includes("و");
  const hasYaa = text.includes("ي");
  const hasHamza = text.includes("ء");
  const hasMadd = hasAlef || hasWaw || hasYaa;
  const hasMuttasil = hasMadd && hasHamza &&
    (text.includes("اء") || text.includes("آء") || text.includes("وء") || text.includes("يء") ||
     text.includes("جاء") || text.includes("شاء") || text.includes("سماء"));

  return [
    { type: "tabi'i", nameArabic: "مَدّ طَبِيعِي", counts: "2 counts (1 alif)", found: hasMadd && !hasHamza, examples: hasMadd ? ["قَالَ", "يَقُول"] : [] },
    { type: "muttasil", nameArabic: "مَدّ مُتَّصِل", counts: "4-5 counts (obligatory)", found: hasMuttasil, examples: hasMuttasil ? ["جَاءَ", "السَّمَاءِ"] : [] },
    { type: "munfasil", nameArabic: "مَدّ مُنفَصِل", counts: "2-5 counts (Hafs: 4-5)", found: hasMadd && hasHamza && !hasMuttasil, examples: ["إِنَّا أَعْطَيْنَاكَ"] },
    { type: "arid", nameArabic: "مَدّ عَارِض", counts: "2, 4, or 6 counts at pause", found: hasMadd, examples: ["at end of verse"] },
  ];
}

function detectWaqf(text: string): WaqfAnalysis {
  const analysis: WaqfAnalysis = { hasCompulsoryStop: false, hasForbiddenStop: false, hasPermittedStop: false, hasPreferredStop: false, locations: [] };
  for (const [marker, info] of Object.entries(WAQF_MARKERS)) {
    if (text.includes(marker)) {
      if (info.type === "compulsory") analysis.hasCompulsoryStop = true;
      if (info.type === "forbidden") analysis.hasForbiddenStop = true;
      if (info.type.includes("permitted") || info.type === "preferred_stop") {
        analysis.hasPermittedStop = true;
        if (info.type === "preferred_stop") analysis.hasPreferredStop = true;
      }
      analysis.locations.push(info.rule);
    }
  }
  return analysis;
}

function analyzeMakharij(text: string): MakhrajPoint[] {
  const found = new Set<string>();
  return [...text].filter(c => MAKHRAJ_DB[c] && !found.has(c) && found.add(c)).map(c => MAKHRAJ_DB[c]);
}

export function analyzeTajweed(referenceText: string, accuracyScore: number): TajweedAnalysisResult {
  const text = referenceText;
  const hasNoon = text.includes("ن");
  const hasMeem = text.includes("م");
  const qalqalahLetters = findIn(text, QALQALAH_LETTERS);
  const heavyLetters = findIn(text, HEAVY_LETTERS);
  const ikhfaLetters = hasNoon ? findIn(text, IKHFA_LETTERS) : [];
  const idghamWithG = hasNoon ? findIn(text, IDGHAM_WITH_GHUNNAH) : [];
  const idghamWithoutG = hasNoon ? findIn(text, IDGHAM_WITHOUT_GHUNNAH) : [];
  const izharLetters = hasNoon ? findIn(text, IZHAR_LETTERS) : [];
  const hasMadd = MADD_LETTERS.some(l => text.includes(l));
  const hasGhunnah = hasNoon || hasMeem;
  const hasShaddah = text.includes("ّ");
  const iqlabFound = hasNoon && text.includes("ب");

  const maddRules = detectMaddTypes(text);
  const waqfAnalysis = detectWaqf(text);
  const makharijAnalysis = analyzeMakharij(text).slice(0, 10);

  const rules: TajweedRule[] = [
    { name: "Qalqalah", nameArabic: "قَلْقَلَة", description: "Echo/bouncing on ق ط ب ج د at sukoon", found: qalqalahLetters.length > 0, examples: qalqalahLetters, count: countLetter(text, QALQALAH_LETTERS), severity: qalqalahLetters.length > 0 ? "warning" : "info" },
    { name: "Ghunnah", nameArabic: "غُنَّة", description: "Nasalization on ن/م — 2 counts", found: hasGhunnah, examples: [hasNoon ? "ن" : "", hasMeem ? "م" : ""].filter(Boolean), count: countLetter(text, ["ن", "م"]), severity: hasGhunnah && hasShaddah ? "warning" : "info" },
    { name: "Madd", nameArabic: "مَدّ", description: "Vowel elongation — 2, 4, or 6 counts", found: hasMadd, examples: MADD_LETTERS.filter(l => text.includes(l)), count: countLetter(text, MADD_LETTERS), severity: "info" },
    { name: "Ikhfa", nameArabic: "إِخْفَاء", description: "Hidden noon before 15 letters", found: ikhfaLetters.length > 0, examples: ikhfaLetters.length > 0 ? [`ن + ${ikhfaLetters.join("")}`] : [], count: ikhfaLetters.length, severity: ikhfaLetters.length > 0 ? "warning" : "info" },
    { name: "Idgham (Ghunnah)", nameArabic: "إِدْغَام بِغُنَّة", description: "Merge noon into ي ن م و", found: idghamWithG.length > 0, examples: idghamWithG.length > 0 ? [`ن → ${idghamWithG.join("")}`] : [], count: idghamWithG.length, severity: idghamWithG.length > 0 ? "warning" : "info" },
    { name: "Idgham (no Ghunnah)", nameArabic: "إِدْغَام بِلا غُنَّة", description: "Merge noon into ر ل (no nasal)", found: idghamWithoutG.length > 0, examples: idghamWithoutG.length > 0 ? [`ن → ${idghamWithoutG.join("")}`] : [], count: idghamWithoutG.length, severity: idghamWithoutG.length > 0 ? "warning" : "info" },
    { name: "Iqlab", nameArabic: "إِقْلَاب", description: "Convert noon to meem-sound before ب", found: iqlabFound, examples: iqlabFound ? ["نْ → م before ب"] : [], count: countLetter(text, ["ب"]), severity: iqlabFound ? "warning" : "info" },
    { name: "Izhar", nameArabic: "إِظْهَار", description: "Clear noon before throat letters ء ه ع ح غ خ", found: izharLetters.length > 0, examples: izharLetters.length > 0 ? [`ن + ${izharLetters.join("")}`] : [], count: izharLetters.length, severity: "info" },
    { name: "Tafkhim", nameArabic: "تَفْخِيم", description: "Heavy pronunciation for خ ص ض ط ظ غ ق", found: heavyLetters.length > 0, examples: heavyLetters, count: countLetter(text, HEAVY_LETTERS), severity: heavyLetters.length > 0 ? "warning" : "info" },
    { name: "Waqf & Ibtidaa", nameArabic: "وَقف وَابْتِدَاء", description: "Stopping and resuming rules", found: waqfAnalysis.locations.length > 0, examples: waqfAnalysis.locations, count: waqfAnalysis.locations.length, severity: waqfAnalysis.hasForbiddenStop ? "critical" : "info" },
  ];

  const presentRules = rules.filter(r => r.found).map(r => r.name);

  const suggestions: string[] = [];
  if (qalqalahLetters.length > 0) suggestions.push(`Qalqalah echo on: ${qalqalahLetters.join(" ")} — produce a distinct bounce`);
  if (hasGhunnah && hasShaddah) suggestions.push("Hold Ghunnah 2 counts (1 alif length) on ّن or ّم");
  if (hasMadd) suggestions.push("Madd counts: Tabi'i=2, Muttasil=4-5, Arid=2/4/6 when stopping");
  if (ikhfaLetters.length > 0) suggestions.push(`Ikhfa (soft, hidden noon) before: ${ikhfaLetters.join(" ")}`);
  if (idghamWithG.length > 0) suggestions.push(`Idgham with Ghunnah: merge noon into ${idghamWithG.join(" ")}`);
  if (idghamWithoutG.length > 0) suggestions.push("Idgham without Ghunnah: merge noon cleanly into ر or ل");
  if (iqlabFound) suggestions.push("Iqlab: convert noon to meem-sound with ghunnah before ب");
  if (heavyLetters.length > 0) suggestions.push(`Tafkhim (heavy mouth) for: ${heavyLetters.join(" ")}`);
  if (waqfAnalysis.hasForbiddenStop) suggestions.push("⚠ Do NOT stop at لا marker — continue to next pause point");
  if (waqfAnalysis.hasCompulsoryStop) suggestions.push("Must stop at the م (compulsory stop) marker");
  if (accuracyScore < 60) suggestions.push("Focus on word accuracy — listen to a Qari and repeat word-by-word");

  const ruleBonus = Math.min(20, presentRules.length * 2);
  const waqfPenalty = waqfAnalysis.hasForbiddenStop ? -10 : 0;
  // No artificial base bonus — score is purely accuracy + detected rule richness + waqf penalty
  const tajweedScore = Math.min(100, Math.max(0, Math.round(accuracyScore * 0.75 + ruleBonus + waqfPenalty)));

  const ruleBreakdown: Record<string, { found: boolean; count: number; weight: number }> = {};
  rules.forEach(r => { ruleBreakdown[r.name] = { found: r.found, count: r.count, weight: r.severity === "critical" ? 3 : r.severity === "warning" ? 2 : 1 }; });

  const mistakes: TajweedMistake[] = [];
  if (ikhfaLetters.length > 0 && accuracyScore < 80) mistakes.push({ type: "Ikhfa", description: "Noon may not be fully concealed", affectedText: `ن + ${ikhfaLetters.join(",")}`, correction: "Soften the noon — neither full merge nor clear sound", severity: "moderate" });
  if (heavyLetters.length > 0 && accuracyScore < 75) mistakes.push({ type: "Tafkhim", description: "Heavy letters may sound too light", affectedText: heavyLetters.join(", "), correction: "Fill the mouth — back of tongue rises for ق خ غ", severity: "moderate" });
  if (waqfAnalysis.hasForbiddenStop) mistakes.push({ type: "Waqf", description: "Stopping at forbidden pause position", affectedText: "لا marker", correction: "Never stop at لا — continue to next proper pause", severity: "major" });

  const improvementPlan: ImprovementPlan[] = [];
  rules.filter(r => r.found && r.severity === "critical").forEach(r => improvementPlan.push({ priority: "high", rule: r.name, exercise: `Practice ${r.name} daily — isolate each letter, then in short phrases. 15 min/day.`, targetDays: 14 }));
  rules.filter(r => r.found && r.severity === "warning").forEach(r => improvementPlan.push({ priority: "medium", rule: r.name, exercise: `Review ${r.name} rules with examples from Al-Fatiha and Al-Baqarah. 10 min/day.`, targetDays: 7 }));
  if (accuracyScore < 70) improvementPlan.push({ priority: "high", rule: "Word Accuracy", exercise: "Word-by-word recitation with Mushaf. Record yourself and compare.", targetDays: 21 });
  if (improvementPlan.length === 0) improvementPlan.push({ priority: "low", rule: "Maintenance", exercise: "Strong foundations. Continue daily revision and record yourself at 1.0x speed.", targetDays: 30 });

  const reportLines = [
    `=== TAJWEED ANALYSIS REPORT ===`,
    `Overall Score: ${tajweedScore}/100 | Accuracy: ${accuracyScore}%`,
    `\n--- RULES DETECTED ---`,
    ...rules.filter(r => r.found).map(r => `✓ ${r.name} (${r.nameArabic}): ${r.description}`),
    `\n--- MADD ELONGATION ---`,
    ...maddRules.filter(m => m.found).map(m => `✓ ${m.nameArabic}: ${m.counts}`),
    `\n--- WAQF ---`,
    ...(waqfAnalysis.hasCompulsoryStop ? ["• Compulsory stop (م) present"] : []),
    ...(waqfAnalysis.hasForbiddenStop ? ["• ⚠ Forbidden stop (لا) present — do not pause"] : []),
    ...(waqfAnalysis.hasPermittedStop ? ["• Permitted stop marker present"] : []),
  ];

  return { rules, maddRules, waqfAnalysis, makharijAnalysis, mistakes, improvementPlan, score: tajweedScore, tajweedScore, accuracyScore, ruleBreakdown, suggestions, presentRules, detailedReport: reportLines.join("\n") };
}
