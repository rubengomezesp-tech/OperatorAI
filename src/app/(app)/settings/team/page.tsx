'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Mail, Crown, ShieldCheck, User as UserIcon, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: string;
  is_self: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3.5 w-3.5 text-gold" />,
  admin: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />,
  member: <UserIcon className="h-3.5 w-3.5 text-fg-muted" />,
  viewer: <Eye className="h-3.5 w-3.5 text-fg-subtle" />,
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);

  async function fetchTeam() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/team/list');
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const body = await res.json();
      setMembers(body.members ?? []);
      setInvitations(body.invitations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeam();
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteModal(false);
      fetchTeam();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(id: string, email: string) {
    if (!confirm(`Remove ${email} from the team?`)) return;
    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_id: id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      toast.success('Member removed');
      fetchTeam();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleCancelInvite(id: string, email: string) {
    if (!confirm(`Cancel invitation to ${email}?`)) return;
    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_id: id }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error ?? 'Failed');
      }
      toast.success('Invitation cancelled');
      fetchTeam();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  const myRole = members.find((m) => m.is_self)?.role;
  const canInvite = myRole === 'owner' || myRole === 'admin';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
            Settings · Team
          </div>
          <h1 className="font-display text-[32px]">Team members</h1>
          <p className="text-[14px] text-fg-muted mt-2">
            Invite collaborators and manage their access.
          </p>
        </div>
        {canInvite && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-gold text-bg font-medium hover:brightness-110 transition-all text-[13.5px]"
          >
            <Plus className="h-4 w-4" />
            Invite member
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-border bg-surface-2 p-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-gold mx-auto" />
        </div>
      )}

      {!loading && (
        <>
          {/* Members */}
          <div className="rounded-xl border border-border bg-surface-2 divide-y divide-border">
            <div className="px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
              Active members ({members.length})
            </div>
            {members.map((m) => (
              <div key={m.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-surface-3 border border-border flex items-center justify-center text-[12px] font-medium text-fg-muted">
                    {(m.name || m.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] text-fg flex items-center gap-2">
                      {m.name || m.email}
                      {m.is_self && (
                        <span className="text-[10px] uppercase tracking-[0.1em] text-fg-subtle">
                          (you)
                        </span>
                      )}
                    </div>
                    {m.name && <div className="text-[12px] text-fg-muted">{m.email}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 h-6 px-2 rounded bg-surface-3 border border-border text-[11px]">
                    {ROLE_ICONS[m.role]}
                    <span>{ROLE_LABELS[m.role]}</span>
                  </div>
                  {!m.is_self && canInvite && m.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id, m.email)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-red-500/10 hover:text-red-400 text-fg-subtle transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="rounded-xl border border-border bg-surface-2 divide-y divide-border">
              <div className="px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                Pending invitations ({invitations.length})
              </div>
              {invitations.map((inv) => (
                <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-surface-3 border border-border flex items-center justify-center">
                      <Mail className="h-3.5 w-3.5 text-fg-muted" />
                    </div>
                    <div>
                      <div className="text-[14px] text-fg">{inv.email}</div>
                      <div className="text-[12px] text-fg-muted">
                        Invited as {inv.role} · expires{' '}
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {canInvite && (
                    <button
                      type="button"
                      onClick={() => handleCancelInvite(inv.id, inv.email)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-red-500/10 hover:text-red-400 text-fg-subtle transition-colors"
                      title="Cancel invitation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !inviting && setShowInviteModal(false)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-border bg-surface-2 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-display text-[18px] mb-1">Invite a teammate</h3>
              <p className="text-[13px] text-fg-muted">
                Send an invite link via email. They&apos;ll join when they accept.
              </p>
            </div>

            <div>
              <label className="block text-[12px] text-fg-muted mb-2">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                disabled={inviting}
                className="w-full h-10 px-3 rounded-md bg-bg border border-border focus:border-gold/40 outline-none text-[13.5px]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[12px] text-fg-muted mb-2">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['admin', 'member', 'viewer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    disabled={inviting}
                    className={`h-9 rounded-md border text-[12.5px] capitalize transition-all ${
                      inviteRole === r
                        ? 'bg-gold/10 border-gold/40 text-gold'
                        : 'bg-bg border-border hover:border-fg-muted'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                disabled={inviting}
                className="flex-1 h-10 rounded-md bg-surface-3 border border-border hover:border-fg-muted transition-all text-[13.5px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-md bg-gold text-bg font-medium hover:brightness-110 transition-all text-[13.5px] disabled:opacity-50"
              >
                {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{inviting ? 'Sending...' : 'Send invite'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
