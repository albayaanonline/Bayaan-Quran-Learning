import { useState } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, BookOpen, ClipboardList, PenSquare, Brain, Download, Copy, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type ContentType = "lesson" | "quiz" | "exam" | "homework";
type Subject = "quran" | "tajweed" | "arabic" | "fiqh" | "tafsir" | "hifdh";
type Level = "beginner" | "intermediate" | "advanced";

const SUBJECTS: { value: Subject; label: string; emoji: string }[] = [
  { value: "quran", label: "Quran", emoji: "📖" },
  { value: "tajweed", label: "Tajweed", emoji: "🎵" },
  { value: "arabic", label: "Arabic", emoji: "🌙" },
  { value: "fiqh", label: "Fiqh", emoji: "⚖️" },
  { value: "tafsir", label: "Tafsir", emoji: "✨" },
  { value: "hifdh", label: "Hifdh", emoji: "🧠" },
];

const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function GeneratorPanel({
  type, icon, title, desc, color,
}: { type: ContentType; icon: React.ReactNode; title: string; desc: string; color: string }) {
  const { toast } = useToast();
  const [subject, setSubject] = useState<Subject>("quran");
  const [level, setLevel] = useState<Level>("beginner");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter a topic to generate content.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const r = await authFetch("/api/content-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, level, topic, count: parseInt(count) }),
      });
      if (!r.ok) throw new Error();

      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

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
            if (d.done) break;
            if (d.content) { full += d.content; setResult(full); }
          } catch {}
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate content. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copied!", description: "Content copied to clipboard." });
  };

  const downloadAsText = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${subject}-${topic.slice(0, 20).replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-start gap-3 p-4 rounded-xl bg-${color}-50 border border-${color}-100`}>
        <div className={`h-10 w-10 rounded-xl bg-${color}-100 text-${color}-700 flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Select value={subject} onValueChange={v => setSubject(v as Subject)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Level</Label>
          <Select value={level} onValueChange={v => setLevel(v as Level)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Topic / Instruction</Label>
        <Input
          placeholder={
            type === "lesson" ? "e.g. Introduction to Makharij al-Huruf" :
            type === "quiz" ? "e.g. Rules of Noon Sakinah" :
            type === "exam" ? "e.g. Tajweed rules comprehensive exam" :
            "e.g. Practice exercises for Ikhfa"
          }
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
      </div>

      {(type === "quiz" || type === "exam") && (
        <div className="space-y-1.5">
          <Label>Number of questions</Label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["3", "5", "10", "15", "20"].map(n => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={generate} disabled={loading} className={`w-full bg-${color}-600 hover:bg-${color}-700 text-white`}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate with AI</>}
      </Button>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Generated Content</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setResult(""); setTopic(""); }}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadAsText}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">{result}</pre>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContentGenerator() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-700" />
            AI Content Generator
            <Badge className="bg-blue-700 text-white border-0">AI</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Generate lessons, quizzes, exams and homework with AI — for any Islamic subject</p>
        </div>

        <Tabs defaultValue="lesson">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="lesson"><BookOpen className="h-4 w-4 mr-1.5" />Lesson</TabsTrigger>
            <TabsTrigger value="quiz"><Brain className="h-4 w-4 mr-1.5" />Quiz</TabsTrigger>
            <TabsTrigger value="exam"><ClipboardList className="h-4 w-4 mr-1.5" />Exam</TabsTrigger>
            <TabsTrigger value="homework"><PenSquare className="h-4 w-4 mr-1.5" />Homework</TabsTrigger>
          </TabsList>

          <TabsContent value="lesson" className="mt-4">
            <GeneratorPanel type="lesson" icon={<BookOpen className="h-5 w-5" />} title="AI Lesson Generator"
              desc="Generate structured lesson plans with objectives, content, activities and assessments"
              color="emerald" />
          </TabsContent>
          <TabsContent value="quiz" className="mt-4">
            <GeneratorPanel type="quiz" icon={<Brain className="h-5 w-5" />} title="AI Quiz Generator"
              desc="Generate MCQ, fill-in-the-blank, and voice quiz questions with answer keys"
              color="blue" />
          </TabsContent>
          <TabsContent value="exam" className="mt-4">
            <GeneratorPanel type="exam" icon={<ClipboardList className="h-5 w-5" />} title="AI Exam Generator"
              desc="Generate complete exams with marking schemes, grading rubrics and model answers"
              color="purple" />
          </TabsContent>
          <TabsContent value="homework" className="mt-4">
            <GeneratorPanel type="homework" icon={<PenSquare className="h-5 w-5" />} title="AI Homework Generator"
              desc="Generate practice assignments and exercises tailored to student level"
              color="amber" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
