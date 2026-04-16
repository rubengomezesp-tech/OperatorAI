'use client';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

let initialized = false;

export function initPostHog() {
  if (typeof window === 'undefined' || initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (p) => {
      if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
        p.debug(false);
      }
    },
  });
  initialized = true;
}

export function usePostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!initialized || !pathname) return;
    let url = window.origin + pathname;
    if (searchParams?.toString()) url += '?' + searchParams.toString();
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);
}

export function identifyUser(userId: string, email: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, { email, ...properties });
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}
