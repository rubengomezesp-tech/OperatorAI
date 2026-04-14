'use client';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { setOrgCookie } from './org-cookie';
import type { Organization } from '../types';

interface OrgContextValue {
  current: Organization;
  orgs: Organization[];
  switchOrg: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  initialOrg, initialOrgs, children,
}: {
  initialOrg: Organization;
  initialOrgs: Organization[];
  children: React.ReactNode;
}) {
  const [current, setCurrent] = useState(initialOrg);
  useEffect(() => { setOrgCookie(current.id); }, [current.id]);

  const value = useMemo<OrgContextValue>(
    () => ({
      current,
      orgs: initialOrgs,
      switchOrg: (orgId) => {
        const next = initialOrgs.find((o) => o.id === orgId);
        if (next) {
          setCurrent(next);
          window.location.assign('/dashboard');
        }
      },
    }),
    [current, initialOrgs],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used inside OrgProvider');
  return ctx;
}
