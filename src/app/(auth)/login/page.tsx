'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setEmail('demo@bytevox.ai');
    setPassword('bytevox123');
    try {
      setError(null);
      setLoading(true);
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@bytevox.ai', password: 'bytevox123' }),
      });

      if (!res.ok) {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Demo Reviewer',
            email: 'demo@bytevox.ai',
            password: 'bytevox123',
          }),
        });
      }

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Demo sign in failed.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col text-slate-100">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#20293a] bg-[#0c1017] p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#141b27] border border-[#283549] text-[#e5a93c] mb-1 font-mono font-bold text-base shadow-inner">
              BV
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sign in to ByteVox</h1>
            <p className="text-xs text-slate-400 font-mono">
              Access your datasets, reports, and transparent calculation proofs
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-[#401824] bg-[#200c11] p-3 text-xs text-[#f43f5e] font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@bytevox.ai"
                  className="w-full rounded-lg border border-[#222b3b] bg-[#10141d] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-[#e5a93c] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#222b3b] bg-[#10141d] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-[#e5a93c] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1c2433]" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase">
              <span className="bg-[#0c1017] px-2 text-slate-500">Evaluator Fast-Track</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono font-semibold text-[#e5a93c] border-[#2f3d53]"
          >
            <span className="h-2 w-2 rounded-full bg-[#10b981] audit-pulse-dot" />
            One-Click Demo Evaluator Sign In
          </button>

          <p className="text-center text-xs text-slate-400 font-mono">
            New analyst?{' '}
            <a href="/register" className="text-[#e5a93c] hover:text-[#fbbf24] font-semibold underline underline-offset-2">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
