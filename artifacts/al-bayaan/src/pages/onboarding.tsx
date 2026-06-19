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
import { useI18n } from "@/lib/i18n";

const GOALS = [
  { id: "quran_reading", labelKey: "Akhrista Quraanka", labelAr: "قراءة القرآن", icon: "📖", descKey: "Barasho akhrisidda iyo tilmaamidda Quraanka", dashboard: "/dashboard" },
  { id: "hifdh", labelKey: "Xafidka Quraanka", labelAr: "حفظ القرآن", icon: "🧠", descKey: "Xafid Quraanka si nidaamsan", dashboard: "/hifdh" },
  { id: "tajweed", labelKey: "Tajwiid", labelAr: "تجويد القرآن", icon: "🎵", descKey: "Qaadashada xeerarka dhawaaqa", dashboard: "/tajweed-teacher" },
  { id: "hingaad", labelKey: "Akhrista Carabi (Hingaad)", labelAr: "هنقاد", icon: "ا", descKey: "Barasho xarfaha Carabiga bilowga", dashboard: "/library?category=hingaad" },
  { id: "arabic", labelKey: "Luqadda Carabiga", labelAr: "اللغة العربية", icon: "🗣️", descKey: "Barasho Carabiga si buuxda", dashboard: "/library?category=arabic" },
  { id: "fiqh", labelKey: "Fiqhka", labelAr: "الفقه الإسلامي", icon: "⚖️", descKey: "Daraasad xeerarka Islaamiga", dashboard: "/library?category=fiqh" },
  { id: "aqeedah", labelKey: "Caqiidada", labelAr: "علم العقيدة", icon: "🌙", descKey: "Barasho cilmiga Islaamiga iyo caqiidada", dashboard: "/library?category=aqeedah" },
  { id: "hadith", labelKey: "Xadiis", labelAr: "علوم الحديث", icon: "📜", descKey: "Daraasad sunnaadda Nabi (s.a.w)", dashboard: "/library?category=hadith" },
  { id: "tafsir", labelKey: "Tafsiirka", labelAr: "تفسير القرآن", icon: "📚", descKey: "Faham sharaxaadda Quraanka", dashboard: "/library?category=tafsir" },
  { id: "islamic_studies", labelKey: "Barashada Islaamiga", labelAr: "الدراسات الإسلامية", icon: "🕌", descKey: "Aqoon guud Islaamiga", dashboard: "/dashboard" },
];

const QARIS = [
  { id: "Alafasy_128kbps", label: "Mishary Rashid Alafasy", country: "Kuwait" },
  { id: "Abdul_Basit_Murattal_192kbps", label: "Abdul Basit Abd us-Samad", country: "Masar" },
  { id: "Husary_128kbps", label: "Mahmoud Khalil Al-Husary", country: "Masar" },
  { id: "Sudais_192kbps", label: "Abdur-Rahman As-Sudais", country: "Sacuudiga" },
  { id: "Minshawi_Murattal_128kbps", label: "Mohamed Siddiq Al-Minshawi", country: "Masar" },
  { id: "Maher_AlMuaiqly_128kbps", label: "Maher Al Muaiqly", country: "Sacuudiga" },
];

