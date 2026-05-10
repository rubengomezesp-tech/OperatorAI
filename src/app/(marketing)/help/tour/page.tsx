import type { Metadata } from 'next';
import { ToursIndexClient } from './tours-index-client';

export const metadata: Metadata = {
  title: 'Product tours — Operator AI',
  description: 'Interactive tours for every feature of Operator AI.',
};

export default function ToursIndexPage() {
  return <ToursIndexClient />;
}
