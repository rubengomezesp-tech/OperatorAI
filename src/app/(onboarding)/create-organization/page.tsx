'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';

export default function CreateOrgPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const res = await fetch('/api/organizations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      return toast.error(body?.error ?? 'Failed to create organization');
    }

    const orgId: string = body.id;
    document.cookie = 'operator.org_id=' + orgId + '; path=/; max-age=' + (60 * 60 * 24 * 365) + '; samesite=lax';
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h1 className="font-display text-[28px]">Create your workspace</h1>
          <p className="text-[13.5px] text-fg-muted mt-1">
            This is your company or personal brand space. You can create more later.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" placeholder="Aurora Studio" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button size="lg" className="w-full" loading={loading}>Create workspace</Button>
        </form>
      </CardBody>
    </Card>
  );
}
