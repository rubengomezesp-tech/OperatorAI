/* eslint-disable @next/next/no-img-element */
'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface Props {
  email: string;
  fullName: string;
  avatarUrl: string;
  userId: string;
}

export function ProfileForm({ email, fullName: initialName, avatarUrl: initialAvatar, userId }: Props) {
  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = (fullName || email || 'U')
    .split(/[\s@.]/).filter(Boolean).slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '').join('') || 'U';

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2 MB)');
      return;
    }

    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl + '?t=' + Date.now());
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl },
      });
      if (error) throw error;
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-20 w-20 rounded-full gold-grad flex items-center justify-center text-bg text-[24px] font-display">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-1.5">
                Profile photo
              </label>
              <label className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface-2 text-[12.5px] text-fg-muted hover:text-gold hover:border-gold/40 cursor-pointer transition">
                <span>{uploading ? 'Uploading…' : 'Choose image'}</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
              <p className="text-[11px] text-fg-subtle mt-1.5">PNG or JPG, max 2 MB</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-md border border-border bg-surface/50 px-3 py-2.5 text-[14px] text-fg-muted cursor-not-allowed"
            />
            <p className="text-[11px] text-fg-subtle">Contact support to change your email.</p>
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              <span>Save changes</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
