'use client';

import { useState } from 'react';
import { X, Share2, Copy, Check, Clock, ShieldAlert, Trash2, ExternalLink, Lock } from 'lucide-react';

interface ShareLinkItem {
  id: string;
  token: string;
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  shareLinks: ShareLinkItem[];
  onLinksUpdated: () => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  reportId,
  shareLinks,
  onLinksUpdated,
}: ShareModalProps) {
  const [expiresInHours, setExpiresInHours] = useState<number | null>(24);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    try {
      setCreating(true);
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create share link');
      }

      onLinksUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareLinkId: string) => {
    if (!confirm('Are you sure you want to revoke this link? Anyone with the URL will immediately lose access.')) {
      return;
    }

    try {
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareLinkId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to revoke link');
      }

      onLinksUpdated();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/share/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const activeLinks = shareLinks.filter((s) => !s.isRevoked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Share Report</h3>
              <p className="text-xs text-slate-400">Create safe, read-only tokenized public links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Assurance Banner */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 flex items-start gap-3">
          <Lock className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs text-indigo-200/90 leading-relaxed">
            <strong>Strict Isolation Guarantee:</strong> Viewers can only view the computed report and inspect calculation audits. They cannot access raw CSV files, other reports, or any private account data.
          </div>
        </div>

        {/* Create Link Controls */}
        <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Link Expiration Window
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '1 Hour', value: 1 },
              { label: '24 Hours', value: 24 },
              { label: '7 Days', value: 168 },
              { label: 'Never', value: null },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setExpiresInHours(opt.value)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                  expiresInHours === opt.value
                    ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-sm'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateLink}
            disabled={creating}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            {creating ? 'Generating Secure Token...' : 'Generate Share Link'}
          </button>
        </div>

        {/* Active Share Links List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Active Shared Links ({activeLinks.length})
          </h4>

          {activeLinks.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No active share links. Generate one above.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {activeLinks.map((link) => {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const fullUrl = `${origin}/share/${link.token}`;

                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-300 font-semibold truncate">
                          ...{link.token.slice(-12)}
                        </span>
                        <a
                          href={`/share/${link.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-white"
                          title="Open preview"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {link.expiresAt
                          ? `Expires: ${new Date(link.expiresAt).toLocaleString()}`
                          : 'Never expires'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(link.token)}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-white/10 transition-colors"
                      >
                        {copiedToken === link.token ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRevoke(link.id)}
                        className="rounded-md border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Revoke Link Instantly"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
