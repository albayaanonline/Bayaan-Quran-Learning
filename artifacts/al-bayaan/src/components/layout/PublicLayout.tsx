import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-blue-100/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo.svg" alt="Al Bayaan" className="h-8 w-auto transition-transform group-hover:scale-105 duration-200" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-semibold text-slate-700 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="btn-primary-gradient font-semibold rounded-xl px-5 shadow-lg shadow-blue-900/20 btn-interactive">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full">{children}</main>
      <footer className="border-t py-6 md:py-0 bg-[#0f1e45] text-blue-50">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <img src="/logo.svg" alt="Al Bayaan" className="h-6 w-auto brightness-0 invert" />
            <p className="text-center text-sm leading-loose md:text-left opacity-75">
              © 2025 Al Bayaan AI Quran. Built for the modern Muslim.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
