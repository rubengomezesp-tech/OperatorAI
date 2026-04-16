import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome — Operator AI',
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
