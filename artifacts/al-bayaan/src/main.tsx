import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Component, type ErrorInfo, type ReactNode } from "react";

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Al Bayaan] Unhandled error:", error, info);
  }

  render() {
    if (this.state.error) {
      const err = this.state.error;
      const isClerkKey = err.message?.includes("VITE_CLERK_PUBLISHABLE_KEY") || err.message?.includes("publishable key");
      return (
        <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", padding: "24px" }}>
          <div style={{ maxWidth: 520, width: "100%", background: "#fff", borderRadius: 16, border: "1px solid #d1fae5", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: "40px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ color: "#065f46", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              {isClerkKey ? "Authentication Not Configured" : "Application Error"}
            </h1>
            <p style={{ color: "#047857", fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
              {isClerkKey
                ? "The authentication service (Clerk) is not set up. Please configure VITE_CLERK_PUBLISHABLE_KEY in the environment variables."
                : "An unexpected error occurred while loading Al Bayaan. This has been logged automatically."}
            </p>
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "12px 16px", textAlign: "left", marginBottom: 20, fontSize: 13, color: "#065f46", fontFamily: "monospace", wordBreak: "break-word" }}>
              {err.message}
            </div>
            {!isClerkKey && (
              <button
                onClick={() => window.location.reload()}
                style={{ background: "#047857", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
              >
                Reload Page
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = '<div style="padding:40px;font-family:system-ui;color:#065f46;text-align:center"><h2>Fatal: #root element missing. Please reload.</h2></div>';
} else {
  createRoot(root).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}
