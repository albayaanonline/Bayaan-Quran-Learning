/**
 * Quran Correction Engine
 *
 * Compares reference ayah text with student's transcription using LCS diff.
 * Every recording produces unique feedback because the seed includes the
 * actual transcribed text — different audio → different recognized text → different feedback.
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

/**
 * Deterministic pick using a seed that includes BOTH the reference text AND
 * the transcribed text. This means different recordings of the same ayah
 * (which produce different transcriptions) will select different feedback variants.
 * The recordingId adds additional uniqueness per-attempt.
 */
function pick<T>(arr: T[], seed: string): T {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
    hash = hash & hash; // keep 32-bit
  }
  return arr[Math.abs(hash) % arr.length];
}

/** Build a seed that captures what the student actually said */
function buildSeed(referenceText: string, transcribedText: string, attemptKey: string): string {
  // First 12 chars of reference + first 12 chars of transcription + last 8 of reference + attempt key
  // If transcription is empty, the attempt key provides variation
  const refPart = referenceText.slice(0, 12);
  const transPart = transcribedText.slice(0, 12);
  const refEnd = referenceText.slice(-8);
  return `${refPart}|${transPart}|${refEnd}|${attemptKey}`;
}

function buildSpecificFeedback(
  correctWords: string[],
  missingWords: string[],
  extraWords: string[],
  accuracyScore: number,
  referenceText: string,
  transcribedText: string,
  attemptKey: string
): string[] {
  const suggestions: string[] = [];
  const seed = buildSeed(referenceText, transcribedText, attemptKey);
  const seed2 = buildSeed(referenceText, transcribedText, attemptKey + "_2");
  const seed3 = buildSeed(referenceText, transcribedText, attemptKey + "_3");

  // ── Perfect ──────────────────────────────────────────────────────────────
  if (accuracyScore === 100 && extraWords.length === 0) {
    suggestions.push(pick([
      "ما شاء الله! Perfect — every word matched. May Allah accept your recitation.",
      "Mashallah! Flawless recitation. Continue to the next verse.",
      "بارك الله فيك! 100% accurate — beautifully recited.",
      "Excellent! Not a single word missed or added. Move to the next ayah.",
      "إحسان! Every word was in its correct place. Keep going!",
      "SubhanAllah — perfect word-for-word match. Your memorisation is strong!",
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
        `«${first}» was not heard in your recording. Focus on this word — say it slowly and clearly.`,
        `Only «${first}» was skipped. Practise it alone, then recite the full ayah.`,
        `The word «${first}» did not appear in your recitation. Review it from the Mushaf then record again.`,
      ], seed));
    } else if (count === 2) {
      suggestions.push(pick([
        `Two words not detected: «${first}» and «${last}». Practise each one individually.`,
        `Words missed: «${sample}». Listen to the Qari for both and repeat each carefully.`,
        `«${first}» and «${last}» were missing. Review them in the Mushaf, then recite again.`,
        `Two words absent from your recitation: «${first}» … «${last}». Slow down at these positions.`,
      ], seed));
    } else if (count <= 5) {
      suggestions.push(pick([
        `${count} words missed — including «${first}» … «${last}». Recite the verse slowly from the start.`,
        `${count} words not detected: «${sample}». Break the verse in half and practise each part.`,
        `Missing: «${sample}». Listen to the reference audio, then recite back word by word.`,
        `${count} words skipped, starting with «${first}». Open the Mushaf and recite along the text.`,
        `Your AI teacher detected ${count} absent words. Focus on «${sample}» in particular.`,
      ], seed));
    } else {
      suggestions.push(pick([
        `${count} words not detected — starting from «${first}». Listen to the Qari 3 times before trying again.`,
        `Many words missed (${count}). Open the Mushaf and point to each word as you say it.`,
        `${count} words not heard. Slow down — recite at half speed while reading the text.`,
        `${count} missing words from «${first}» onwards. Divide the verse into three parts and master each one.`,
        `Your recitation had ${count} words the AI could not match. Start fresh from «${first}» with the Mushaf open.`,
      ], seed));
    }
  }

  // ── Extra words — mention by name ────────────────────────────────────────
  if (extraWords.length > 0) {
    const eSample = extraWords.slice(0, 3).join("  ،  ");
    if (extraWords.length === 1) {
      suggestions.push(pick([
        `Extra word detected: «${extraWords[0]}» — this word is not in this ayah. Check the Mushaf.`,
        `«${extraWords[0]}» was heard but does not belong here. Be careful not to add words from nearby verses.`,
        `One extra word: «${extraWords[0]}». Read from the Mushaf to confirm the exact wording.`,
        `Your AI teacher noticed «${extraWords[0]}» which is not in this verse — verify against the Mushaf.`,
      ], seed2));
    } else {
      suggestions.push(pick([
        `${extraWords.length} extra words added: «${eSample}». These are not in this verse — read from the Mushaf carefully.`,
        `Extra words detected: «${eSample}». Slow down and follow the text exactly.`,
        `${extraWords.length} words added that don't belong here. Compare your recitation word by word with the Mushaf.`,
        `Your recording contained ${extraWords.length} extra words not in this ayah: «${eSample}». Review the correct text.`,
      ], seed2));
    }
  }

  // ── Score-based encouragement (unique per transcription) ──────────────────
  const firstMissed = missingWords[0] ?? "";
  if (accuracyScore >= 90) {
    suggestions.push(pick([
      `Excellent (${accuracyScore}%)!${firstMissed ? ` Just review «${firstMissed}» once more.` : " Almost perfect — one more practice and you'll have it."}`,
      `Very strong (${accuracyScore}%).${firstMissed ? ` Work on «${firstMissed}» and you're done.` : " Continue to the next verse."}`,
      `Great work (${accuracyScore}%)!${firstMissed ? ` «${firstMissed}» needs a little more attention.` : " Well done — keep this momentum."}`,
      `Impressive — ${accuracyScore}% word accuracy! ${firstMissed ? `Just nail «${firstMissed}» next time.` : "Push for 100% next attempt."}`,
    ], seed3));
  } else if (accuracyScore >= 75) {
    suggestions.push(pick([
      `Good effort (${accuracyScore}%). Review the missed words and practise the full verse once more.`,
      `${accuracyScore}% — getting there! Recite 3 more times while looking at the Mushaf.`,
      `Solid attempt (${accuracyScore}%). Focus on the highlighted words and repeat until smooth.`,
      `Progress visible (${accuracyScore}%). Listen to the Qari again, then recite with confidence.`,
      `${accuracyScore}% word accuracy — strong foundation. Practise the gaps to push past 90%.`,
    ], seed3));
  } else if (accuracyScore >= 50) {
    suggestions.push(pick([
      `Keep working (${accuracyScore}%). Break the verse in two halves — master each before combining.`,
      `${accuracyScore}% — needs more practice. Recite word by word with the Mushaf open.`,
      `Good start (${accuracyScore}%). Listen to the full verse 3 times, then try again slowly.`,
      `You've got part of it (${accuracyScore}%). Focus on the first half, then add the second.`,
      `${accuracyScore}% matched — your AI teacher can see progress. Keep the Mushaf open and recite with it.`,
    ], seed3));
  } else if (accuracyScore > 0) {
    suggestions.push(pick([
      `Score: ${accuracyScore}%. Listen to the Qari recite this verse 5 times, then follow along.`,
      `${accuracyScore}% — this verse needs more revision. Listen, repeat, listen, repeat.`,
      `Keep going (${accuracyScore}%). Open your Mushaf and read the verse aloud 10 times slowly.`,
      `${accuracyScore}% — مَن جَدَّ وَجَد — whoever strives will succeed. Practise more.`,
      `Only ${accuracyScore}% matched this time. Focus on the first 3 words first, then build from there.`,
    ], seed3));
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
    seedUsed: string;
    referenceNormalized: string;
    transcribedNormalized: string;
  };
}

