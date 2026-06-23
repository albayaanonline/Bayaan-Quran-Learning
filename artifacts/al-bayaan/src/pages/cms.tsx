import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookOpen, FileText, Volume2, Video, Image, Plus, Download, Eye, Upload, Search, Filter, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: number;
  type: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  fileUrl: string;
  thumbnailUrl: string;
  content: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

const TYPE_ICONS: Record<string, any> = {
  book: BookOpen, pdf: FileText, audio: Volume2, video: Video, image: Image,
  lesson: BookOpen, course: BookOpen, exam: FileText, quiz: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  book: "bg-blue-100 text-blue-800",
  pdf: "bg-red-100 text-red-700",
  audio: "bg-blue-100 text-blue-700",
  video: "bg-purple-100 text-purple-700",
  lesson: "bg-amber-100 text-amber-700",
  course: "bg-teal-100 text-teal-700",
};

const SUBJECTS = ["quran", "tajweed", "hifdh", "arabic", "tafsir", "fiqh", "aqeedah", "hadith", "general"];
const LEVELS = ["all", "beginner", "intermediate", "advanced"];
const TYPES = ["book", "pdf", "audio", "video", "lesson", "course", "exam", "quiz"];

function ContentCard({ item, onDownload }: { item: ContentItem; onDownload: (id: number) => void }) {
  const Icon = TYPE_ICONS[item.type] ?? FileText;
  const color = TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-700";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-blue-100 hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start gap-3 mb-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-snug text-slate-900 line-clamp-2">{item.title}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color}`}>{item.type}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.subject}</Badge>
                {item.level !== "all" && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.level}</Badge>}
              </div>
            </div>
          </div>

          {item.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">{item.description}</p>}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-blue-50">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.viewCount}</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" />{item.downloadCount}</span>
            </div>
            <div className="flex gap-1.5">
              {item.fileUrl && (
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => { window.open(item.fileUrl, "_blank"); onDownload(item.id); }}>
                  <Download className="h-3 w-3" /> Open
                </Button>
              )}
              {item.content && (
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(item.content)}`, "_blank")}>
                  <Eye className="h-3 w-3" /> View
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddContentDialog({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "pdf", title: "", description: "", subject: "quran", level: "all", fileUrl: "", content: "", tags: "" });

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const r = await authFetch("/api/cms/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          isPublished: true,
        }),
      });
      if (r.ok) {
        toast({ title: "Content added successfully!" });
        setOpen(false);
        setForm({ type: "pdf", title: "", description: "", subject: "quran", level: "all", fileUrl: "", content: "", tags: "" });
        onAdded();
      } else {
        toast({ title: "Failed to add content", variant: "destructive" });
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-700 hover:bg-blue-700 gap-2"><Plus className="h-4 w-4" />Add Content</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Add New Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Content Type *</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-8 text-sm mt-1" placeholder="e.g., Tajweed Basics Guide" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-sm mt-1 min-h-[60px]" placeholder="Brief description…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Subject</Label>
              <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">File URL (Google Drive, Dropbox, etc.)</Label>
            <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} className="h-8 text-sm mt-1" placeholder="https://…" />
          </div>
          <div>
            <Label className="text-xs">Text Content (for lessons/notes)</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="text-sm mt-1 min-h-[80px]" placeholder="Paste lesson text here…" />
          </div>
          <div>
            <Label className="text-xs">Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="h-8 text-sm mt-1" placeholder="tajweed, beginner, rules" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full bg-blue-700 hover:bg-blue-700">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Add Content"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CMS() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    authFetch("/api/cms/content", { })
      .then(r => r.ok ? r.json() : [])
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDownload = async (id: number) => {
    await authFetch(`/api/cms/content/${id}/download`, { method: "POST" }).catch(() => {});
  };

  const filtered = items.filter(item => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterSubject !== "all" && item.subject !== filterSubject) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const SUBJECT_GROUPS = [
    { label: "Quran", types: ["quran"] },
    { label: "Islamic Studies", types: ["tajweed", "hifdh", "arabic", "tafsir", "fiqh", "aqeedah", "hadith"] },
    { label: "All", types: ["general"] },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-700" /> Islamic Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Books, PDFs, audio, videos, and lessons</p>
          </div>
          <AddContentDialog onAdded={load} />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content…" className="pl-9 h-9 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">{items.length === 0 ? "No content yet" : "No results found"}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length === 0 ? "Add books, PDFs, and lessons using the button above" : "Try adjusting your filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(item => <ContentCard key={item.id} item={item} onDownload={handleDownload} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
