import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, ClerkLoading } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import WhatsAppButton from "@/components/WhatsAppButton";
import { InstallBanner } from "@/components/InstallPrompt";

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
import ParentDashboard from "./pages/parent-dashboard";
import Exams from "./pages/exams";
import Certificates from "./pages/certificates";
import Analytics from "./pages/analytics";
import CMS from "./pages/cms";
import ExamBuilder from "./pages/exam-builder";
import VideoTeacher from "./pages/video-teacher";
import ContentGenerator from "./pages/content-generator";
import Messages from "./pages/messages";
import Payments from "./pages/payments";
import LiveClassroom from "./pages/live-classroom";
import Marketing from "./pages/marketing";
import Mushaf from "./pages/mushaf";
import Muraajacah from "./pages/muraajacah";
import BookCourse from "./pages/book-course";
import BookLesson from "./pages/book-lesson";
import Privacy from "./pages/privacy";
import Terms from "./pages/terms";
import FAQ from "./pages/faq";
import Contact from "./pages/contact";
import Help from "./pages/help";
import NotFound from "@/pages/not-found";
import AIAssistant from "./pages/ai-assistant";
import Pricing from "./pages/pricing";

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

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#1E3A8A",
    colorForeground: "#0F172A",
    colorMutedForeground: "#475569",
    colorDanger: "hsl(0 84% 58%)",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#0F172A",
    colorNeutral: "#E2E8F0",
    fontFamily: "'Poppins', 'Inter', sans-serif",
    borderRadius: "0.875rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-blue-100 shadow-2xl shadow-blue-900/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-slate-900",
    headerSubtitle: "text-sm text-slate-500",
    socialButtonsBlockButtonText: "text-slate-900 font-medium",
    formFieldLabel: "text-slate-800 font-medium",
    footerActionLink: "text-blue-700 hover:text-blue-800 font-semibold",
    footerActionText: "text-slate-600",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-blue-600",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-red-600",
    logoBox: "mb-4",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-blue-100 hover:bg-blue-50 text-slate-900 transition-all duration-200",
    formButtonPrimary: "bg-gradient-to-r from-blue-900 to-blue-600 hover:from-blue-800 hover:to-blue-500 text-white font-semibold shadow-md shadow-blue-900/20 transition-all duration-200",
    formFieldInput: "border-slate-200 focus:border-blue-600 focus:ring-blue-600 bg-white text-slate-900 transition-all duration-200",
    footerAction: "bg-blue-50/50",
    dividerLine: "bg-blue-100",
    alert: "bg-red-50 border border-red-200 text-red-800",
    otpCodeFieldInput: "border-slate-200 focus:border-blue-600 text-slate-900",
    formFieldRow: "mb-4",
    main: "px-8 py-6",
  },
};

function HomeRedirect() {
  return (
    <>
      <ClerkLoading>
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#080f24]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-300 text-sm font-medium tracking-wide">Loading Al Bayaan…</p>
          </div>
        </div>
      </ClerkLoading>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function AuthPage({ type }: { type: "sign-in" | "sign-up" }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a1628] bg-[url('/images/geometric-pattern.png')] bg-cover bg-center px-4">
      <div className="absolute inset-0 bg-[#0a1628]/88 backdrop-blur-sm z-0" />
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
      <ClerkLoading>
        <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ClerkLoading>
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

function MissingConfigError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-blue-100 shadow-2xl shadow-blue-900/10 p-10 text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Configuration Required</h1>
        <p className="text-slate-600 mb-4 leading-relaxed">
          Al Bayaan requires authentication to be configured before it can start.
          Please contact the administrator or check the environment setup.
        </p>
        <div className="bg-blue-50 rounded-xl px-4 py-3 text-left text-sm text-blue-900 font-mono break-words mb-6">
          {message}
        </div>
        <p className="text-sm text-blue-700">
          Set <code className="bg-blue-100 px-1.5 py-0.5 rounded-md">VITE_CLERK_PUBLISHABLE_KEY</code> in the environment variables and restart.
        </p>
      </div>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return <MissingConfigError message="VITE_CLERK_PUBLISHABLE_KEY is not set. Authentication cannot initialize." />;
  }

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
          <Route path="/exams" component={() => <ProtectedRoute component={Exams} />} />
          <Route path="/certificates" component={() => <ProtectedRoute component={Certificates} />} />
          <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
          <Route path="/cms" component={() => <ProtectedRoute component={CMS} />} />
          <Route path="/parent" component={() => <ProtectedRoute component={ParentDashboard} />} />
          <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
          <Route path="/teacher-dashboard" component={() => <ProtectedRoute component={TeacherDashboard} />} />
          <Route path="/exam-builder" component={() => <ProtectedRoute component={ExamBuilder} />} />
          <Route path="/video-teacher" component={() => <ProtectedRoute component={VideoTeacher} />} />
          <Route path="/content-generator" component={() => <ProtectedRoute component={ContentGenerator} />} />
          <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
          <Route path="/payments" component={() => <ProtectedRoute component={Payments} />} />
          <Route path="/live-classroom" component={() => <ProtectedRoute component={LiveClassroom} />} />
          <Route path="/mushaf" component={() => <ProtectedRoute component={Mushaf} />} />
          <Route path="/muraajacah" component={() => <ProtectedRoute component={Muraajacah} />} />
          <Route path="/library/:bookId" component={() => <ProtectedRoute component={BookCourse} />} />
          <Route path="/library/:bookId/lesson/:lessonNum" component={() => <ProtectedRoute component={BookLesson} />} />
          {/* Public pages */}
          <Route path="/pricing" component={Pricing} />
          <Route path="/about" component={Marketing} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/faq" component={FAQ} />
          <Route path="/contact" component={Contact} />
          <Route path="/help" component={Help} />
          <Route path="/ai-assistant" component={() => <ProtectedRoute component={AIAssistant} />} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <I18nProvider>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
        <WhatsAppButton />
        <InstallBanner />
      </TooltipProvider>
    </I18nProvider>
  );
}

export default App;
