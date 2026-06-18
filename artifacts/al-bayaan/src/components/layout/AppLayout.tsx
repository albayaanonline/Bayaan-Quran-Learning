import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import {
  BookOpen, LayoutDashboard, LineChart, Bookmark, Award, Trophy,
  LogOut, Menu, BotMessageSquare, Brain, Mic, CalendarDays,
  BookMarked, Shield, GraduationCap, Library, Users, ClipboardList,
  BarChart3, FolderOpen, Globe, PenSquare, Video, MessageCircle, Sparkles, CreditCard, MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationBell from "@/components/NotificationBell";
import { useI18n, type Locale } from "@/lib/i18n";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: profile } = useGetProfile();
  const { locale, setLocale, t, isRTL } = useI18n();

  const xpLevel = Math.floor((profile?.xp ?? 0) / 500) + 1;

  const navGroups = [
    {
      label: "Learn",
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: "/learn", label: t("nav.quran"), icon: BookOpen },
        { href: "/hifdh", label: t("nav.hifdh"), icon: Brain },
        { href: "/library", label: t("nav.library"), icon: Library },
        { href: "/cms", label: t("nav.resources"), icon: FolderOpen },
      ],
    },
    {
      label: "AI Teachers",
      items: [
        { href: "/teacher", label: t("nav.aiTeacher"), icon: BotMessageSquare },
        { href: "/tajweed-teacher", label: t("nav.tajweedTutor"), icon: BookMarked },
        { href: "/voice-teacher", label: t("nav.voiceTeacher"), icon: Mic, badge: "AI" },
        { href: "/video-teacher", label: "Video Teacher", icon: Video, badge: "NEW" },
        { href: "/study-planner", label: t("nav.studyPlanner"), icon: CalendarDays },
      ],
    },
    {
      label: "Progress",
      items: [
        { href: "/progress", label: t("nav.progress"), icon: LineChart },
        { href: "/analytics", label: t("nav.analytics"), icon: BarChart3, badge: "NEW" },
        { href: "/bookmarks", label: t("nav.bookmarks"), icon: Bookmark },
        { href: "/achievements", label: t("nav.achievements"), icon: Award },
        { href: "/leaderboard", label: t("nav.leaderboard"), icon: Trophy },
      ],
    },
    {
      label: "Exams",
      items: [
        { href: "/exams", label: t("nav.examCentre"), icon: ClipboardList },
        { href: "/certificates", label: t("nav.certificates"), icon: Award },
      ],
    },
    {
      label: "Family",
      items: [
        { href: "/parent", label: t("nav.parentDashboard"), icon: Users },
      ],
    },
    {
      label: "Communication",
      items: [
        { href: "/messages", label: "Messages", icon: MessageCircle, badge: "NEW" },
        { href: "/live-classroom", label: "Live Classroom", icon: MonitorPlay, badge: "NEW" },
        { href: "/payments", label: "Upgrade Plan", icon: CreditCard },
      ],
    },
    {
      label: "Admin",
      items: [
        { href: "/content-generator", label: "AI Content", icon: Sparkles, badge: "NEW" },
        { href: "/exam-builder", label: t("nav.examBuilder"), icon: PenSquare },
        { href: "/teacher-dashboard", label: t("nav.teacherView"), icon: GraduationCap },
        { href: "/admin", label: t("nav.admin"), icon: Shield },
      ],
    },
  ];

  const handleSignOut = () => signOut({ redirectUrl: "/" });

  const LanguageSwitcher = () => (
    <div className="flex items-center gap-1.5">
      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger className="h-7 w-auto min-w-0 border-0 bg-transparent text-xs text-muted-foreground hover:text-emerald-700 focus:ring-0 px-1 gap-1">
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
    <div className={`flex h-full flex-col gap-2 ${isRTL ? "direction-rtl" : ""}`}>
      <div className="flex h-14 items-center px-4 pt-3 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Al Bayaan" className="h-8 w-auto" />
        </Link>
        <NotificationBell />
      </div>

      <div className="flex-1 overflow-auto py-1">
        <nav className="px-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location === item.href || location.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all ${
                        isActive
                          ? "bg-emerald-100 text-emerald-900 font-semibold"
                          : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-900"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {(item as any).badge && (
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 rounded-full leading-4 h-4 ${(item as any).badge === "NEW" ? "bg-blue-500 text-white" : "bg-emerald-600 text-white"}`}>
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

      <div className="p-3 border-t border-emerald-100 space-y-2">
        <LanguageSwitcher />
        <div className="flex items-center gap-2.5">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.displayName?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-emerald-950">{profile?.displayName ?? "Student"}</p>
            <p className="text-[11px] text-muted-foreground">{profile?.xp ?? 0} XP · Level {xpLevel}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8" onClick={handleSignOut}>
          <LogOut className="h-3.5 w-3.5" />
          {t("nav.signOut")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen w-full flex-col bg-background/50 md:flex-row ${isRTL ? "font-arabic" : ""}`}>
      <aside className="hidden w-56 flex-col border-r bg-background md:flex sticky top-0 h-screen">
        <NavContent />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden sticky top-0 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-between pr-2">
            <img src="/logo.svg" alt="Al Bayaan" className="h-6 w-auto mx-auto" />
            <NotificationBell />
          </div>
        </header>

        <main className={`flex-1 p-4 md:p-6 lg:p-8 ${isRTL ? "text-right" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
