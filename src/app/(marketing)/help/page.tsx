import type { Metadata } from 'next';
import { HelpCenterClient } from './help-center-client';

export const metadata: Metadata = {
  title: 'Help center — Operator AI',
  description: 'Everything you need to know about Operator AI. Browse by category or search.',
};

export default function HelpCenterPage() {
  return <HelpCenterClient />;
}
