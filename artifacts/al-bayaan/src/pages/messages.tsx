import { useState, useEffect, useRef, useCallback } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare, Send, Plus, Search, User, GraduationCap, Users,
  Loader2, RefreshCw, Paperclip, FileImage, X, Image, File,
  CreditCard, CheckCheck, Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

interface DirectMessage {
  id: number;
  senderId: string;
  receiverId: string;
  senderName: string;
  subject: string;
  body: string;
  isRead: boolean;
  messageType: "student" | "teacher" | "parent" | "announcement";
  createdAt: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
}

type Tab = "inbox" | "sent" | "announcements";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  teacher:      <GraduationCap className="h-4 w-4" />,
  parent:       <Users className="h-4 w-4" />,
  student:      <User className="h-4 w-4" />,
  announcement: <MessageSquare className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  teacher:      "bg-blue-100 text-blue-800",
  parent:       "bg-violet-100 text-violet-700",
  student:      "bg-purple-100 text-purple-700",
  announcement: "bg-amber-100 text-amber-700",
};

function AttachmentBubble({ url, name, type }: { url: string; name?: string; type?: string }) {
  const isImage = type?.startsWith("image") || url.startsWith("data:image") || /\.(png|jpg|jpeg|gif|webp)$/i.test(name || "");
  const isPayment = type === "payment_proof";

  if (isImage || isPayment) {
    return (
      <div className="mt-2 space-y-1">
        {isPayment && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
            <CreditCard className="h-3 w-3" /> Payment Proof
          </div>
        )}
        <div className="rounded-xl overflow-hidden border border-blue-100 max-w-[220px]">
          <img src={url} alt={name || "attachment"} className="w-full object-cover max-h-40" />
        </div>
        {name && <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{name}</p>}
      </div>
    );
  }

  return (
    <a href={url} download={name} className="mt-2 flex items-center gap-2 bg-white/80 border border-blue-100 rounded-lg px-3 py-2 text-xs hover:bg-blue-50 transition-colors max-w-[220px]">
      <File className="h-4 w-4 text-blue-600 shrink-0" />
      <span className="truncate text-slate-700">{name || "Attachment"}</span>
      <Download className="h-3 w-3 text-muted-foreground shrink-0 ml-auto" />
    </a>
  );
}

