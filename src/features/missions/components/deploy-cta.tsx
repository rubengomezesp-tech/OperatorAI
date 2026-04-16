'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function MissionsDeployCta() {
  return (
    <Link
      href="/missions/new"
      className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-md gold-grad text-bg text-[13px] font-medium hover:brightness-110 transition"
    >
      <Plus className="h-3.5 w-3.5" />
      <span>Deploy Mission</span>
    </Link>
  );
}
