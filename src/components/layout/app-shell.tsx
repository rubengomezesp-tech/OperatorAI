'use client';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell({
  email, fullName, children,
}: { email: string; fullName: string | null; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar email={email} fullName={fullName} />
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
