import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Plus, Search, User, GraduationCap, Users, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

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
}

interface Thread {
  participant: string;
  participantName: string;
  participantType: "student" | "teacher" | "parent";
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: DirectMessage[];
}

type Tab = "inbox" | "sent" | "announcements";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  teacher: <GraduationCap className="h-4 w-4" />,
  parent: <Users className="h-4 w-4" />,
  student: <User className="h-4 w-4" />,
  announcement: <MessageSquare className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  teacher: "bg-emerald-100 text-emerald-700",
  parent: "bg-blue-100 text-blue-700",
  student: "bg-purple-100 text-purple-700",
  announcement: "bg-amber-100 text-amber-700",
};

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

  // Compose state
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeType, setComposeType] = useState<"teacher" | "parent">("teacher");

  const loadMessages = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/messages?tab=${tab}`, { credentials: "include" });
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
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: selectedThread, subject: `Re: ${selectedMsg?.subject || ""}`, body: replyText }),
      });
      if (!r.ok) throw new Error();
      setReplyText("");
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
      const r = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject: composeSubject, body: composeBody, messageType: composeType }),
      });
      if (!r.ok) throw new Error();
      setShowCompose(false);
      setComposeSubject("");
      setComposeBody("");
      toast({ title: "Message sent!", description: "Your message has been sent." });
      loadMessages();
    } catch {
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id: number) => {
    await fetch(`/api/messages/${id}/read`, { method: "PATCH", credentials: "include" });
    setMessages(m => m.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-emerald-950 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
              Messages
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Communicate with teachers, parents and students</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadMessages}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setShowCompose(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> New Message
            </Button>
          </div>
        </div>

        <div className="flex gap-4 h-[600px]">
          {/* Sidebar */}
          <div className="w-72 shrink-0 flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex rounded-lg border p-1 gap-1">
              {(["inbox", "sent", "announcements"] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    tab === t ? "bg-emerald-600 text-white" : "hover:bg-gray-100 text-muted-foreground"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search messages…" className="pl-8 h-9 text-sm"
                value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            </div>

            {/* Message list */}
            <Card className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
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
                          selectedThread === (msg.senderId === "me" ? msg.receiverId : msg.senderId) ? "bg-emerald-50" : ""
                        }`}>
                        <div className="flex items-start gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLORS[msg.messageType] || "bg-gray-100 text-gray-600"}`}>
                            {TYPE_ICONS[msg.messageType]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-semibold truncate ${!msg.isRead ? "text-emerald-900" : "text-foreground"}`}>
                                {msg.senderName || "Unknown"}
                              </span>
                              {!msg.isRead && <div className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />}
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
          <div className="flex-1 flex flex-col">
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
                      {threadMessages.map((msg, i) => {
                        const isMe = msg.senderId !== selectedThread;
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isMe ? "bg-emerald-600 text-white" : TYPE_COLORS[msg.messageType]}`}>
                              {isMe ? "Me" : msg.senderName?.[0] ?? "?"}
                            </div>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isMe ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-white border rounded-tl-sm shadow-sm"}`}>
                              {!isMe && <p className="text-[11px] font-semibold mb-1 opacity-70">{msg.senderName}</p>}
                              <p className="leading-relaxed">{msg.body}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? "text-emerald-200" : "text-muted-foreground"}`}>
                                {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ""}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
                <div className="border-t p-4 shrink-0">
                  <div className="flex gap-2">
                    <Textarea placeholder="Write a reply…" className="min-h-[44px] max-h-28 resize-none text-sm"
                      value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    />
                    <Button onClick={sendReply} disabled={sending || !replyText.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">Select a message to read</p>
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
                <h2 className="text-lg font-semibold">New Message</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <div className="flex gap-2 mt-1">
                      {(["teacher", "parent"] as const).map(t => (
                        <button key={t} onClick={() => setComposeType(t)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${composeType === t ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 hover:border-emerald-300"}`}>
                          {t}
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
                    <Textarea className="mt-1 min-h-[120px]" placeholder="Write your message…" value={composeBody} onChange={e => setComposeBody(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                  <Button onClick={sendNew} disabled={sending || !composeBody.trim() || !composeSubject.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
