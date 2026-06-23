import { useState, useRef, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Trash2, BotMessageSquare, User, Loader2, BookOpen, Moon, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id?: number;
  role: string;
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the rules of Tajweed I should know?",
  "How do I apply Ikhfa in recitation?",
  "Explain the meaning of Surah Al-Fatiha",
  "What is the best method to memorize the Quran?",
  "What is the difference between Idgham and Ikhfa?",
  "How should I start my Hifdh journey?",
];

function MessageBubble({ msg, isStreaming }: { msg: Message; isStreaming?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
        isUser ? "bg-blue-700 text-white" : "bg-blue-100 dark:bg-blue-900 text-blue-800"}`}>
        {isUser ? <User className="h-4 w-4" /> : <BotMessageSquare className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-blue-700 text-white rounded-tr-sm"
          : "bg-white dark:bg-blue-950 border border-blue-100 text-slate-900 dark:text-blue-50 rounded-tl-sm shadow-sm"
      }`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {isStreaming && <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1 align-middle" />}
      </div>
    </motion.div>
  );
}

export default function Teacher() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef("");

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const loadConversations = async () => {
    try {
      const res = await authFetch("/api/teacher/conversations", { });
      if (res.ok) setConversations(await res.json());
    } catch {}
  };

  const openConversation = async (id: number) => {
    setActiveConvId(id);
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/teacher/conversations/${id}`, { });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      toast({ title: "Error", description: "Could not load conversation.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async (firstMessage?: string) => {
    try {
      const title = firstMessage ? firstMessage.slice(0, 40) : "New Chat";
      const res = await authFetch("/api/teacher/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const conv = await res.json();
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      return conv.id;
    } catch {
      toast({ title: "Error", description: "Could not create conversation.", variant: "destructive" });
      return null;
    }
  };

  const deleteConversation = async (id: number) => {
    try {
      await authFetch(`/api/teacher/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
    } catch {}
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending) return;
    const content = text.trim();
    setInput("");

    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation(content);
      if (!convId) return;
    }

    setMessages((prev) => [...prev, { role: "user", content }]);
    setIsSending(true);
    streamingRef.current = "";
    setStreamingContent("");

    try {
      const res = await authFetch(`/api/teacher/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error();

      const reader = res.body!.getReader();
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
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              streamingRef.current += parsed.content;
              setStreamingContent(streamingRef.current);
            }
            if (parsed.done) {
              setMessages((prev) => [...prev, { role: "assistant", content: streamingRef.current }]);
              setStreamingContent("");
              streamingRef.current = "";
            }
            if (parsed.error) {
              toast({ title: "AI Error", description: parsed.error });
            }
          } catch {}
        }
      }
    } catch {
      toast({ title: "Error", description: "Could not get response. Please try again.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  }, [activeConvId, isSending, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-4">

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 gap-3">
          <Button onClick={() => createConversation()} className="bg-blue-700 hover:bg-blue-700 text-white gap-2">
            <Plus className="h-4 w-4" /> New Chat
          </Button>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 pr-1">
                {conversations.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-4 text-center">No conversations yet</p>
                )}
                {conversations.map((c) => (
                  <div key={c.id} className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    activeConvId === c.id ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-blue-50 dark:hover:bg-blue-950"}`}
                    onClick={() => openConversation(c.id)}>
                    <BotMessageSquare className="h-3.5 w-3.5 shrink-0 text-blue-700" />
                    <span className="flex-1 text-sm truncate text-blue-950 dark:text-blue-100">{c.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background rounded-2xl border border-blue-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="border-b border-blue-100 px-6 py-4 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950 dark:to-background">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <BotMessageSquare className="h-5 w-5 text-blue-800" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-blue-50">Al Bayaan AI Teacher</h2>
              <p className="text-xs text-muted-foreground">Quran · Tajweed · Tafsir · Hifdh</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs border-blue-200 text-blue-800">
              {streamingContent ? "Typing…" : "Online"}
            </Badge>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-12 w-1/2 ml-auto" />
              </div>
            )}

            {!isLoading && messages.length === 0 && !streamingContent && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Star className="h-8 w-8 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-blue-50 mb-1">Assalamu Alaikum!</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">Ask me anything about Quran recitation, Tajweed rules, Tafsir, or Hifdh techniques.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-900 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {streamingContent && <MessageBubble msg={{ role: "assistant", content: streamingContent }} isStreaming />}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-blue-100 px-4 py-4 bg-white dark:bg-background">
            <div className="flex gap-3 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Tajweed, Tafsir, Hifdh…"
                className="flex-1 min-h-[44px] max-h-32 resize-none border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                rows={1}
                disabled={isSending}
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isSending}
                className="h-11 w-11 p-0 rounded-xl bg-blue-700 hover:bg-blue-700 shrink-0">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by free open-source AI · Groq · Pollinations · HuggingFace
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
