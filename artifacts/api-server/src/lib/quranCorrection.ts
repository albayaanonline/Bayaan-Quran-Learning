/**
 * Quran Correction Engine
 * Compares reference ayah text with student's transcription
 * to detect missing, extra, and incorrect words.
 */

function removeArabicDiacritics(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[\u06D6-\u06DC]/g, "")
    .replace(/[\u06DF-\u06E8]/g, "")
    .replace(/[\u06EA-\u06ED]/g, "")
    .replace(/[﴾﴿]/g, "")
    .trim();
}

function normalizeArabic(text: string): string {
  return removeArabicDiacritics(text)
    .replace(/آ/g, "ا")
    .replace(/أ/g, "ا")
    .replace(/إ/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeArabic(text)
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

interface DiffResult {
  correctWords: string[];
  missingWords: string[];
  extraWords: string[];
}

function diffWords(reference: string[], transcribed: string[]): DiffResult {
  const dp = computeLCS(reference, transcribed);
  const correctWords: string[] = [];
  const missingWords: string[] = [];
  const extraWords: string[] = [];

  let i = reference.length;
  let j = transcribed.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && reference[i - 1] === transcribed[j - 1]) {
      correctWords.unshift(reference[i - 1]);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      extraWords.unshift(transcribed[j - 1]);
      j--;
    } else {
      missingWords.unshift(reference[i - 1]);
      i--;
    }
  }

  return { correctWords, missingWords, extraWords };
}

export interface CorrectionResult {
  correctWords: string[];
  incorrectWords: string[];
  missingWords: string[];
  accuracyScore: number;
  wordStats: {
    total: number;
    correct: number;
    missing: number;
    extra: number;
  };
  suggestions: string[];
}

export function analyzeRecitation(
  referenceText: string,
  transcribedText: string
): CorrectionResult {
  if (!transcribedText || transcribedText.trim().length === 0) {
    const refWords = tokenize(referenceText);
    return {
      correctWords: [],
      incorrectWords: [],
      missingWords: refWords,
      accuracyScore: 0,
      wordStats: { total: refWords.length, correct: 0, missing: refWords.length, extra: 0 },
      suggestions: ["No transcription detected. Please speak clearly into the microphone."],
    };
  }

  const refWords = tokenize(referenceText);
  const transWords = tokenize(transcribedText);

  const { correctWords, missingWords, extraWords } = diffWords(refWords, transWords);

  const total = refWords.length;
  const correct = correctWords.length;
  const accuracyScore = total > 0 ? Math.round((correct / total) * 100) : 0;

  const suggestions: string[] = [];
  if (missingWords.length > 0) {
    suggestions.push(`Words missed: ${missingWords.slice(0, 3).join("، ")}`);
  }
  if (extraWords.length > 0) {
    suggestions.push(`Extra words recited: ${extraWords.slice(0, 2).join("، ")}`);
  }
  if (accuracyScore < 70) {
    suggestions.push("Listen to the reference recitation again and practice slowly, word by word.");
  } else if (accuracyScore < 90) {
    suggestions.push("Good effort! Focus on the highlighted missing words and repeat.");
  } else {
    suggestions.push("Excellent recitation! Continue to the next ayah.");
  }

  return {
    correctWords,
    incorrectWords: extraWords,
    missingWords,
    accuracyScore,
    wordStats: { total, correct, missing: missingWords.length, extra: extraWords.length },
    suggestions,
  };
}
