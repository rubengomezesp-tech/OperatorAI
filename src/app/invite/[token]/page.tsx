'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * 📧 INVITE ACCEPT PAGE
 *
 * Public page at /invite/[token]
 *
 * Flow:
 *   1. User clicks email link → arrives here
 *   2. If not logged in → "Sign in to accept" link
 *   3. If logged in → POST /api/team/accept with token
 *   4. Success → redirect to /chat
 *   5. Error → show message
 */
export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'auth_required' | 'success' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.token) return;

    (async () => {
      try {
        const res = await fetch('/api/team/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token }),
        });

        if (res.status === 401) {
          setStatus('auth_required');
          return;
        }

        const body = await res.json();
        if (!res.ok) {
          setError(body?.error ?? 'Failed to accept invitation');
          setStatus('error');
          return;
        }

        setStatus('success');
        setTimeout(() => router.push('/chat'), 1500);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
        setStatus('error');
      }
    })();
  }, [params.token, router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
            Operator AI · Invitation
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
              <p className="text-[14px] text-fg-muted">Verifying invitation...</p>
            </>
          )}

          {status === 'auth_required' && (
            <>
              <h2 className="font-display text-[20px]">Sign in to accept</h2>
              <p className="text-[13.5px] text-fg-muted leading-relaxed">
                You need to be signed in with the email this invitation was sent to.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={`/login?next=/invite/${params.token}`}
                  className="h-10 inline-flex items-center justify-center rounded-md bg-gold text-bg font-medium hover:brightness-110 transition-all text-[13.5px]"
                >
                  Sign in
                </Link>
                <Link
                  href={`/signup?next=/invite/${params.token}`}
                  className="h-10 inline-flex items-center justify-center rounded-md bg-surface-3 border border-border hover:border-fg-muted transition-all text-[13.5px]"
                >
                  Create account
                </Link>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h2 className="font-display text-[20px]">You&apos;re in!</h2>
              <p className="text-[13.5px] text-fg-muted">Redirecting to your workspace...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
              <h2 className="font-display text-[20px]">Invitation issue</h2>
              <p className="text-[13.5px] text-fg-muted">{error}</p>
              <Link
                href="/chat"
                className="inline-block mt-2 text-[13px] text-gold hover:underline"
              >
                Go to your workspace →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
