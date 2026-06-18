import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Edit3, BookOpen, Clock, Star, Eye, Send,
  ClipboardList, Loader2, CheckCircle2, XCircle, GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  type: "mcq" | "short" | "recitation";
  text: string;
  options?: string[];
  answer?: string;
  marks: number;
}

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
  isPublished: boolean;
  createdAt: string;
}

const SUBJECTS = ["quran", "tajweed", "hifdh", "arabic", "tafsir", "fiqh", "aqeedah", "hadith"];
const TYPES = ["written", "oral", "mixed"];

function QuestionEditor({
  question, index, onChange, onDelete
}: {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  onDelete: () => void;
}) {
  const addOption = () => onChange({ ...question, options: [...(question.options ?? []), ""] });
  const updateOption = (i: number, v: string) => {
    const opts = [...(question.options ?? [])];
    opts[i] = v;
    onChange({ ...question, options: opts });
  };
  const removeOption = (i: number) => onChange({ ...question, options: (question.options ?? []).filter((_, idx) => idx !== i) });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-emerald-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
              {index + 1}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Select value={question.type} onValueChange={v => onChange({ ...question, type: v as Question["type"] })}>
                  <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="short">Short Answer</SelectItem>
                    <SelectItem value="recitation">Recitation</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number" min={1} max={50}
                  value={question.marks}
                  onChange={e => onChange({ ...question, marks: parseInt(e.target.value) || 1 })}
                  className="w-20 h-7 text-xs"
                  placeholder="Marks"
                />
              </div>
              <Input
                value={question.text}
                onChange={e => onChange({ ...question, text: e.target.value })}
                placeholder="Question text…"
                className="text-sm"
              />

              {question.type === "mcq" && (
                <div className="space-y-1.5 mt-2">
                  {(question.options ?? []).map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.answer === opt}
                        onChange={() => onChange({ ...question, answer: opt })}
                        className="accent-emerald-600 shrink-0"
                        title="Mark as correct answer"
                      />
                      <Input
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="h-7 text-xs flex-1"
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeOption(i)}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={addOption}>
                    <Plus className="h-3 w-3" /> Add Option
                  </Button>
                  {question.answer && (
                    <p className="text-[11px] text-emerald-600">✓ Correct: {question.answer}</p>
                  )}
                </div>
              )}

              {(question.type === "short" || question.type === "recitation") && (
                <Input
                  value={question.answer ?? ""}
                  onChange={e => onChange({ ...question, answer: e.target.value })}
                  placeholder="Expected answer (for auto-grading)…"
                  className="text-xs h-7"
                />
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ExamCard({ exam, onEdit, onPublish, onDelete }: {
  exam: Exam;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-emerald-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-emerald-950 truncate">{exam.title}</h3>
            {exam.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{exam.description}</p>}
          </div>
          <Badge className={`shrink-0 text-[10px] ${exam.isPublished ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-600 border-0"}`}>
            {exam.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.durationMinutes}m</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3" />{exam.totalMarks} marks</span>
          <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" />{exam.questions?.length ?? 0} Qs</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={onEdit}>
            <Edit3 className="h-3 w-3" /> Edit
          </Button>
          {!exam.isPublished && (
            <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 flex-1" onClick={onPublish}>
              <Send className="h-3 w-3" /> Publish
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function uid() { return Math.random().toString(36).slice(2, 10); }

export default function ExamBuilder() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const defaultExam = (): Partial<Exam> => ({
    title: "", description: "", type: "written", subject: "quran",
    totalMarks: 100, passingMarks: 60, durationMinutes: 30,
    questions: [],
  });

  const loadExams = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/exams", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        // Show ALL exams (published + drafts) for teacher
        const all = await fetch("/api/exams?all=true", { credentials: "include" });
        setExams(all.ok ? await all.json() : Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadExams(); }, []);

  const openNew = () => { setEditingExam(defaultExam()); setIsNew(true); };
  const openEdit = (exam: Exam) => { setEditingExam({ ...exam, questions: exam.questions ?? [] }); setIsNew(false); };

  const addQuestion = (type: Question["type"]) => {
    if (!editingExam) return;
    const q: Question = { id: uid(), type, text: "", marks: 5, options: type === "mcq" ? ["", "", "", ""] : undefined };
    setEditingExam(e => ({ ...e, questions: [...(e?.questions ?? []), q] }));
  };

  const updateQuestion = (idx: number, q: Question) => {
    if (!editingExam) return;
    const qs = [...(editingExam.questions ?? [])];
    qs[idx] = q;
    setEditingExam(e => ({ ...e, questions: qs }));
  };

  const deleteQuestion = (idx: number) => {
    if (!editingExam) return;
    setEditingExam(e => ({ ...e, questions: (e?.questions ?? []).filter((_, i) => i !== idx) }));
  };

  const autoCalcMarks = () => {
    const total = (editingExam?.questions ?? []).reduce((s, q) => s + (q.marks || 0), 0);
    if (total > 0) setEditingExam(e => ({ ...e, totalMarks: total, passingMarks: Math.round(total * 0.6) }));
  };

  const saveExam = async () => {
    if (!editingExam?.title?.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const url = isNew ? "/api/exams" : `/api/exams/${(editingExam as Exam).id}`;
      const r = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingExam),
      });
      if (r.ok) {
        toast({ title: isNew ? "Exam created!" : "Exam saved!" });
        setEditingExam(null);
        loadExams();
      } else {
        toast({ title: "Failed to save exam", variant: "destructive" });
      }
    } catch { toast({ title: "Error saving", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const publishExam = async (id: number) => {
    try {
      const r = await fetch(`/api/exams/${id}/publish`, { method: "PATCH", credentials: "include" });
      if (r.ok) { toast({ title: "Exam published! Students can now take it." }); loadExams(); }
    } catch { toast({ title: "Failed to publish", variant: "destructive" }); }
  };

  const deleteExam = async (id: number) => {
    if (!confirm("Delete this exam?")) return;
    try {
      const r = await fetch(`/api/exams/${id}`, { method: "DELETE", credentials: "include" });
      if (r.ok || r.status === 204) { toast({ title: "Exam deleted" }); loadExams(); }
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const totalQMarks = (editingExam?.questions ?? []).reduce((s, q) => s + (q.marks || 0), 0);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-emerald-950 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-emerald-600" /> Exam Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create, edit, and publish exams for your students</p>
          </div>
          <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="h-4 w-4" /> New Exam
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0,1,2].map(i => <div key={i} className="h-40 rounded-xl bg-emerald-50 animate-pulse" />)}
          </div>
        ) : exams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">No exams yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first exam for students</p>
              <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" /> Create First Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map(exam => (
              <ExamCard
                key={exam.id} exam={exam}
                onEdit={() => openEdit(exam)}
                onPublish={() => publishExam(exam.id)}
                onDelete={() => deleteExam(exam.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Exam Edit Dialog */}
      <Dialog open={!!editingExam} onOpenChange={open => !open && setEditingExam(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              {isNew ? "Create New Exam" : "Edit Exam"}
            </DialogTitle>
          </DialogHeader>

          {editingExam && (
            <div className="space-y-4">
              <Tabs defaultValue="details">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                  <TabsTrigger value="questions" className="flex-1">
                    Questions {editingExam.questions?.length ? `(${editingExam.questions.length})` : ""}
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-3 mt-3">
                  <div>
                    <Label className="text-xs">Title *</Label>
                    <Input value={editingExam.title ?? ""} onChange={e => setEditingExam(x => ({ ...x, title: e.target.value }))}
                      className="mt-1" placeholder="e.g., Surah Al-Fatiha Memorization Test" />
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={editingExam.description ?? ""} onChange={e => setEditingExam(x => ({ ...x, description: e.target.value }))}
                      className="mt-1 min-h-[60px] text-sm" placeholder="What will this exam test?" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Subject</Label>
                      <Select value={editingExam.subject ?? "quran"} onValueChange={v => setEditingExam(x => ({ ...x, subject: v }))}>
                        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={editingExam.type ?? "written"} onValueChange={v => setEditingExam(x => ({ ...x, type: v }))}>
                        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="questions" className="mt-3">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addQuestion("mcq")}>
                      <Plus className="h-3 w-3" /> MCQ
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addQuestion("short")}>
                      <Plus className="h-3 w-3" /> Short Answer
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addQuestion("recitation")}>
                      <Plus className="h-3 w-3" /> Recitation
                    </Button>
                    {(editingExam.questions?.length ?? 0) > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto text-emerald-600" onClick={autoCalcMarks}>
                        Auto-calc marks ({totalQMarks})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    <AnimatePresence>
                      {(editingExam.questions ?? []).map((q, i) => (
                        <QuestionEditor key={q.id} question={q} index={i}
                          onChange={updated => updateQuestion(i, updated)}
                          onDelete={() => deleteQuestion(i)} />
                      ))}
                    </AnimatePresence>
                    {(editingExam.questions?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">No questions yet — add some above</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-3 mt-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Duration (min)</Label>
                      <Input type="number" min={5} max={180}
                        value={editingExam.durationMinutes ?? 30}
                        onChange={e => setEditingExam(x => ({ ...x, durationMinutes: parseInt(e.target.value) || 30 }))}
                        className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Total Marks</Label>
                      <Input type="number" min={1}
                        value={editingExam.totalMarks ?? 100}
                        onChange={e => setEditingExam(x => ({ ...x, totalMarks: parseInt(e.target.value) || 100 }))}
                        className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Passing Marks</Label>
                      <Input type="number" min={1}
                        value={editingExam.passingMarks ?? 60}
                        onChange={e => setEditingExam(x => ({ ...x, passingMarks: parseInt(e.target.value) || 60 }))}
                        className="mt-1 h-9 text-sm" />
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-700 space-y-1">
                    <p>📋 <strong>{editingExam.questions?.length ?? 0}</strong> questions</p>
                    <p>⏱ <strong>{editingExam.durationMinutes ?? 30}</strong> minutes</p>
                    <p>✅ Pass at <strong>{editingExam.passingMarks ?? 60}</strong> / <strong>{editingExam.totalMarks ?? 100}</strong> marks ({Math.round(((editingExam.passingMarks ?? 60) / (editingExam.totalMarks ?? 100)) * 100)}%)</p>
                    <p>🤖 AI evaluation: enabled for all submission types</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setEditingExam(null)} className="flex-1">Cancel</Button>
                <Button onClick={saveExam} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Exam"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
