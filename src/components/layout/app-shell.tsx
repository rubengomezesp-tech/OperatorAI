'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell({
  email,
  fullName,
  children,
}: {
  email: string;
  fullName: string | null;
  children: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');

    const update = () => setIsDesktop(mq.matches);

    update();
    mq.addEventListener('change', update);

    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div className="flex min-h-[var(--vvh,100dvh)] w-full overflow-x-hidden">
      {isDesktop ? <Sidebar /> : null}

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar email={email} fullName={fullName} />
        <main className="flex-1 min-w-0 overflow-x-hidden relative">{children}</main>
      </div>
    </div>
  );
}
