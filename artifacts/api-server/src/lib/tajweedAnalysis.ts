/**
 * Tajweed Analysis Engine
 * Detects Tajweed rules present in an Arabic ayah text
 * and generates feedback for students.
 */

export interface TajweedRule {
  name: string;
  nameArabic: string;
  description: string;
  found: boolean;
  examples: string[];
}

export interface TajweedAnalysisResult {
  rules: TajweedRule[];
  score: number;
  suggestions: string[];
  presentRules: string[];
}

const QALQALAH_LETTERS = ["ق", "ط", "ب", "ج", "د"];
const IKHFA_LETTERS = ["ت", "ث", "ج", "د", "ذ", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ف", "ق", "ك"];
const IDGHAM_LETTERS = ["ي", "ر", "م", "ل", "و", "ن"];

function hasLetter(text: string, letters: string[]): string[] {
  return letters.filter((l) => text.includes(l));
}

export function analyzeTajweed(
  referenceText: string,
  accuracyScore: number
): TajweedAnalysisResult {
  const text = referenceText;

  const qalqalahFound = hasLetter(text, QALQALAH_LETTERS);
  const hasNoon = text.includes("ن");
  const hasMeem = text.includes("م");
  const hasAlef = text.includes("ا") || text.includes("آ");
  const hasWaw = text.includes("و");
  const hasYaa = text.includes("ي");
  const ikhfaFound = hasNoon && hasLetter(text, IKHFA_LETTERS).length > 0;
  const idghamFound = hasNoon && hasLetter(text, IDGHAM_LETTERS).length > 0;
  const iqlabFound = hasNoon && text.includes("ب");
  const hasMadd = hasAlef || hasWaw || hasYaa;
  const hasGhunnah = hasNoon || hasMeem;
  const hasMaddMuttasil = (hasAlef && text.includes("ء")) || (hasWaw && text.includes("ء")) || (hasYaa && text.includes("ء"));

  const rules: TajweedRule[] = [
    {
      name: "Qalqalah",
      nameArabic: "قلقلة",
      description: "Echo/bouncing sound on ق ط ب ج د when carrying sukoon",
      found: qalqalahFound.length > 0,
      examples: qalqalahFound,
    },
    {
      name: "Ghunnah",
      nameArabic: "غنة",
      description: "Nasalization on ن and م with shaddah or in specific contexts",
      found: hasGhunnah,
      examples: hasGhunnah ? [hasNoon ? "ن" : "", hasMeem ? "م" : ""].filter(Boolean) : [],
    },
    {
      name: "Madd",
      nameArabic: "مد",
      description: "Elongation of vowel sounds on ا و ي",
      found: hasMadd,
      examples: [hasAlef ? "ا" : "", hasWaw ? "و" : "", hasYaa ? "ي" : ""].filter(Boolean),
    },
    {
      name: "Ikhfa",
      nameArabic: "إخفاء",
      description: "Concealment of noon sakinah before 15 letters",
      found: ikhfaFound,
      examples: ikhfaFound ? ["ن + ikhfa letter"] : [],
    },
    {
      name: "Idgham",
      nameArabic: "إدغام",
      description: "Merging of noon sakinah into following letter",
      found: idghamFound,
      examples: idghamFound ? ["ن + يرملون"] : [],
    },
    {
      name: "Iqlab",
      nameArabic: "إقلاب",
      description: "Converting noon sakinah to meem before ب",
      found: iqlabFound,
      examples: iqlabFound ? ["ن → م before ب"] : [],
    },
    {
      name: "Madd Muttasil",
      nameArabic: "مد متصل",
      description: "Compulsory elongation when madd letter followed by hamza in same word",
      found: hasMaddMuttasil,
      examples: hasMaddMuttasil ? ["madd + ء"] : [],
    },
  ];

  const presentRules = rules.filter((r) => r.found).map((r) => r.name);

  const suggestions: string[] = [];
  if (qalqalahFound.length > 0) {
    suggestions.push(`Apply qalqalah echo on: ${qalqalahFound.join(" ")}`);
  }
  if (hasGhunnah) {
    suggestions.push("Hold ghunnah for 2 counts on ن and م with shaddah");
  }
  if (hasMadd) {
    suggestions.push("Observe madd elongation: 2, 4, or 6 counts depending on context");
  }
  if (ikhfaFound) {
    suggestions.push("Apply ikhfa: soften noon sound before ikhfa letters");
  }
  if (idghamFound) {
    suggestions.push("Apply idgham: merge noon into following يرملون letter");
  }
  if (iqlabFound) {
    suggestions.push("Apply iqlab: convert noon to meem sound before ب");
  }

  const ruleScore = presentRules.length > 0
    ? Math.round(accuracyScore * 0.85 + 15)
    : accuracyScore;

  const score = Math.min(100, Math.max(0, ruleScore));

  return { rules, score, suggestions, presentRules };
}
