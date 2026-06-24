import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.albayaan.quran";
const APP_STORE_URL  = "https://apps.apple.com/app/al-bayaan-quran/id6741235890";

type DeviceType = "android" | "ios" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectDevice(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function useInstallPrompt() {
  const [device, setDevice]                   = useState<DeviceType>("desktop");
  const [deferredPrompt, setDeferredPrompt]   = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]         = useState(false);
  const [installOutcome, setInstallOutcome]   = useState<"accepted" | "dismissed" | null>(null);

  useEffect(() => {
    setDevice(detectDevice());

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstallOutcome(outcome);
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    return outcome === "accepted";
  };

  return { device, deferredPrompt, isInstalled, installOutcome, triggerInstall };
}

/* ──────────────────────────────────────────────────────────────────────────
   iOS Guide Modal
────────────────────────────────────────────────────────────────────────── */
function IOSGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c1a3a] border border-blue-800/50 rounded-3xl p-7 max-w-sm w-full shadow-2xl shadow-blue-950/60"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-xl">Add to Home Screen</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-blue-200/60 text-sm mb-6 leading-relaxed">
          Install Al Bayaan on your iPhone or iPad for the best app-like experience:
        </p>

        <div className="space-y-4 mb-7">
          {[
            { n: "1", icon: "⬆️", text: 'Open this page in Safari, then tap the Share button at the bottom of your screen.' },
            { n: "2", icon: "➕", text: 'Scroll down in the share sheet and tap "Add to Home Screen".' },
            { n: "3", icon: "✅", text: 'Tap "Add" in the top-right corner. Al Bayaan will appear on your home screen!' },
          ].map(({ n, icon, text }) => (
            <div key={n} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-700/50 border border-blue-600/40 flex items-center justify-center text-blue-300 font-bold text-xs mt-0.5">
                {n}
              </div>
              <p className="text-white/75 text-sm leading-relaxed">{icon} {text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-semibold text-sm transition-all duration-200 active:scale-95"
        >
          Got it!
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main install buttons – place wherever needed
   variant="dark"  → white text on dark bg (hero section)
   variant="light" → dark text on light bg (footer / card)
────────────────────────────────────────────────────────────────────────── */
export function InstallButtons({
  className = "",
  variant = "dark",
  showLabels = true,
}: {
  className?: string;
  variant?: "dark" | "light";
  showLabels?: boolean;
}) {
  const { device, deferredPrompt, isInstalled, triggerInstall } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling]     = useState(false);

  const isDark = variant === "dark";

  const handleInstall = async () => {
    if (device === "ios") { setShowIOSGuide(true); return; }
    setInstalling(true);
    await triggerInstall();
    setInstalling(false);
  };

  const baseBtn = "group inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer select-none";
  const primaryBtn = `${baseBtn} bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1d3784] hover:to-[#1d51d4] text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:scale-105`;
  const secondaryBtnDark = `${baseBtn} bg-white/8 hover:bg-white/14 border border-white/15 hover:border-white/30 text-white hover:scale-105`;
  const secondaryBtnLight = `${baseBtn} bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 hover:scale-105`;
  const secondaryBtn = isDark ? secondaryBtnDark : secondaryBtnLight;

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-2 text-teal-400 text-sm font-semibold ${className}`}>
        <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
        App installed ✓
      </div>
    );
  }

  const showInstallBtn = device === "ios" || device === "android" || deferredPrompt !== null || device === "desktop";
  const showPlayStore  = device === "android" || device === "desktop";
  const showAppStore   = device === "ios" || device === "desktop";

  return (
    <>
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        {/* ── PWA Install Button ── */}
        {showInstallBtn && (
          <button onClick={handleInstall} disabled={installing} className={primaryBtn}>
            <Download className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
            {installing ? "Installing…" : device === "ios" ? "Add to Home Screen" : "Install App"}
          </button>
        )}

        {/* ── Google Play ── */}
        {showPlayStore && (
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z"/>
              <path d="M14.208 12.5l2.701 2.701-9.715 5.517a.998.998 0 01-.948.035L14.208 12.5z"/>
              <path d="M21.37 10.893c.39.402.585.907.585 1.387 0 .48-.196.985-.585 1.387l-2.065 1.172L16.622 12l2.683-2.839 2.065 1.732z"/>
              <path d="M14.208 11.5L6.246 3.247a.997.997 0 01.948.035l9.715 5.517L14.208 11.5z"/>
            </svg>
            {showLabels && "Google Play"}
          </a>
        )}

        {/* ── App Store ── */}
        {showAppStore && (
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.84M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            {showLabels && "App Store"}
          </a>
        )}
      </div>

      <AnimatePresence>
        {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Smart install banner – shows at bottom of screen when PWA prompt is ready
────────────────────────────────────────────────────────────────────────── */
export function InstallBanner() {
  const { device, deferredPrompt, isInstalled, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible]     = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (deferredPrompt && !isInstalled && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [deferredPrompt, isInstalled, dismissed]);

  const handleInstall = async () => {
    setInstalling(true);
    await triggerInstall();
    setInstalling(false);
    setDismissed(true);
  };

  if (device === "ios" || isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="fixed bottom-20 left-4 right-4 z-[150] sm:left-auto sm:right-6 sm:bottom-6 sm:w-[360px]"
        >
          <div className="bg-[#0c1a3a]/95 backdrop-blur-xl border border-blue-700/40 rounded-2xl p-4 shadow-2xl shadow-blue-950/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center flex-shrink-0">
              <img src="/icon-192.png" alt="Al Bayaan" className="w-8 h-8 rounded-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Install Al Bayaan</p>
              <p className="text-blue-300/70 text-xs">Add to home screen for instant access</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="h-8 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold text-xs hover:from-blue-600 hover:to-blue-400 transition-all duration-200 active:scale-95"
              >
                {installing ? "…" : "Install"}
              </button>
              <button
                onClick={() => { setDismissed(true); setVisible(false); }}
                className="text-white/30 hover:text-white/60 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
