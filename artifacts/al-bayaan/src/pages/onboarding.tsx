import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCompleteOnboarding, useGetProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Volume2, VolumeX } from "lucide-react";

const GOALS = [
  { id: "quran_reading", label: "Quran Reading", labelAr: "قراءة القرآن", icon: "📖", desc: "Learn to read and recite the Quran", dashboard: "/dashboard" },
  { id: "hifdh", label: "Hifdh Quran", labelAr: "حفظ القرآن", icon: "🧠", desc: "Memorize the Quran systematically", dashboard: "/hifdh" },
  { id: "tajweed", label: "Tajweed", labelAr: "تجويد القرآن", icon: "🎵", desc: "Master pronunciation rules", dashboard: "/tajweed-teacher" },
  { id: "hingaad", label: "Arabic Reading (Hingaad)", labelAr: "هنقاد", icon: "ا", desc: "Learn the Arabic alphabet from scratch", dashboard: "/library?category=hingaad" },
  { id: "arabic", label: "Arabic Language", labelAr: "اللغة العربية", icon: "🗣️", desc: "Learn Arabic language fully", dashboard: "/library?category=arabic" },
  { id: "fiqh", label: "Fiqh", labelAr: "الفقه الإسلامي", icon: "⚖️", desc: "Study Islamic jurisprudence", dashboard: "/library?category=fiqh" },
  { id: "aqeedah", label: "Aqeedah", labelAr: "علم العقيدة", icon: "🌙", desc: "Learn Islamic theology and creed", dashboard: "/library?category=aqeedah" },
  { id: "hadith", label: "Hadith", labelAr: "علوم الحديث", icon: "📜", desc: "Study prophetic traditions", dashboard: "/library?category=hadith" },
  { id: "tafsir", label: "Tafsir", labelAr: "تفسير القرآن", icon: "📚", desc: "Understand Quranic exegesis", dashboard: "/library?category=tafsir" },
  { id: "islamic_studies", label: "Islamic Studies", labelAr: "الدراسات الإسلامية", icon: "🕌", desc: "General Islamic knowledge", dashboard: "/dashboard" },
];

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Just starting — new to this subject", emoji: "🌱" },
  { id: "intermediate", label: "Intermediate", desc: "Some knowledge, building on it", emoji: "📈" },
  { id: "advanced", label: "Advanced", desc: "Solid foundation, seeking depth", emoji: "⭐" },
];

const TIMES = [5, 10, 15, 30, 60];

const QARIS = [
  { id: "Alafasy_128kbps", label: "Mishary Rashid Alafasy", country: "Kuwait" },
  { id: "Abdul_Basit_Murattal_192kbps", label: "Abdul Basit Abd us-Samad", country: "Egypt" },
  { id: "Husary_128kbps", label: "Mahmoud Khalil Al-Husary", country: "Egypt" },
  { id: "Sudais_192kbps", label: "Abdur-Rahman As-Sudais", country: "Saudi Arabia" },
  { id: "Minshawi_Murattal_128kbps", label: "Mohamed Siddiq Al-Minshawi", country: "Egypt" },
  { id: "Maher_AlMuaiqly_128kbps", label: "Maher Al Muaiqly", country: "Saudi Arabia" },
];

const STEP_VOICE_PROMPTS: Record<number, string> = {
  0: "Welcome to Al Bayaan! We are honored to accompany you on your Islamic learning journey. Let's personalize your experience together.",
  1: "What would you like to study? Please select all subjects that interest you. You can always add more later.",
  2: "What is your current level? Choose the option that best describes your knowledge in your selected subjects.",
  3: "Tell us your name and a little about yourself so we can personalize your experience.",
  4: "How many minutes can you dedicate to studying each day? Consistency is the key to real progress.",
  5: "Choose a Qari — a Quran reciter — whose voice you would like to follow and learn from.",
  6: "Almost done! Select your preferred language and teacher voice settings.",
};

