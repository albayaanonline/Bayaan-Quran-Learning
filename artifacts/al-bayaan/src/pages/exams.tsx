import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, Star, ClipboardList, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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
    quran: "bg-emerald-100 text-emerald-700",
    tajweed: "bg-amber-100 text-amber-700",
    hifdh: "bg-purple-100 text-purple-700",
    arabic: "bg-blue-100 text-blue-700",
    fiqh: "bg-orange-100 text-orange-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[subject] ?? "bg-gray-100 text-gray-700"}`}>{subject}</span>;
}

function ExamCard({ exam, onStart }: { exam: Exam; onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-emerald-100 hover:shadow-md transition-shadow cursor-pointer" onClick={onStart}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-emerald-950 truncate">{exam.title}</h3>
              {exam.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{exam.description}</p>}
            </div>
            <SubjectBadge subject={exam.subject} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.durationMinutes} min</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{exam.totalMarks} marks</span>
            <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />{exam.questions?.length ?? 0} questions</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Pass: {exam.passingMarks}/{exam.totalMarks}</span>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-3">Start Exam</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResultView({ result, exam, evaluation, onBack }: { result: ExamResult; exam: Exam; evaluation: string; onBack: () => void }) {
  const percentage = result.percentage ?? Math.round((result.score / result.totalMarks) * 100);
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Exams</Button>
      <Card className={`border-2 ${result.passed ? "border-emerald-400 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
        <CardContent className="p-6 text-center">
          {result.passed
            ? <CheckCircle2 className="h-16 w-16 text-emerald-600 mx-auto mb-3" />
            : <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
          }
          <h2 className="text-2xl font-bold mb-1">{result.passed ? "Passed! 🎉" : "Try Again"}</h2>
          <p className="text-4xl font-bold text-emerald-900 mt-2">{percentage}%</p>
          <p className="text-muted-foreground text-sm mt-1">{result.score}/{result.totalMarks} marks</p>
          <Progress value={percentage} className="mt-4 h-3" />
        </CardContent>
      </Card>

      {evaluation && (
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" />AI Evaluation</CardTitle>
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
    fetch("/api/exams", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setExams(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeExam || result) return;
    setTimeLeft(activeExam.durationMinutes * 60);
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(timerRef.current!); handleSubmit(); return 0; }
      return t - 1;
    }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeExam, result]);

  const startExam = async (exam: Exam) => {
    try {
      const r = await fetch(`/api/exams/${exam.id}/start`, { method: "POST", credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setResultId(data.id);
        setActiveExam(exam);
        setAnswers({});
        setResult(null);
        setEvaluation("");
      }
    } catch { toast({ title: "Failed to start exam", variant: "destructive" }); }
  };

  const handleSubmit = async () => {
    if (!activeExam || !resultId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const r = await fetch(`/api/exams/${activeExam.id}/submit`, {
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
    } catch { toast({ title: "Failed to submit", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const fetchEvaluation = async () => {
    if (!activeExam) return;
    setEvaluating(true);
    try {
      const r = await fetch(`/api/exams/${activeExam.id}/evaluate`, {
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
            <h2 className="font-serif font-bold text-lg text-emerald-950">{activeExam.title}</h2>
            <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-lg ${timeLeft < 120 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              <Clock className="h-4 w-4" /> {mins}:{String(secs).padStart(2, "0")}
            </div>
          </div>
          <Progress value={(answered / Math.max(questions.length, 1)) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">{answered}/{questions.length} answered</p>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card key={q.id} className="border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full h-5 w-5 flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium">{q.text}</p>
                    <Badge variant="outline" className="ml-auto shrink-0 text-xs">{q.marks}m</Badge>
                  </div>
                  {q.type === "mcq" && q.options ? (
                    <div className="space-y-2 pl-7">
                      {q.options.map((opt, j) => (
                        <label key={j} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                            onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                            className="accent-emerald-600" />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[q.id] ?? ""}
                      onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      placeholder="Write your answer here..."
                      className="mt-2 text-sm min-h-[80px]"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setActiveExam(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : "Submit Exam"}
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
          <h1 className="text-2xl font-serif font-bold text-emerald-950 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" /> Exam Centre
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Test your knowledge with Quran, Tajweed, and Islamic studies exams</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : exams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">No exams available yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Your teacher will publish exams here for you to take</p>
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
