import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, Video, Plus, BookOpen, ExternalLink, Loader2, CheckCircle2, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ClassSession {
  id: string;
  title: string;
  teacher: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  maxStudents: number;
  enrolledCount: number;
  meetingUrl?: string;
  status: "upcoming" | "live" | "completed";
  description?: string;
}

interface NewClass {
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  maxStudents: string;
  description: string;
  platform: "zoom" | "google_meet" | "jitsi";
}

const SUBJECTS = ["Quran Recitation", "Tajweed", "Hifdh", "Arabic Language", "Islamic Studies", "Tafseer", "Hadith", "Fiqh"];

const SAMPLE_CLASSES: ClassSession[] = [
  {
    id: "c1",
    title: "Tajweed Fundamentals — Makharij",
    teacher: "Sheikh Ahmad",
    subject: "Tajweed",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "10:00",
    duration: 60,
    maxStudents: 20,
    enrolledCount: 14,
    meetingUrl: "https://meet.jit.si/albayaan-tajweed-101",
    status: "upcoming",
    description: "Comprehensive lesson on articulation points (Makharij al-Huroof)",
  },
  {
    id: "c2",
    title: "Al-Baqarah — Hifdh Session",
    teacher: "Ustadha Fatima",
    subject: "Hifdh",
    date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    time: "16:00",
    duration: 45,
    maxStudents: 15,
    enrolledCount: 9,
    meetingUrl: "https://meet.jit.si/albayaan-hifdh-baqarah",
    status: "upcoming",
    description: "Memorization review and correction for Ayahs 1-30",
  },
  {
    id: "c3",
    title: "Arabic Grammar — Basics",
    teacher: "Sheikh Ibrahim",
    subject: "Arabic Language",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    time: "14:00",
    duration: 60,
    maxStudents: 25,
    enrolledCount: 25,
    status: "completed",
    description: "Introduction to Arabic Noun and Verb structures",
  },
];

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 border-blue-200",
  live: "bg-red-100 text-red-700 border-red-200 animate-pulse",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

