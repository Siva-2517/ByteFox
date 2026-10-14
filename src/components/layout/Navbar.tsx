'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Database, FileSpreadsheet, Layers, LogOut, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#1c2331] bg-[#090c13]/90 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-7">
          {/* Bespoke Geometric Brandmark */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#141923] border border-[#2b3547] shadow-inner group-hover:border-[#e5a93c]/50 transition-colors">
              <span className="font-mono text-sm font-extrabold tracking-tighter text-[#e5a93c]">
                BV
              </span>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#10b981] audit-pulse-dot" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white group-hover:text-[#e5a93c] transition-colors">
                  ByteVox
                </span>
                <span className="hidden sm:inline-flex rounded border border-[#263143] bg-[#111722] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-slate-300">
                  Audit Core v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Show-Your-Work Report Builder</p>
            </div>
          </a>

          {user && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#1c2331]">
              <a
                href="/datasets"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  pathname?.startsWith('/datasets')
                    ? 'bg-[#18202d] text-[#e5a93c] border border-[#2b364a]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                Datasets
              </a>
              <a
                href="/reports"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  pathname?.startsWith('/reports')
                    ? 'bg-[#18202d] text-[#e5a93c] border border-[#2b364a]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Reports
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-white/5" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-[#111622] border border-[#202838] px-2.5 py-1 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                <span className="font-mono text-slate-300 text-[11px] truncate max-w-[130px]">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-[#202838] bg-[#111622] px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              >
                Get Started
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 border-b border-[#1c2331] bg-[#090c13]/90 backdrop-blur-md h-15" />
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
