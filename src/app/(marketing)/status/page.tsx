import { Metadata } from 'next';
import { StatusPageClient } from './status-client';

export const metadata: Metadata = {
  title: 'Status — Operator AI',
  description: 'Real-time status of Operator AI services.',
};

export const dynamic = 'force-dynamic';

export default function StatusPage() {
  return <StatusPageClient />;
}
