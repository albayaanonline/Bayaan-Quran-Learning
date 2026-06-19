/**
 * Quran Correction Engine
 *
 * Compares reference ayah text with student's transcription to detect missing,
 * extra, and incorrect words.
 *
 * Feedback policy:
 *  - Always mention SPECIFIC Arabic words that were missed or added
 *  - Vary phrasing using a deterministic content-based seed (same verse → consistent style)
 *  - Different advice based on error pattern (consecutive missing, scattered, extra-only, etc.)
 *  - Store analysisLog for debugging
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

/** Deterministic pick — same verse content always selects same variant, so it's consistent but not monotone */
function pick<T>(arr: T[], seed: string): T {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
  }
  return arr[Math.abs(hash) % arr.length];
}

function buildSpecificFeedback(
  correctWords: string[],
  missingWords: string[],
  extraWords: string[],
  accuracyScore: number,
  referenceText: string
): string[] {
  const suggestions: string[] = [];
  // Use the first+last word of the reference as a content-based seed
  const seed = `${referenceText.slice(0, 15)}_${referenceText.slice(-10)}`;

  // ── Perfect ──────────────────────────────────────────────────────────────
  if (accuracyScore === 100 && extraWords.length === 0) {
    suggestions.push(pick([
      "ما شاء الله! Perfect — every word matched. May Allah accept your recitation.",
      "Mashallah! Flawless recitation. Continue to the next verse.",
      "بارك الله فيك! 100% accurate — beautifully recited.",
      "Excellent! Not a single word missed or added. Move to the next ayah.",
      "إحسان! Every word was in its correct place. Keep going!",
    ], seed));
    return suggestions;
  }

  // ── Missing words — mention by name ──────────────────────────────────────
  if (missingWords.length > 0) {
    const count = missingWords.length;
    const first = missingWords[0];
    const last = missingWords[missingWords.length - 1];
    const sample = missingWords.slice(0, 4).join("  ،  ");

    if (count === 1) {
      suggestions.push(pick([
        `One word not detected: «${first}». Repeat just this word 5 times, then recite the full verse.`,
        `Missing: «${first}». Listen to the Qari say this word and imitate it closely.`,
        `«${first}» was not heard. Focus on this word — say it slowly and clearly.`,
        `Only «${first}» was skipped. Practise it alone, then recite the full ayah.`,
      ], first));
    } else if (count === 2) {
      suggestions.push(pick([
        `Two words not detected: «${first}» and «${last}». Practise each one individually.`,
        `Words missed: «${sample}». Listen to the Qari for both and repeat each carefully.`,
        `«${first}» and «${last}» were missing. Review them in the Mushaf, then recite again.`,
      ], first));
    } else if (count <= 5) {
      suggestions.push(pick([
        `${count} words missed — including «${first}» … «${last}». Recite the verse slowly from the start.`,
        `${count} words not detected: «${sample}». Break the verse in half and practise each part.`,
        `Missing: «${sample}». Listen to the reference audio, then recite back word by word.`,
        `${count} words skipped, starting with «${first}». Open the Mushaf and recite along the text.`,
      ], first));
    } else {
      suggestions.push(pick([
        `${count} words not detected — starting from «${first}». Listen to the Qari 3 times before trying again.`,
        `Many words missed (${count}). Open the Mushaf and point to each word as you say it.`,
        `${count} words not heard. Slow down — recite at half speed while reading the text.`,
        `${count} missing words from «${first}» onwards. Divide the verse into three parts and master each one.`,
      ], first));
    }
  }

  // ── Extra words — mention by name ────────────────────────────────────────
  if (extraWords.length > 0) {
    const eSample = extraWords.slice(0, 3).join("  ،  ");
    if (extraWords.length === 1) {
      suggestions.push(pick([
        `Extra word detected: «${extraWords[0]}» — this word is not in this ayah. Check the Mushaf.`,
        `«${extraWords[0]}» was recited but does not belong here. Be careful not to add words from nearby verses.`,
        `One extra word: «${extraWords[0]}». Read from the Mushaf to confirm the exact wording.`,
      ], extraWords[0]));
    } else {
      suggestions.push(pick([
        `${extraWords.length} extra words added: «${eSample}». These are not in this verse — read from the Mushaf carefully.`,
        `Extra words detected: «${eSample}». Slow down and follow the text exactly.`,
        `${extraWords.length} words added that don't belong here. Compare your recitation word by word with the Mushaf.`,
      ], eSample));
    }
  }

  // ── Score-based encouragement (score-and-content aware) ──────────────────
  const firstMissed = missingWords[0] ?? "";
  if (accuracyScore >= 90) {
    suggestions.push(pick([
      `Excellent (${accuracyScore}%)!${firstMissed ? ` Just review «${firstMissed}» once more.` : " Almost perfect — one more practice and you'll have it."}`,
      `Very strong (${accuracyScore}%).${firstMissed ? ` Work on «${firstMissed}» and you're done.` : " Continue to the next verse."}`,
      `Great work (${accuracyScore}%)!${firstMissed ? ` «${firstMissed}» needs a little more attention.` : " Well done — keep this momentum."}`,
    ], seed + "90"));
  } else if (accuracyScore >= 75) {
    suggestions.push(pick([
      `Good effort (${accuracyScore}%). Review the missed words and practise the full verse once more.`,
      `${accuracyScore}% — getting there! Recite 3 more times while looking at the Mushaf.`,
      `Solid attempt (${accuracyScore}%). Focus on the highlighted words and repeat until smooth.`,
      `Progress visible (${accuracyScore}%). Listen to the Qari again, then recite with confidence.`,
    ], seed + "75"));
  } else if (accuracyScore >= 50) {
    suggestions.push(pick([
      `Keep working (${accuracyScore}%). Break the verse in two halves — master each before combining.`,
      `${accuracyScore}% — needs more practice. Recite word by word with the Mushaf open.`,
      `Good start (${accuracyScore}%). Listen to the full verse 3 times, then try again slowly.`,
      `You've got part of it (${accuracyScore}%). Focus on the first half, then add the second.`,
    ], seed + "50"));
  } else if (accuracyScore > 0) {
    suggestions.push(pick([
      `Score: ${accuracyScore}%. Listen to the Qari recite this verse 5 times, then follow along.`,
      `${accuracyScore}% — this verse needs more revision. Listen, repeat, listen, repeat.`,
      `Keep going (${accuracyScore}%). Open your Mushaf and read the verse aloud 10 times slowly.`,
      `${accuracyScore}% — مَن جَدَّ وَجَد — whoever strives will succeed. Practise more.`,
    ], seed + "0"));
  }

  return suggestions;
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
  analysisLog: {
    referenceWordCount: number;
    transcribedWordCount: number;
    lcsLength: number;
    errorPattern: string;
  };
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
      suggestions: [
        "No speech was detected. Speak clearly into the microphone and try again.",
      ],
      analysisLog: {
        referenceWordCount: refWords.length,
        transcribedWordCount: 0,
        lcsLength: 0,
        errorPattern: "empty_transcription",
      },
    };
  }

  const refWords = tokenize(referenceText);
  const transWords = tokenize(transcribedText);

  const { correctWords, missingWords, extraWords } = diffWords(refWords, transWords);

  const total = refWords.length;
  const correct = correctWords.length;
  const accuracyScore = total > 0 ? Math.round((correct / total) * 100) : 0;

  const onlyExtra = missingWords.length === 0 && extraWords.length > 0;
  const mixed = missingWords.length > 0 && extraWords.length > 0;
  const errorPattern =
    accuracyScore === 100 && extraWords.length === 0 ? "perfect"
    : onlyExtra ? "extra_only"
    : mixed ? "missing_and_extra"
    : missingWords.length >= 3 ? "consecutive_missing"
    : missingWords.length > 0 ? "scattered_missing"
    : "unknown";

  const suggestions = buildSpecificFeedback(
    correctWords, missingWords, extraWords, accuracyScore, referenceText
  );

  return {
    correctWords,
    incorrectWords: extraWords,
    missingWords,
    accuracyScore,
    wordStats: { total, correct, missing: missingWords.length, extra: extraWords.length },
    suggestions,
    analysisLog: {
      referenceWordCount: refWords.length,
      transcribedWordCount: transWords.length,
      lcsLength: correct,
      errorPattern,
    },
  };
}