export default function Messages() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("inbox");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeType, setComposeType] = useState<"teacher" | "parent">("teacher");
  const [composeAttachment, setComposeAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [replyAttachment, setReplyAttachment] = useState<{ url: string; name: string; type: string } | null>(null);

  const composeFileRef = useRef<HTMLInputElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback((file: File, isPaymentProof = false): Promise<{ url: string; name: string; type: string }> => {
    return new Promise((resolve, reject) => {
      if (file.size > 8 * 1024 * 1024) { reject(new Error("Max 8MB")); return; }
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        url: reader.result as string,
        name: file.name,
        type: isPaymentProof ? "payment_proof" : file.type || "application/octet-stream",
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleComposeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const att = await readFile(file);
      setComposeAttachment(att);
    } catch { toast({ title: "File too large", description: "Max 8MB", variant: "destructive" }); }
  };

  const handleReplyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const att = await readFile(file);
      setReplyAttachment(att);
    } catch { toast({ title: "File too large", description: "Max 8MB", variant: "destructive" }); }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const r = await authFetch(`/api/messages?tab=${tab}`, { });
      if (r.ok) setMessages(await r.json());
    } catch {
      toast({ title: "Error", description: "Could not load messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, [tab]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selectedThread, messages]);

  const filteredMessages = messages.filter(m =>
    !searchQ || m.senderName.toLowerCase().includes(searchQ.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQ.toLowerCase()) ||
    m.body.toLowerCase().includes(searchQ.toLowerCase())
  );

  const threadMessages = filteredMessages.filter(m =>
    m.senderId === selectedThread || m.receiverId === selectedThread
  );

  const selectedMsg = messages.find(m => m.senderId === selectedThread || m.receiverId === selectedThread);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    setSending(true);
    try {
      const r = await authFetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedThread,
          subject: `Re: ${selectedMsg?.subject || ""}`,
          body: replyText,
          attachmentUrl: replyAttachment?.url,
          attachmentName: replyAttachment?.name,
          attachmentType: replyAttachment?.type,
        }),
      });
      if (!r.ok) throw new Error();
      setReplyText("");
      setReplyAttachment(null);
      toast({ title: "Sent!", description: "Your message was sent." });
      loadMessages();
    } catch {
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendNew = async () => {
    if (!composeBody.trim() || !composeSubject.trim()) return;
    setSending(true);
    try {
      const r = await authFetch(`/api/messages/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: composeSubject,
          body: composeBody,
          messageType: composeType,
          attachmentUrl: composeAttachment?.url,
          attachmentName: composeAttachment?.name,
          attachmentType: composeAttachment?.type,
        }),
      });
      if (!r.ok) throw new Error();
      setShowCompose(false);
      setComposeSubject("");
      setComposeBody("");
      setComposeAttachment(null);
      toast({ title: "Message sent!", description: "Your message has been sent." });
      loadMessages();
    } catch {
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id: number) => {
    await authFetch(`/api/messages/${id}/read`, { method: "PATCH" });
    setMessages(m => m.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-700" />
              Messages
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Communicate with teachers, parents, students · Share files, images, payment proofs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadMessages}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setShowCompose(true)} className="bg-blue-700 hover:bg-blue-800 text-white">
              <Plus className="h-4 w-4 mr-1" /> New Message
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4" style={{ minHeight: 580 }}>
          {/* Sidebar */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
            <div className="flex rounded-lg border p-1 gap-1">
              {(["inbox", "sent", "announcements"] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    tab === t ? "bg-blue-700 text-white" : "hover:bg-gray-100 text-muted-foreground"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search messages…" className="pl-8 h-9 text-sm"
                value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            </div>

            <Card className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px] md:h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMessages.map(msg => (
                      <button key={msg.id}
                        onClick={() => { setSelectedThread(msg.senderId === "me" ? msg.receiverId : msg.senderId); markRead(msg.id); }}
                        className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors ${
                          selectedThread === (msg.senderId === "me" ? msg.receiverId : msg.senderId) ? "bg-blue-50" : ""
                        }`}>
                        <div className="flex items-start gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLORS[msg.messageType] || "bg-gray-100 text-gray-600"}`}>
                            {TYPE_ICONS[msg.messageType]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-semibold truncate ${!msg.isRead ? "text-blue-950" : "text-foreground"}`}>
                                {msg.senderName || "Unknown"}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {msg.attachmentUrl && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                                {!msg.isRead && <div className="h-2 w-2 rounded-full bg-blue-700" />}
                              </div>
                            </div>
                            <p className="text-xs font-medium truncate text-foreground">{msg.subject}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{msg.body}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ""}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Main panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedThread && threadMessages.length > 0 ? (
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="pb-3 border-b shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${TYPE_COLORS[selectedMsg?.messageType || "student"]}`}>
                      {TYPE_ICONS[selectedMsg?.messageType || "student"]}
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedMsg?.senderName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{selectedMsg?.subject}</p>
                    </div>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {threadMessages.map((msg) => {
                        const isMe = msg.senderId !== selectedThread;
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              isMe ? "bg-blue-700 text-white" : TYPE_COLORS[msg.messageType]
                            }`}>
                              {isMe ? "Me" : msg.senderName?.[0] ?? "?"}
                            </div>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                              isMe ? "bg-blue-700 text-white rounded-tr-sm" : "bg-white border rounded-tl-sm shadow-sm"
                            }`}>
                              {!isMe && <p className="text-[11px] font-semibold mb-1 opacity-70">{msg.senderName}</p>}
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                              {msg.attachmentUrl && (
                                <AttachmentBubble url={msg.attachmentUrl} name={msg.attachmentName || undefined} type={msg.attachmentType || undefined} />
                              )}
                              <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-muted-foreground"}`}>
                                {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ""}
                                {msg.isRead && isMe && <CheckCheck className="h-3 w-3 inline ml-1" />}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* Reply area */}
                <div className="border-t p-3 shrink-0 space-y-2">
                  {replyAttachment && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs">
                      {replyAttachment.type.startsWith("image") || replyAttachment.type === "payment_proof"
                        ? <Image className="h-4 w-4 text-blue-600" />
                        : <File className="h-4 w-4 text-blue-600" />}
                      <span className="flex-1 truncate text-slate-700">{replyAttachment.name}</span>
                      <button onClick={() => setReplyAttachment(null)}>
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                    <input ref={replyFileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleReplyFile} />
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-blue-700"
                      onClick={() => replyFileRef.current?.click()} title="Attach file">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Textarea placeholder="Write a reply… (Shift+Enter for new line)"
                      className="min-h-[44px] max-h-28 resize-none text-sm flex-1"
                      value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    />
                    <Button onClick={sendReply} disabled={sending || (!replyText.trim() && !replyAttachment)}
                      className="bg-blue-700 hover:bg-blue-800 text-white shrink-0 h-9">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-3">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">Select a message to read</p>
                  <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FileImage className="h-3 w-3" /> Images</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><File className="h-3 w-3" /> Files</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Payment Proofs</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowCompose(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Compose new message
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Compose modal */}
        <AnimatePresence>
          {showCompose && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">New Message</h2>
                  <button onClick={() => setShowCompose(false)} className="h-7 w-7 rounded-full hover:bg-gray-100 flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <div className="flex gap-2 mt-1">
                      {(["teacher", "parent"] as const).map(t => (
                        <button key={t} onClick={() => setComposeType(t)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                            composeType === t ? "bg-blue-700 text-white border-blue-600" : "border-gray-200 hover:border-blue-300"
                          }`}>
                          {t === "teacher" ? <><GraduationCap className="h-3.5 w-3.5 inline mr-1" />Teacher</> : <><Users className="h-3.5 w-3.5 inline mr-1" />Parent</>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input className="mt-1" placeholder="Message subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea className="mt-1 min-h-[100px]" placeholder="Write your message…" value={composeBody} onChange={e => setComposeBody(e.target.value)} />
                  </div>

                  {/* Attachment area */}
                  <div>
                    <label className="text-sm font-medium">Attachment (optional)</label>
                    <input ref={composeFileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleComposeFile} />
                    {composeAttachment ? (
                      <div className="mt-1 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs border border-blue-200">
                        {composeAttachment.type.startsWith("image") || composeAttachment.type === "payment_proof"
                          ? <Image className="h-4 w-4 text-blue-600 shrink-0" />
                          : <File className="h-4 w-4 text-blue-600 shrink-0" />}
                        <span className="flex-1 truncate text-slate-700">{composeAttachment.name}</span>
                        <button onClick={() => setComposeAttachment(null)}>
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => composeFileRef.current?.click()}
                        className="mt-1 w-full border-2 border-dashed border-blue-200 rounded-lg py-3 text-xs text-muted-foreground hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attach image, file, or payment proof (max 8MB)
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                  <Button onClick={sendNew} disabled={sending || !composeBody.trim() || !composeSubject.trim()}
                    className="bg-blue-700 hover:bg-blue-800 text-white">
                    {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Send
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
