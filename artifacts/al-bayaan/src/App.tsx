import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "./pages/landing";
import Dashboard from "./pages/dashboard";
import Onboarding from "./pages/onboarding";
import Learn from "./pages/learn";
import SurahDetail from "./pages/surah";
import Progress from "./pages/progress";
import Bookmarks from "./pages/bookmarks";
import Achievements from "./pages/achievements";
import Leaderboard from "./pages/leaderboard";
import Teacher from "./pages/teacher";
import Hifdh from "./pages/hifdh";
import TajweedTeacher from "./pages/tajweed-teacher";
import StudyPlanner from "./pages/study-planner";
import VoiceTeacher from "./pages/voice-teacher";
import Admin from "./pages/admin";
import TeacherDashboard from "./pages/teacher-dashboard";
import Library from "./pages/library";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(161 94% 30%)",
    colorForeground: "hsl(164 86% 16%)",
    colorMutedForeground: "hsl(164 30% 40%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(164 86% 16%)",
    colorNeutral: "hsl(161 20% 85%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-emerald-100 shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-serif text-emerald-950",
    headerSubtitle: "text-sm text-emerald-700/80",
    socialButtonsBlockButtonText: "text-emerald-950 font-medium",
    formFieldLabel: "text-emerald-950 font-medium",
    footerActionLink: "text-emerald-600 hover:text-emerald-700 font-medium",
    footerActionText: "text-emerald-800",
    dividerText: "text-emerald-700/60",
    identityPreviewEditButton: "text-emerald-600",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-red-600",
    logoBox: "mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-emerald-100 hover:bg-emerald-50 text-emerald-950",
    formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm",
    formFieldInput: "border-emerald-200 focus:border-emerald-600 focus:ring-emerald-600 bg-white text-emerald-950",
    footerAction: "bg-emerald-50",
    dividerLine: "bg-emerald-100",
    alert: "bg-red-50 border border-red-200 text-red-800",
    otpCodeFieldInput: "border-emerald-200 focus:border-emerald-600 text-emerald-950",
    formFieldRow: "mb-4",
    main: "px-8 py-6",
  },
};

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function AuthPage({ type }: { type: "sign-in" | "sign-up" }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0f0a] bg-[url('/images/geometric-pattern.png')] bg-cover bg-center px-4">
      <div className="absolute inset-0 bg-[#0a0f0a]/85 backdrop-blur-sm z-0" />
      <div className="relative z-10 w-full max-w-md">
        {type === "sign-in"
          ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
          : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        }
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in"><Component /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    return addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) qc.clear();
      prevRef.current = id;
    });
  }, [addListener, qc]);
  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={() => <AuthPage type="sign-in" />} />
          <Route path="/sign-up/*?" component={() => <AuthPage type="sign-up" />} />
          <Route path="/onboarding" component={() => <ProtectedRoute component={Onboarding} />} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/learn" component={() => <ProtectedRoute component={Learn} />} />
          <Route path="/learn/:surahId" component={() => <ProtectedRoute component={SurahDetail} />} />
          <Route path="/library" component={() => <ProtectedRoute component={Library} />} />
          <Route path="/progress" component={() => <ProtectedRoute component={Progress} />} />
          <Route path="/bookmarks" component={() => <ProtectedRoute component={Bookmarks} />} />
          <Route path="/achievements" component={() => <ProtectedRoute component={Achievements} />} />
          <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />
          <Route path="/teacher" component={() => <ProtectedRoute component={Teacher} />} />
          <Route path="/hifdh" component={() => <ProtectedRoute component={Hifdh} />} />
          <Route path="/tajweed-teacher" component={() => <ProtectedRoute component={TajweedTeacher} />} />
          <Route path="/study-planner" component={() => <ProtectedRoute component={StudyPlanner} />} />
          <Route path="/voice-teacher" component={() => <ProtectedRoute component={VoiceTeacher} />} />
          <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
          <Route path="/teacher-dashboard" component={() => <ProtectedRoute component={TeacherDashboard} />} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
