import { useState } from "react";
import { useLocation } from "wouter";
import { useCompleteOnboarding, useGetProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const GOALS = [
  { id: "quran_reading", label: "Quran Reading" },
  { id: "hifdh", label: "Memorization (Hifdh)" },
  { id: "tajweed", label: "Tajweed Rules" },
  { id: "tafsir", label: "Tafsir & Understanding" },
  { id: "arabic", label: "Arabic Language" },
];

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Just starting to learn the alphabet" },
  { id: "intermediate", label: "Intermediate", desc: "Can read slowly, learning Tajweed" },
  { id: "advanced", label: "Advanced", desc: "Fluent reader, focusing on perfection" },
];

const TIMES = [5, 10, 15, 30, 60];

const QARIS = [
  { id: "Mishary Alafasy", label: "Mishary Alafasy", image: "/logo.svg" },
  { id: "Abdul Basit", label: "Abdul Basit", image: "/logo.svg" },
  { id: "Mahmoud Khalil", label: "Mahmoud Khalil Al-Husary", image: "/logo.svg" },
  { id: "Sudais", label: "Abdur-Rahman As-Sudais", image: "/logo.svg" },
  { id: "Minshawi", label: "Muhammad Siddiq Al-Minshawi", image: "/logo.svg" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data: profile } = useGetProfile();
  const completeMutation = useCompleteOnboarding();
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    displayName: "",
    learningGoals: [] as string[],
    level: "",
    ageGroup: "adult",
    dailyGoalMinutes: 15,
    preferredQari: "Mishary Alafasy",
    language: "en",
    teacherPreference: "any",
  });

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else handleComplete();
  };

  const handleComplete = () => {
    completeMutation.mutate(
      { data: { ...formData, displayName: formData.displayName || profile?.displayName || "User" } },
      { onSuccess: () => setLocation("/dashboard") }
    );
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return formData.learningGoals.length === 0;
      case 2: return !formData.level;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc] bg-[url('/images/geometric-pattern.png')] bg-cover bg-center flex flex-col">
      <div className="absolute inset-0 bg-[#fdfdfc]/90 backdrop-blur-sm z-0"></div>
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex justify-between items-center px-4">
            <img src="/logo.svg" alt="Al Bayaan" className="h-8 w-auto" />
            {step > 0 && (
              <span className="text-sm font-medium text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Step {step} of 6
              </span>
            )}
          </div>

          <Card className="border-emerald-100 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 md:p-12 min-h-[400px] flex flex-col"
                >
                  {/* Step 0: Welcome */}
                  {step === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                      <h1 className="text-4xl font-serif text-emerald-950 font-bold">
                        Welcome to Al Bayaan
                      </h1>
                      <h2 className="text-3xl font-arabic text-emerald-800" style={{ fontFamily: "var(--font-arabic)" }}>
                        أهلاً بكم في البيان
                      </h2>
                      <p className="text-lg text-emerald-700 max-w-md mt-4">
                        We're honored to accompany you on your journey with the Quran. Let's personalize your experience.
                      </p>
                    </div>
                  )}

                  {/* Step 1: Goals */}
                  {step === 1 && (
                    <div className="flex-1 flex flex-col space-y-6">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">What do you want to achieve?</h2>
                      <p className="text-emerald-700 mb-4">Select all that apply</p>
                      <div className="grid gap-3">
                        {GOALS.map((goal) => (
                          <div 
                            key={goal.id}
                            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                              formData.learningGoals.includes(goal.id) 
                                ? "border-emerald-500 bg-emerald-50" 
                                : "border-emerald-100 hover:border-emerald-200"
                            }`}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                learningGoals: prev.learningGoals.includes(goal.id)
                                  ? prev.learningGoals.filter(id => id !== goal.id)
                                  : [...prev.learningGoals, goal.id]
                              }))
                            }}
                          >
                            <Checkbox 
                              checked={formData.learningGoals.includes(goal.id)} 
                              onCheckedChange={() => {}} // Handled by div click
                            />
                            <Label className="text-base font-medium cursor-pointer flex-1">{goal.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Level */}
                  {step === 2 && (
                    <div className="flex-1 flex flex-col space-y-6">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">What is your current level?</h2>
                      <RadioGroup 
                        value={formData.level} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, level: val }))}
                        className="grid gap-4"
                      >
                        {LEVELS.map((level) => (
                          <div key={level.id} className="relative flex">
                            <RadioGroupItem value={level.id} id={level.id} className="peer sr-only" />
                            <Label
                              htmlFor={level.id}
                              className="flex flex-1 flex-col p-4 rounded-xl border-2 border-emerald-100 bg-white hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 cursor-pointer transition-all"
                            >
                              <span className="font-semibold text-lg text-emerald-950">{level.label}</span>
                              <span className="text-emerald-700 mt-1">{level.desc}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Step 3: Age & Display Name */}
                  {step === 3 && (
                    <div className="flex-1 flex flex-col space-y-8">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">A bit about you</h2>
                      
                      <div className="space-y-3">
                        <Label className="text-emerald-900 font-semibold">What should we call you?</Label>
                        <Input 
                          placeholder={profile?.displayName || "Enter your name"}
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="h-12 border-emerald-200 focus-visible:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-emerald-900 font-semibold">Age Group</Label>
                        <RadioGroup 
                          value={formData.ageGroup} 
                          onValueChange={(val) => setFormData(prev => ({ ...prev, ageGroup: val }))}
                          className="grid grid-cols-2 gap-3"
                        >
                          {[
                            { id: "child", label: "Child (Under 12)" },
                            { id: "teen", label: "Teen (12-17)" },
                            { id: "adult", label: "Adult (18-59)" },
                            { id: "senior", label: "Senior (60+)" },
                          ].map((age) => (
                            <div key={age.id} className="relative flex">
                              <RadioGroupItem value={age.id} id={`age-${age.id}`} className="peer sr-only" />
                              <Label
                                htmlFor={`age-${age.id}`}
                                className="flex flex-1 justify-center items-center text-center p-3 rounded-xl border-2 border-emerald-100 hover:bg-emerald-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 cursor-pointer transition-all font-medium text-emerald-900"
                              >
                                {age.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Time Commitment */}
                  {step === 4 && (
                    <div className="flex-1 flex flex-col space-y-6">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">Set a daily goal</h2>
                      <p className="text-emerald-700">Consistency is key. How many minutes can you dedicate daily?</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                        {TIMES.map((time) => (
                          <button
                            key={time}
                            onClick={() => setFormData(prev => ({ ...prev, dailyGoalMinutes: time }))}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                              formData.dailyGoalMinutes === time
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-emerald-100 hover:border-emerald-200 text-emerald-900"
                            }`}
                          >
                            <span className="text-3xl font-bold">{time}</span>
                            <span className="text-sm font-medium opacity-80">mins</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 5: Preferred Qari */}
                  {step === 5 && (
                    <div className="flex-1 flex flex-col space-y-6">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">Choose a default Reciter (Qari)</h2>
                      <p className="text-emerald-700">You can always change this later in settings.</p>
                      
                      <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2">
                        {QARIS.map((qari) => (
                          <div 
                            key={qari.id}
                            className={`flex items-center space-x-4 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              formData.preferredQari === qari.id 
                                ? "border-emerald-500 bg-emerald-50" 
                                : "border-emerald-100 hover:bg-emerald-50/50"
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, preferredQari: qari.id }))}
                          >
                            <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center overflow-hidden">
                              <img src={qari.image} alt={qari.label} className="h-6 w-auto opacity-50" />
                            </div>
                            <span className="font-medium text-emerald-950 flex-1">{qari.label}</span>
                            {formData.preferredQari === qari.id && (
                              <div className="h-3 w-3 rounded-full bg-emerald-600"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 6: Preferences */}
                  {step === 6 && (
                    <div className="flex-1 flex flex-col space-y-8">
                      <h2 className="text-2xl font-serif font-bold text-emerald-950">Final touches</h2>
                      
                      <div className="space-y-4">
                        <Label className="text-emerald-900 font-semibold text-lg">App Language</Label>
                        <div className="flex gap-3">
                          {[{id: 'en', label: 'English'}, {id: 'ar', label: 'العربية'}, {id: 'so', label: 'Somali'}].map(lang => (
                            <button
                              key={lang.id}
                              onClick={() => setFormData(prev => ({ ...prev, language: lang.id }))}
                              className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                                formData.language === lang.id
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : "border-emerald-100 hover:border-emerald-200 text-emerald-700"
                              }`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-emerald-900 font-semibold text-lg">Teacher Voice Preference</Label>
                        <p className="text-sm text-emerald-700 -mt-2">For AI feedback and instructions</p>
                        <div className="flex gap-3">
                          {[{id: 'male', label: 'Male'}, {id: 'female', label: 'Female'}, {id: 'any', label: 'Any'}].map(pref => (
                            <button
                              key={pref.id}
                              onClick={() => setFormData(prev => ({ ...prev, teacherPreference: pref.id }))}
                              className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                                formData.teacherPreference === pref.id
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : "border-emerald-100 hover:border-emerald-200 text-emerald-700"
                              }`}
                            >
                              {pref.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-end border-t border-emerald-100 pt-6">
                    <Button 
                      onClick={handleNext} 
                      disabled={isNextDisabled() || completeMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-lg rounded-full w-full sm:w-auto"
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : step === 0 ? (
                        "Begin"
                      ) : step === 6 ? (
                        "Complete Setup"
                      ) : (
                        "Continue"
                      )}
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
