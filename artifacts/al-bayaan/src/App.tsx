import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import WhatsAppButton from "@/components/WhatsAppButton";

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
    colorPrimary: "hsl(161 90% 28%)",
    colorForeground: "hsl(164 86% 14%)",
    colorMutedForeground: "hsl(164 28% 42%)",
    colorDanger: "hsl(0 84% 58%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(164 86% 14%)",
    colorNeutral: "hsl(161 18% 86%)",
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

function MissingConfigError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-emerald-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-emerald-100 shadow-xl p-10 text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h1 className="text-2xl font-serif font-bold text-emerald-900 mb-3">Configuration Required</h1>
        <p className="text-emerald-700 mb-4 leading-relaxed">
          Al Bayaan requires authentication to be configured before it can start.
          Please contact the administrator or check the environment setup.
        </p>
        <div className="bg-emerald-50 rounded-lg px-4 py-3 text-left text-sm text-emerald-800 font-mono break-words mb-6">
          {message}
        </div>
        <p className="text-sm text-emerald-600">
          Set <code className="bg-emerald-100 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in the environment variables and restart.
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
      </TooltipProvider>
    </I18nProvider>
  );
}

export default App;
