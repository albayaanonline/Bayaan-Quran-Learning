import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import {
  BookOpen,
  LayoutDashboard,
  LineChart,
  Bookmark,
  Award,
  Trophy,
  LogOut,
  Menu,
  BotMessageSquare,
  Brain,
  Mic,
  CalendarDays,
  BookMarked,
  Shield,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetProfile } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: profile } = useGetProfile();

  const xpLevel = Math.floor((profile?.xp ?? 0) / 500) + 1;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/learn", label: "Learn Quran", icon: BookOpen },
    { href: "/hifdh", label: "Hifdh Tracker", icon: Brain },
    { href: "/teacher", label: "AI Teacher", icon: BotMessageSquare },
    { href: "/tajweed-teacher", label: "Tajweed Tutor", icon: BookMarked },
    { href: "/voice-teacher", label: "Voice Teacher", icon: Mic, badge: "AI" },
    { href: "/study-planner", label: "Study Planner", icon: CalendarDays },
    { href: "/progress", label: "Progress", icon: LineChart },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { href: "/achievements", label: "Achievements", icon: Award },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/teacher-dashboard", label: "Teacher View", icon: GraduationCap },
    { href: "/admin", label: "Admin", icon: Shield },
  ];

  const handleSignOut = () => signOut({ redirectUrl: "/" });

  const NavContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-14 items-center px-4 pt-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Al Bayaan" className="h-8 w-auto" />
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium gap-0.5">
          {navItems.map(item => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-50"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-900 dark:hover:bg-emerald-950"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {(item as any).badge && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white border-0 rounded-full leading-4">
                    {(item as any).badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-emerald-100">
        <div className="mb-3 flex items-center gap-3">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.displayName?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{profile?.displayName ?? "Student"}</p>
            <p className="text-xs text-muted-foreground">{profile?.xp ?? 0} XP · Level {xpLevel}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background/50 md:flex-row">
      <aside className="hidden w-60 flex-col border-r bg-background md:flex sticky top-0 h-screen">
        <NavContent />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden sticky top-0 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-center pr-10">
            <img src="/logo.svg" alt="Al Bayaan" className="h-6 w-auto" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