function useSpeechGuide() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) ||
      voices.find(v => v.lang.startsWith("en-US")) || voices[0];
    if (preferred) utterance.voice = preferred;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => window.speechSynthesis?.cancel();

  useEffect(() => { return () => window.speechSynthesis?.cancel(); }, []);

  return { voiceEnabled, setVoiceEnabled, speak, stop };
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data: profile } = useGetProfile();
  const completeMutation = useCompleteOnboarding();
  const [step, setStep] = useState(0);
  const { voiceEnabled, setVoiceEnabled, speak, stop } = useSpeechGuide();

  const [formData, setFormData] = useState({
    displayName: "",
    learningGoals: [] as string[],
    level: "",
    ageGroup: "adult",
    dailyGoalMinutes: 15,
    preferredQari: "Alafasy_128kbps",
    language: "en",
    teacherPreference: "any",
  });

  // Speak prompt whenever step changes and voice is enabled
  useEffect(() => {
    if (voiceEnabled && STEP_VOICE_PROMPTS[step]) {
      setTimeout(() => speak(STEP_VOICE_PROMPTS[step]), 200);
    }
  }, [step, voiceEnabled]);

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleComplete = () => {
    stop();
    // Determine best dashboard route from primary goal
    const primaryGoal = formData.learningGoals[0];
    const goalData = GOALS.find(g => g.id === primaryGoal);
    const redirectTo = goalData?.dashboard ?? "/dashboard";

    completeMutation.mutate(
      { data: { ...formData, displayName: formData.displayName || profile?.displayName || "Student" } },
      { onSuccess: () => setLocation(redirectTo) }
    );
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return formData.learningGoals.length === 0;
      case 2: return !formData.level;
      default: return false;
    }
  };

  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[url('/images/geometric-pattern.png')] bg-cover bg-center flex flex-col">
      <div className="absolute inset-0 bg-[#fdfdfc]/92 backdrop-blur-sm z-0" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center px-1">
            <img src="/logo.svg" alt="Al Bayaan" className="h-7 w-auto" />
            <div className="flex items-center gap-3">
              {/* Voice Guide Toggle */}
              <button
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (next && STEP_VOICE_PROMPTS[step]) setTimeout(() => speak(STEP_VOICE_PROMPTS[step]), 100);
                  else stop();
                }}
                title={voiceEnabled ? "Mute AI voice guide" : "Enable AI voice guide"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  voiceEnabled ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-transparent text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                AI Voice Guide
              </button>
              {step > 0 && (
                <span className="text-sm font-medium text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  {step} / {totalSteps}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {step > 0 && (
            <div className="mb-5 px-1">
              <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          <Card className="border-emerald-100 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 md:p-10 min-h-[440px] flex flex-col"
                >
                  {/* ── Step 0: Welcome ── */}
                  {step === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
                      <div className="text-6xl mb-2">🕌</div>
                      <h1 className="text-4xl font-serif text-emerald-950 font-bold">Welcome to Al Bayaan</h1>
                      <h2 className="text-2xl text-emerald-700" style={{ fontFamily: "var(--font-arabic)" }}>أهلاً بكم في البيان</h2>
                      <p className="text-emerald-700 max-w-md leading-relaxed">
                        We're honored to accompany you on your Islamic learning journey. In a few steps, we'll create your personalized learning path.
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <Volume2 className="h-3.5 w-3.5" />
                        Enable the AI Voice Guide above for an interactive setup experience
                      </div>
                    </div>
                  )}

                  {/* ── Step 1: Goals ── */}
                  {step === 1 && (
                    <div className="flex-1 flex flex-col space-y-4">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">What do you want to study?</h2>
                        <p className="text-emerald-700 text-sm mt-1">Select all that apply — we'll build you a personalized learning path</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[340px] pr-1">
                        {GOALS.map((goal) => {
                          const selected = formData.learningGoals.includes(goal.id);
                          return (
                            <div
                              key={goal.id}
                              className={`flex items-center space-x-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                                selected ? "border-emerald-500 bg-emerald-50" : "border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/50"
                              }`}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                learningGoals: selected
                                  ? prev.learningGoals.filter(id => id !== goal.id)
                                  : [...prev.learningGoals, goal.id]
                              }))}
                            >
                              <Checkbox checked={selected} onCheckedChange={() => {}} className="shrink-0" />
                              <span className="text-xl shrink-0" style={goal.id === "hingaad" ? { fontFamily: "var(--font-arabic)", lineHeight: 1 } : {}}>{goal.icon}</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-emerald-950 text-sm leading-tight">{goal.label}</p>
                                <p className="text-xs text-emerald-600 mt-0.5">{goal.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Step 2: Level ── */}
                  {step === 2 && (
                    <div className="flex-1 flex flex-col space-y-5">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">What is your current level?</h2>
                        <p className="text-emerald-700 text-sm mt-1">For your selected subjects</p>
                      </div>
                      <RadioGroup value={formData.level} onValueChange={(val) => setFormData(prev => ({ ...prev, level: val }))} className="grid gap-4">
                        {LEVELS.map((level) => (
                          <div key={level.id} className="relative flex">
                            <RadioGroupItem value={level.id} id={level.id} className="peer sr-only" />
                            <Label htmlFor={level.id}
                              className="flex flex-1 items-center gap-4 p-4 rounded-xl border-2 border-emerald-100 bg-white hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 cursor-pointer transition-all">
                              <span className="text-3xl">{level.emoji}</span>
                              <div>
                                <span className="font-bold text-lg text-emerald-950">{level.label}</span>
                                <p className="text-emerald-700 text-sm mt-0.5">{level.desc}</p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* ── Step 3: About You ── */}
                  {step === 3 && (
                    <div className="flex-1 flex flex-col space-y-7">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">A bit about you</h2>
                      <div className="space-y-3">
                        <Label className="text-emerald-900 font-semibold">What should we call you?</Label>
                        <Input
                          placeholder={profile?.displayName || "Your name"}
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="h-12 border-emerald-200 focus-visible:ring-emerald-500 text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-emerald-900 font-semibold">Age Group</Label>
                        <RadioGroup value={formData.ageGroup} onValueChange={(val) => setFormData(prev => ({ ...prev, ageGroup: val }))} className="grid grid-cols-2 gap-3">
                          {[
                            { id: "child", label: "Child", sub: "Under 12" },
                            { id: "teen", label: "Teen", sub: "12–17" },
                            { id: "adult", label: "Adult", sub: "18–59" },
                            { id: "senior", label: "Senior", sub: "60+" },
                          ].map((age) => (
                            <div key={age.id} className="relative flex">
                              <RadioGroupItem value={age.id} id={`age-${age.id}`} className="peer sr-only" />
                              <Label htmlFor={`age-${age.id}`}
                                className="flex flex-1 flex-col justify-center items-center text-center p-3 rounded-xl border-2 border-emerald-100 hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 cursor-pointer transition-all">
                                <span className="font-semibold text-emerald-950">{age.label}</span>
                                <span className="text-xs text-muted-foreground">{age.sub}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  )}

                  {/* ── Step 4: Daily Goal ── */}
                  {step === 4 && (
                    <div className="flex-1 flex flex-col space-y-5">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">Set a daily study goal</h2>
                        <p className="text-emerald-700 text-sm mt-1">Consistency is the key. How many minutes can you dedicate each day?</p>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                        {TIMES.map((time) => (
                          <button
                            key={time}
                            onClick={() => setFormData(prev => ({ ...prev, dailyGoalMinutes: time }))}
                            className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                              formData.dailyGoalMinutes === time
                                ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                                : "border-emerald-100 hover:border-emerald-200 text-emerald-900"
                            }`}
                          >
                            <span className="text-2xl font-bold">{time}</span>
                            <span className="text-xs font-medium opacity-70 mt-0.5">min</span>
                          </button>
                        ))}
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mt-2">
                        <p className="text-emerald-800 text-sm font-medium">
                          {formData.dailyGoalMinutes < 10 ? "Even 5 minutes daily creates lasting habits. Start small, stay consistent." :
                           formData.dailyGoalMinutes <= 15 ? "A great starting goal. You'll see real progress within weeks." :
                           formData.dailyGoalMinutes <= 30 ? "Excellent commitment. This will accelerate your learning significantly." :
                           "Mashallah! A serious student. May Allah bless your dedication."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Step 5: Qari ── */}
                  {step === 5 && (
                    <div className="flex-1 flex flex-col space-y-4">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">Choose your preferred Qari</h2>
                        <p className="text-emerald-700 text-sm mt-1">You'll follow their recitation while learning. You can change this anytime.</p>
                      </div>
                      <div className="grid gap-2.5 overflow-y-auto max-h-[320px] pr-1">
                        {QARIS.map((qari) => (
                          <div
                            key={qari.id}
                            className={`flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                              formData.preferredQari === qari.id
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-emerald-100 hover:bg-emerald-50/50"
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, preferredQari: qari.id }))}
                          >
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {qari.label.split(" ").map(w => w[0]).slice(0, 2).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-emerald-950 text-sm">{qari.label}</p>
                              <p className="text-xs text-muted-foreground">{qari.country}</p>
                            </div>
                            {formData.preferredQari === qari.id && (
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Step 6: Preferences ── */}
                  {step === 6 && (
                    <div className="flex-1 flex flex-col space-y-7">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">Final preferences</h2>
                      <div className="space-y-4">
                        <Label className="text-emerald-900 font-semibold text-base">App Language</Label>
                        <div className="flex gap-3">
                          {[{id: "en", label: "English", sub: "English"}, {id: "ar", label: "العربية", sub: "Arabic"}, {id: "so", label: "Somali", sub: "Soomaali"}].map(lang => (
                            <button key={lang.id} onClick={() => setFormData(prev => ({ ...prev, language: lang.id }))}
                              className={`flex-1 py-3 px-3 rounded-xl border-2 font-medium transition-all text-sm ${
                                formData.language === lang.id ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-emerald-100 hover:border-emerald-200 text-emerald-700"
                              }`}>
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-emerald-900 font-semibold text-base">AI Teacher Voice Preference</Label>
                        <div className="flex gap-3">
                          {[{id: "male", label: "Male"}, {id: "female", label: "Female"}, {id: "any", label: "Any"}].map(pref => (
                            <button key={pref.id} onClick={() => setFormData(prev => ({ ...prev, teacherPreference: pref.id }))}
                              className={`flex-1 py-3 px-3 rounded-xl border-2 font-medium transition-all text-sm ${
                                formData.teacherPreference === pref.id ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-emerald-100 hover:border-emerald-200 text-emerald-700"
                              }`}>
                              {pref.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Summary */}
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Your Learning Path</p>
                        <p className="text-emerald-900 text-sm font-medium">
                          {formData.learningGoals.slice(0, 3).map(id => GOALS.find(g => g.id === id)?.label).filter(Boolean).join(" · ") || "Select your goals in step 1"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.level ? `${formData.level} level · ` : ""}{formData.dailyGoalMinutes} min/day
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-6 flex justify-between items-center border-t border-emerald-100 pt-5">
                    {step > 0 ? (
                      <Button variant="ghost" onClick={handleBack} className="text-emerald-700 hover:text-emerald-900">
                        ← Back
                      </Button>
                    ) : <div />}
                    <Button
                      onClick={handleNext}
                      disabled={isNextDisabled() || completeMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 rounded-full min-w-[140px]"
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : step === 0 ? "Begin →" : step === totalSteps ? "Complete Setup ✓" : "Continue →"}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
