import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import {
  BookOpen, LayoutDashboard, LineChart, Bookmark, Award, Trophy,
  LogOut, Menu, BotMessageSquare, Brain, Mic, CalendarDays,
  BookMarked, Shield, GraduationCap, Library, Users, ClipboardList,
  BarChart3, FolderOpen, Globe, PenSquare, Video, MessageCircle,
  Sparkles, CreditCard, MonitorPlay, ScrollText, RotateCcw,
  Sun, Moon, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationBell from "@/components/NotificationBell";
import { useI18n, type Locale } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    else       { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  }, [dark]);
  return [dark, setDark] as const;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: profile } = useGetProfile();
  const { locale, setLocale, t, isRTL } = useI18n();
  const [dark, setDark] = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);

  const xp = profile?.xp ?? 0;
  const xpLevel = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpPct = (xpInLevel / 500) * 100;

  const navGroups = [
    {
      label: t("nav.group.learn"),
      items: [
        { href: "/dashboard",  label: t("nav.dashboard"),   icon: LayoutDashboard },
        { href: "/learn",      label: t("nav.quran"),       icon: BookOpen },
        { href: "/mushaf",     label: t("nav.mushaf"),      icon: ScrollText, badge: "NEW" },
        { href: "/hifdh",      label: t("nav.hifdh"),       icon: Brain },
        { href: "/muraajacah", label: t("nav.muraajacah"),  icon: RotateCcw },
        { href: "/library",    label: t("nav.library"),     icon: Library },
        { href: "/cms",        label: t("nav.resources"),   icon: FolderOpen },
      ],
    },
    {
      label: t("nav.group.aiTeachers"),
      items: [
        { href: "/teacher",         label: t("nav.aiTeacher"),    icon: BotMessageSquare },
        { href: "/ai-assistant",    label: "AI Assistant",        icon: Sparkles, badge: "AI" },
        { href: "/tajweed-teacher", label: t("nav.tajweedTutor"), icon: BookMarked },
        { href: "/voice-teacher",   label: t("nav.voiceTeacher"), icon: Mic,   badge: "AI" },
        { href: "/video-teacher",   label: t("nav.videoTeacher"), icon: Video, badge: "NEW" },
        { href: "/study-planner",   label: t("nav.studyPlanner"), icon: CalendarDays },
      ],
    },
    {
      label: t("nav.group.progress"),
      items: [
        { href: "/progress",     label: t("nav.progress"),     icon: LineChart },
        { href: "/analytics",    label: t("nav.analytics"),    icon: BarChart3, badge: "NEW" },
        { href: "/bookmarks",    label: t("nav.bookmarks"),    icon: Bookmark },
        { href: "/achievements", label: t("nav.achievements"), icon: Award },
        { href: "/leaderboard",  label: t("nav.leaderboard"),  icon: Trophy },
      ],
    },
    {
      label: t("nav.group.exams"),
      items: [
        { href: "/exams",        label: t("nav.examCentre"),   icon: ClipboardList },
        { href: "/certificates", label: t("nav.certificates"), icon: Award },
      ],
    },
    {
      label: t("nav.group.family"),
      items: [
        { href: "/parent", label: t("nav.parentDashboard"), icon: Users },
      ],
    },
    {
      label: t("nav.group.community"),
      items: [
        { href: "/messages",       label: t("nav.messages"),      icon: MessageCircle, badge: "NEW" },
        { href: "/live-classroom", label: t("nav.liveClassroom"), icon: MonitorPlay,   badge: "NEW" },
        { href: "/payments",       label: t("nav.payments"),      icon: CreditCard },
      ],
    },
    {
      label: t("nav.group.admin"),
      items: [
        { href: "/content-generator", label: t("nav.contentGen"),  icon: Sparkles,      badge: "NEW" },
        { href: "/exam-builder",      label: t("nav.examBuilder"), icon: PenSquare },
        { href: "/teacher-dashboard", label: t("nav.teacherView"), icon: GraduationCap },
        { href: "/admin",             label: t("nav.admin"),       icon: Shield },
      ],
    },
  ];

  const handleSignOut = () => signOut({ redirectUrl: "/" });

  const LanguageSwitcher = () => (
    <div className="flex items-center gap-1.5">
      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger className="h-7 w-auto min-w-0 border-0 bg-transparent text-xs text-muted-foreground hover:text-primary focus:ring-0 px-1 gap-1 transition-colors">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">🇬🇧 English</SelectItem>
          <SelectItem value="ar">🇸🇦 العربية</SelectItem>
          <SelectItem value="so">🇸🇴 Somali</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const NavContent = () => (
    <div className={`flex h-full flex-col ${isRTL ? "direction-rtl" : ""}`}>
      {/* Logo */}
      <div className="flex h-16 items-center px-4 justify-between border-b border-sidebar-border/60 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative">
            <img src="/logo.svg" alt="Al Bayaan" className="h-8 w-auto transition-transform group-hover:scale-105" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-none">Al Bayaan</span>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">AI Academy</span>
          </div>
        </Link>
        <button
          onClick={() => setDark(!dark)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Toggle dark mode"
        >
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto py-3 min-h-0">
        <nav className={`px-3 space-y-5 ${isRTL ? "text-right" : ""}`}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-2 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location === item.href || location.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 relative ${
                        isActive
                          ? "nav-item-active"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : ""}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {(item as any).badge && (
                        <Badge className={`text-[9px] px-1.5 py-0 border-0 rounded-full leading-4 h-4 shrink-0 ${
                          (item as any).badge === "AI" ? "bg-violet-500 text-white" :
                          (item as any).badge === "NEW" ? "bg-blue-500 text-white" :
                          "bg-primary text-primary-foreground"
                        }`}>
                          {(item as any).badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-sidebar-border/60 space-y-2.5">
        <LanguageSwitcher />

        {/* XP Bar */}
        <div className="px-0.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Level {xpLevel}
            </span>
            <span>{xpInLevel}/500 XP</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-800 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 px-0.5">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full shrink-0 ring-2 ring-primary/20" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.displayName?.[0]?.toUpperCase() ?? "S"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{profile?.displayName ?? "Student"}</p>
            <p className="text-[11px] text-muted-foreground">{xp.toLocaleString()} XP total</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("nav.signOut")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen w-full flex-col bg-background md:flex-row ${isRTL ? "font-arabic" : ""}`}>
      {/* Desktop sidebar */}
      <aside className="hidden w-58 flex-col border-r border-sidebar-border/60 bg-sidebar md:flex sticky top-0 h-screen shadow-sm">
        <NavContent />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-sidebar-border/60 bg-sidebar px-4 md:hidden sticky top-0 z-30 shadow-sm">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border/60">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Al Bayaan" className="h-6 w-auto" />
              <span className="font-bold text-sm">Al Bayaan</span>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDark(!dark)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 p-4 md:p-6 lg:p-8 overflow-auto ${isRTL ? "text-right" : ""}`}>
          <div className="page-enter max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