const TIMES = [5, 10, 15, 30, 60];

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
    const preferred = voices.find(v => v.lang.startsWith("so")) ||
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
  const { t, setLocale, locale } = useI18n();
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
    language: "so",
    teacherPreference: "any",
  });

  const STEP_VOICE_PROMPTS: Record<number, string> = {
    0: t("onboard.subtitle"),
    1: t("onboard.step.goalsSub"),
    2: t("onboard.step.levelSub"),
    3: t("onboard.step.about"),
    4: t("onboard.step.goalSetSub"),
    5: t("onboard.step.qariSub"),
    6: t("onboard.step.prefs"),
  };

  useEffect(() => {
    if (voiceEnabled && STEP_VOICE_PROMPTS[step]) {
      setTimeout(() => speak(STEP_VOICE_PROMPTS[step]), 200);
    }
  }, [step, voiceEnabled]);

  const totalSteps = 6;
  const handleNext = () => { if (step < totalSteps) setStep(step + 1); else handleComplete(); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleComplete = () => {
    stop();
    const primaryGoal = formData.learningGoals[0];
    const goalData = GOALS.find(g => g.id === primaryGoal);
    const redirectTo = goalData?.dashboard ?? "/dashboard";
    // Apply language selection
    if (formData.language === "so" || formData.language === "ar" || formData.language === "en") {
      setLocale(formData.language as "so" | "ar" | "en");
    }
    completeMutation.mutate(
      { data: { ...formData, displayName: formData.displayName || profile?.displayName || "Arday" } },
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

  const LEVELS = [
    { id: "beginner", label: t("onboard.level.beginner"), desc: t("onboard.level.beginnerD"), emoji: "🌱" },
    { id: "intermediate", label: t("onboard.level.inter"), desc: t("onboard.level.interD"), emoji: "📈" },
    { id: "advanced", label: t("onboard.level.adv"), desc: t("onboard.level.advD"), emoji: "⭐" },
  ];

  const AGE_GROUPS = [
    { id: "child", label: t("onboard.age.child"), sub: t("onboard.age.childSub") },
    { id: "teen", label: t("onboard.age.teen"), sub: t("onboard.age.teenSub") },
    { id: "adult", label: t("onboard.age.adult"), sub: t("onboard.age.adultSub") },
    { id: "senior", label: t("onboard.age.senior"), sub: t("onboard.age.seniorSub") },
  ];

  const LANGS = [
    { id: "so", label: "Soomaali" },
    { id: "ar", label: "العربية" },
    { id: "en", label: "English" },
  ];

  const VOICE_PREFS = [
    { id: "male", label: t("onboard.voice.male") },
    { id: "female", label: t("onboard.voice.female") },
    { id: "any", label: t("onboard.voice.any") },
  ];

  const DAILY_TIPS: Record<number, string> = {
    5: locale === "so" ? "Xataa 5 daqiiqadood maalin kasta ayaa caado waara abuura. Ku bilow yar, joogso." :
       locale === "ar" ? "حتى 5 دقائق يومياً تصنع عادة راسخة. ابدأ صغيراً وكن منتظماً." :
       "Even 5 minutes daily creates lasting habits. Start small, stay consistent.",
    10: locale === "so" ? "Bartilmaameed aad u wanaagsan. Todobaadooyin gudahood horumar dhab ah ayaad arki doontaa." :
        locale === "ar" ? "هدف رائع. ستشهد تقدماً حقيقياً في غضون أسابيع." :
        "A great starting goal. You'll see real progress within weeks.",
    15: locale === "so" ? "Ballan-qaad aad u fiican. Tan ayaa si wayn u dedejin doonta barashaddaada." :
        locale === "ar" ? "التزام ممتاز. سيسرّع تعلمك بشكل كبير." :
        "Excellent commitment. This will accelerate your learning significantly.",
    30: locale === "so" ? "Aad ayay u fiicantahay! Waqti dheeraad ah, horumar dheeraad ah." :
        locale === "ar" ? "ممتاز! سيسرّع تعلمك بشكل كبير جداً." :
        "Excellent! This will greatly accelerate your learning.",
    60: locale === "so" ? "Mashaa Allaah! Arday halis ah. Alle ha barako dadaalkaa." :
        locale === "ar" ? "ماشاء الله! طالب جاد. بارك الله في تفانيك." :
        "Mashallah! A serious student. May Allah bless your dedication.",
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[url('/images/geometric-pattern.png')] bg-cover bg-center flex flex-col">
      <div className="absolute inset-0 bg-[#fdfdfc]/92 backdrop-blur-sm z-0" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center px-1">
            <img src="/logo.svg" alt="Al Bayaan" className="h-7 w-auto" />
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (next && STEP_VOICE_PROMPTS[step]) setTimeout(() => speak(STEP_VOICE_PROMPTS[step]), 100);
                  else stop();
                }}
                title={voiceEnabled ? t("onboard.muteGuide") : t("onboard.enableGuide")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  voiceEnabled ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-transparent text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                {t("onboard.voiceGuide")}
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
                      <h1 className="text-4xl font-serif text-emerald-950 font-bold">{t("onboard.welcome")}</h1>
                      <h2 className="text-2xl text-emerald-700" style={{ fontFamily: "var(--font-arabic)" }}>أهلاً بكم في البيان</h2>
                      <p className="text-emerald-700 max-w-md leading-relaxed">{t("onboard.subtitle")}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <Volume2 className="h-3.5 w-3.5" />
                        {t("onboard.enableHint")}
                      </div>
                    </div>
                  )}

                  {/* ── Step 1: Goals ── */}
                  {step === 1 && (
                    <div className="flex-1 flex flex-col space-y-4">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">{t("onboard.step.goals")}</h2>
                        <p className="text-emerald-700 text-sm mt-1">{t("onboard.step.goalsSub")}</p>
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
                                <p className="font-semibold text-emerald-950 text-sm leading-tight">{goal.labelKey}</p>
                                <p className="text-xs text-emerald-600 mt-0.5">{goal.descKey}</p>
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
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">{t("onboard.step.level")}</h2>
                        <p className="text-emerald-700 text-sm mt-1">{t("onboard.step.levelSub")}</p>
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
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">{t("onboard.step.about")}</h2>
                      <div className="space-y-3">
                        <Label className="text-emerald-900 font-semibold">{t("onboard.step.name")}</Label>
                        <Input
                          placeholder={profile?.displayName || t("onboard.step.namePh")}
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="h-12 border-emerald-200 focus-visible:ring-emerald-500 text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-emerald-900 font-semibold">{t("onboard.step.ageGroup")}</Label>
                        <RadioGroup value={formData.ageGroup} onValueChange={(val) => setFormData(prev => ({ ...prev, ageGroup: val }))} className="grid grid-cols-2 gap-3">
                          {AGE_GROUPS.map((age) => (
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
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">{t("onboard.step.goalSet")}</h2>
                        <p className="text-emerald-700 text-sm mt-1">{t("onboard.step.goalSetSub")}</p>
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
                            <span className="text-xs font-medium opacity-70 mt-0.5">{t("general.min")}</span>
                          </button>
                        ))}
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mt-2">
                        <p className="text-emerald-800 text-sm font-medium">
                          {DAILY_TIPS[formData.dailyGoalMinutes] ?? DAILY_TIPS[60]}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Step 5: Qari ── */}
                  {step === 5 && (
                    <div className="flex-1 flex flex-col space-y-4">
                      <div>
                        <h2 className="text-2xl font-serif font-bold text-emerald-950">{t("onboard.step.qari")}</h2>
                        <p className="text-emerald-700 text-sm mt-1">{t("onboard.step.qariSub")}</p>
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
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">{t("onboard.step.prefs")}</h2>
                      <div className="space-y-4">
                        <Label className="text-emerald-900 font-semibold text-base">{t("onboard.step.language")}</Label>
                        <div className="flex gap-3">
                          {LANGS.map(lang => (
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
                        <Label className="text-emerald-900 font-semibold text-base">{t("onboard.step.voice")}</Label>
                        <div className="flex gap-3">
                          {VOICE_PREFS.map(pref => (
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
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">{t("onboard.step.summary")}</p>
                        <p className="text-emerald-900 text-sm font-medium">
                          {formData.learningGoals.slice(0, 3).map(id => GOALS.find(g => g.id === id)?.labelKey).filter(Boolean).join(" · ") || t("onboard.goal.selectStep1")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.level ? `${t(`onboard.level.${formData.level === "beginner" ? "beginner" : formData.level === "intermediate" ? "inter" : "adv"}`)} · ` : ""}
                          {formData.dailyGoalMinutes} {t("general.minutes")} / {locale === "so" ? "maalin" : locale === "ar" ? "يوم" : "day"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Navigation ── */}
                  <div className="flex justify-between mt-8 pt-4 border-t border-emerald-100">
                    {step > 0 ? (
                      <Button variant="ghost" onClick={handleBack} className="text-emerald-700">{t("general.back")}</Button>
                    ) : <div />}
                    <Button
                      onClick={handleNext}
                      disabled={isNextDisabled() || completeMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                    >
                      {completeMutation.isPending
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("general.loading")}</>
                        : step === 0 ? t("general.start")
                        : step === totalSteps ? t("onboard.step.complete")
                        : t("general.next")}
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