function ClassCard({ session, onJoin, onEnroll }: { session: ClassSession; onJoin: () => void; onEnroll: () => void }) {
  const spotsLeft = session.maxStudents - session.enrolledCount;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base leading-tight">{session.title}</CardTitle>
              <CardDescription className="mt-1">by {session.teacher}</CardDescription>
            </div>
            <Badge className={`border text-xs ${STATUS_COLORS[session.status]}`}>
              {session.status === "live" ? "🔴 LIVE" : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{session.subject}</span>
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{session.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{session.time} ({session.duration}min)</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />
              {session.enrolledCount}/{session.maxStudents}
              {spotsLeft > 0 && <span className="text-blue-700 ml-1">({spotsLeft} spots left)</span>}
              {spotsLeft === 0 && <span className="text-red-500 ml-1">(Full)</span>}
            </span>
          </div>
          {session.description && <p className="text-sm text-muted-foreground">{session.description}</p>}
          <div className="flex gap-2">
            {session.status === "live" && session.meetingUrl && (
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1" onClick={onJoin}>
                <Video className="h-3.5 w-3.5" />Join Live
              </Button>
            )}
            {session.status === "upcoming" && (
              <>
                {session.meetingUrl && (
                  <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={onJoin}>
                    <ExternalLink className="h-3.5 w-3.5" />View Link
                  </Button>
                )}
                {spotsLeft > 0 && (
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-700 text-white" onClick={onEnroll}>
                    Enroll
                  </Button>
                )}
              </>
            )}
            {session.status === "completed" && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" />Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LiveClassroom() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassSession[]>(SAMPLE_CLASSES);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const [loading, setLoading] = useState(false);
  const [newClass, setNewClass] = useState<NewClass>({
    title: "", subject: "Tajweed", date: "", time: "", duration: "60", maxStudents: "20", description: "", platform: "jitsi",
  });

  useEffect(() => {
    authFetch("/api/live-classroom/sessions", { })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && Array.isArray(d)) setClasses([...SAMPLE_CLASSES, ...d]); })
      .catch(() => {});
  }, []);

  const filtered = classes.filter(c => filterStatus === "all" || c.status === filterStatus);

  const handleJoin = (session: ClassSession) => {
    if (session.meetingUrl) {
      window.open(session.meetingUrl, "_blank", "noopener");
    } else {
      toast({ title: "No meeting link", description: "The teacher hasn't shared a link yet. Check back closer to the class time." });
    }
  };

  const handleEnroll = (session: ClassSession) => {
    setClasses(prev => prev.map(c => c.id === session.id ? { ...c, enrolledCount: c.enrolledCount + 1 } : c));
    toast({ title: "Enrolled!", description: `You're registered for "${session.title}". We'll remind you before class.` });
  };

  const handleCreate = async () => {
    if (!newClass.title || !newClass.date || !newClass.time) {
      toast({ title: "Missing fields", description: "Please fill title, date, and time.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await authFetch("/api/live-classroom/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });
      const d = await r.json();
      if (r.ok) {
        setClasses(prev => [d, ...prev]);
        setShowCreate(false);
        setNewClass({ title: "", subject: "Tajweed", date: "", time: "", duration: "60", maxStudents: "20", description: "", platform: "jitsi" });
        toast({ title: "Class created!", description: d.meetingUrl ? `Meeting link: ${d.meetingUrl}` : "Class scheduled successfully." });
      }
    } catch {
      toast({ title: "Error", description: "Could not create class.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Video className="h-6 w-6 text-blue-700" />Live Classroom
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Join live sessions with teachers</p>
          </div>
          <Button onClick={() => setShowCreate(s => !s)} className="bg-blue-700 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus className="h-4 w-4" />{showCreate ? "Cancel" : "New Class"}
          </Button>
        </div>

        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-blue-200">
              <CardHeader><CardTitle className="text-base">Schedule a New Class</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium mb-1 block">Class Title</label>
                    <Input placeholder="e.g. Tajweed Fundamentals — Week 3" value={newClass.title} onChange={e => setNewClass(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Subject</label>
                    <Select value={newClass.subject} onValueChange={v => setNewClass(p => ({ ...p, subject: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Platform</label>
                    <Select value={newClass.platform} onValueChange={(v: any) => setNewClass(p => ({ ...p, platform: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jitsi">Jitsi (Free, no account needed)</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="google_meet">Google Meet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Date</label>
                    <Input type="date" value={newClass.date} onChange={e => setNewClass(p => ({ ...p, date: e.target.value }))} min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Time</label>
                    <Input type="time" value={newClass.time} onChange={e => setNewClass(p => ({ ...p, time: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Duration (minutes)</label>
                    <Select value={newClass.duration} onValueChange={v => setNewClass(p => ({ ...p, duration: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["30", "45", "60", "90", "120"].map(d => <SelectItem key={d} value={d}>{d} minutes</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Max Students</label>
                    <Select value={newClass.maxStudents} onValueChange={v => setNewClass(p => ({ ...p, maxStudents: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["10", "15", "20", "25", "50"].map(n => <SelectItem key={n} value={n}>{n} students</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium mb-1 block">Description (optional)</label>
                    <Textarea placeholder="What will be covered in this class?" value={newClass.description} onChange={e => setNewClass(p => ({ ...p, description: e.target.value }))} rows={2} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={loading} className="bg-blue-700 hover:bg-blue-700 text-white">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Schedule Class"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "live", "upcoming", "completed"] as const).map(s => (
            <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm"
              className={filterStatus === s ? "bg-blue-700 text-white" : ""}
              onClick={() => setFilterStatus(s)}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && <Badge className="ml-1.5 bg-transparent border-0 p-0 text-inherit">
                {classes.filter(c => c.status === s).length}
              </Badge>}
            </Button>
          ))}
        </div>

        {/* Class grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.length === 0 && (
            <div className="sm:col-span-2 text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No {filterStatus !== "all" ? filterStatus : ""} classes found</p>
            </div>
          )}
          {filtered.map(session => (
            <ClassCard key={session.id} session={session} onJoin={() => handleJoin(session)} onEnroll={() => handleEnroll(session)} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
