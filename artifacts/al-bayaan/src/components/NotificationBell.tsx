import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, Award, ClipboardList, Flame, BotMessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const TYPE_ICONS: Record<string, any> = {
  exam_passed: ClipboardList,
  certificate_earned: Award,
  streak_alert: Flame,
  teacher_message: BotMessageSquare,
  exam_graded: ClipboardList,
  default: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  exam_passed: "text-emerald-600 bg-emerald-100",
  certificate_earned: "text-amber-600 bg-amber-100",
  streak_alert: "text-orange-600 bg-orange-100",
  teacher_message: "text-blue-600 bg-blue-100",
  exam_graded: "text-purple-600 bg-purple-100",
  default: "text-gray-600 bg-gray-100",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const r = await fetch("/api/notifications", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setNotifications(Array.isArray(data) ? data : []);
        setUnread(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH", credentials: "include" }).catch(() => {});
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    setUnread(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH", credentials: "include" }).catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  const remove = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE", credentials: "include" }).catch(() => {});
    const removed = notifications.find(n => n.id === id);
    setNotifications(n => n.filter(x => x.id !== id));
    if (removed && !removed.isRead) setUnread(c => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-emerald-100 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-sm text-emerald-950">{t("notif.title")}</span>
                {unread > 0 && (
                  <Badge className="h-4 text-[10px] px-1.5 bg-red-500 text-white border-0">{unread}</Badge>
                )}
              </div>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {t("notif.markAllRead")}
                </button>
              )}
            </div>

            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("notif.empty")}</p>
                </div>
              ) : (
                <div className="divide-y divide-emerald-50">
                  {notifications.map(notif => {
                    const Icon = TYPE_ICONS[notif.type] ?? TYPE_ICONS.default;
                    const color = TYPE_COLORS[notif.type] ?? TYPE_COLORS.default;
                    return (
                      <div
                        key={notif.id}
                        className={`flex gap-3 px-4 py-3 hover:bg-emerald-50/50 cursor-pointer transition-colors ${!notif.isRead ? "bg-emerald-50/30" : ""}`}
                        onClick={() => !notif.isRead && markRead(notif.id)}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs font-semibold truncate ${!notif.isRead ? "text-emerald-950" : "text-foreground"}`}>{notif.title}</p>
                            <button onClick={(e) => { e.stopPropagation(); remove(notif.id); }} className="shrink-0 p-0.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