export function analyzeRecitation(
  referenceText: string,
  transcribedText: string,
  attemptKey = "default"
): CorrectionResult {
  const refNormalized = normalizeArabic(referenceText);
  const transNormalized = transcribedText ? normalizeArabic(transcribedText) : "";

  if (!transcribedText || transcribedText.trim().length === 0) {
    const refWords = tokenize(referenceText);
    return {
      correctWords: [],
      incorrectWords: [],
      missingWords: refWords,
      accuracyScore: 0,
      wordStats: { total: refWords.length, correct: 0, missing: refWords.length, extra: 0 },
      suggestions: [
        "No Arabic speech was detected in your recording. Make sure you are in a quiet environment, speak clearly, and hold the microphone close.",
        "Tip: record for at least 2–3 seconds and speak each word distinctly.",
      ],
      analysisLog: {
        referenceWordCount: refWords.length,
        transcribedWordCount: 0,
        lcsLength: 0,
        errorPattern: "empty_transcription",
        seedUsed: buildSeed(referenceText, "", attemptKey),
        referenceNormalized: refNormalized.slice(0, 80),
        transcribedNormalized: "(empty)",
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

  const seedUsed = buildSeed(referenceText, transcribedText, attemptKey);

  const suggestions = buildSpecificFeedback(
    correctWords, missingWords, extraWords, accuracyScore,
    referenceText, transcribedText, attemptKey
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
      seedUsed,
      referenceNormalized: refNormalized.slice(0, 120),
      transcribedNormalized: transNormalized.slice(0, 120),
    },
  };
}
