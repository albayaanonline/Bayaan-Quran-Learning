import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, Star, ClipboardList, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface Exam {
  id: number;
  title: string;
  description: string;
  type: string;
  subject: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  type: "mcq" | "short" | "recitation";
  options?: string[];
  marks: number;
}

interface ExamResult {
  id: number;
  examId: number;
  score: number;
  totalMarks: number;
  passed: boolean;
  percentage: number;
  feedback: Array<{ questionId: string; correct: boolean; correctAnswer: string }>;
}

function SubjectBadge({ subject }: { subject: string }) {
  const colors: Record<string, string> = {
    quran: "bg-blue-100 text-blue-800",
    tajweed: "bg-amber-100 text-amber-700",
    hifdh: "bg-purple-100 text-purple-700",
    arabic: "bg-blue-100 text-blue-700",
    fiqh: "bg-orange-100 text-orange-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[subject] ?? "bg-gray-100 text-gray-700"}`}>{subject}</span>;
}

function ExamCard({ exam, onStart }: { exam: Exam; onStart: () => void }) {
  const { t } = useI18n();
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-blue-100 hover:shadow-md transition-shadow cursor-pointer" onClick={onStart}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{exam.title}</h3>
              {exam.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{exam.description}</p>}
            </div>
            <SubjectBadge subject={exam.subject} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.durationMinutes} {t("exams.min")}</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{exam.totalMarks} {t("exams.marks")}</span>
            <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />{exam.questions?.length ?? 0} {t("exams.questions")}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{t("exams.pass")}: {exam.passingMarks}/{exam.totalMarks}</span>
            <Button size="sm" className="bg-blue-700 hover:bg-blue-700 h-7 text-xs px-3">{t("exams.startExam")}</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResultView({ result, exam, evaluation, onBack }: { result: ExamResult; exam: Exam; evaluation: string; onBack: () => void }) {
  const { t } = useI18n();
  const percentage = result.percentage ?? Math.round((result.score / result.totalMarks) * 100);
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> {t("exams.backToExams")}</Button>
      <Card className={`border-2 ${result.passed ? "border-blue-400 bg-blue-50" : "border-red-300 bg-red-50"}`}>
        <CardContent className="p-6 text-center">
          {result.passed
            ? <CheckCircle2 className="h-16 w-16 text-blue-700 mx-auto mb-3" />
            : <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
          }
          <h2 className="text-2xl font-bold mb-1">{result.passed ? t("exams.passed") : t("exams.tryAgain")}</h2>
          <p className="text-4xl font-bold text-blue-950 mt-2">{percentage}%</p>
          <p className="text-muted-foreground text-sm mt-1">{result.score}/{result.totalMarks} {t("exams.marks")}</p>
          <Progress value={percentage} className="mt-4 h-3" />
        </CardContent>
      </Card>

      {evaluation && (
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-700" />{t("exams.aiEvaluation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">{evaluation}</p>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Exams() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [resultId, setResultId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [evaluation, setEvaluation] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
    fetch(`${basePath}/api/exams`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setExams(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeExam || result) return;
    setTimeLeft(activeExam.durationMinutes * 60);
    timerRef.current = setInterval(() => setTimeLeft(tv => {
      if (tv <= 1) { clearInterval(timerRef.current!); handleSubmit(); return 0; }
      return tv - 1;
    }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeExam, result]);

  const startExam = async (exam: Exam) => {
    try {
      const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const r = await fetch(`${basePath}/api/exams/${exam.id}/start`, { method: "POST", credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setResultId(data.id);
        setActiveExam(exam);
        setAnswers({});
        setResult(null);
        setEvaluation("");
      }
    } catch { toast({ title: t("exams.failStart"), variant: "destructive" }); }
  };

  const handleSubmit = async () => {
    if (!activeExam || !resultId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const r = await fetch(`${basePath}/api/exams/${activeExam.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resultId, answers }),
      });
      if (r.ok) {
        const data = await r.json();
        setResult(data);
        fetchEvaluation();
      }
    } catch { toast({ title: t("exams.failSubmit"), variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const fetchEvaluation = async () => {
    if (!activeExam) return;
    setEvaluating(true);
    try {
      const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const r = await fetch(`${basePath}/api/exams/${activeExam.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers }),
      });
      if (!r.ok) return;
      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.content) setEvaluation(e => e + d.content);
          } catch {}
        }
      }
    } catch {} finally { setEvaluating(false); }
  };

  if (result && activeExam) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <ResultView result={result} exam={activeExam} evaluation={evaluation} onBack={() => { setActiveExam(null); setResult(null); }} />
        </div>
      </AppLayout>
    );
  }

  if (activeExam) {
    const questions = activeExam.questions ?? [];
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const answered = Object.keys(answers).filter(k => answers[k]?.trim()).length;

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-slate-900">{activeExam.title}</h2>
            <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-lg ${timeLeft < 120 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"}`}>
              <Clock className="h-4 w-4" /> {mins}:{String(secs).padStart(2, "0")}
            </div>
          </div>
          <Progress value={(answered / Math.max(questions.length, 1)) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">{answered}/{questions.length} {t("exams.answered")}</p>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card key={q.id} className="border-blue-100">
                <CardContent className="p-4">
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium">{q.text}</p>
                    <Badge variant="outline" className="ml-auto shrink-0 text-xs">{q.marks}{t("exams.marks")}</Badge>
                  </div>
                  {q.type === "mcq" && q.options ? (
                    <div className="space-y-2 pl-7">
                      {q.options.map((opt, j) => (
                        <label key={j} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                            onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                            className="accent-blue-600" />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      placeholder={t("exams.writeAnswer")}
                      className="mt-2 text-sm min-h-[80px]"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setActiveExam(null); }}>{t("exams.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-700 hover:bg-blue-700 flex-1">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("exams.submitting")}</> : t("exams.submitExam")}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-700" /> {t("exams.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("exams.subtitle")}</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : exams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">{t("exams.noExams")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("exams.noExamsSub")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {exams.map(exam => (
              <ExamCard key={exam.id} exam={exam} onStart={() => startExam(exam)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
