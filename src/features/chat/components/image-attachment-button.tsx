'use client';
import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

export interface AttachedImage {
  base64: string;
  mimeType: string;
  preview: string;
  name: string;
}

interface Props {
  attached: AttachedImage | null;
  onAttach: (img: AttachedImage | null) => void;
  disabled?: boolean;
}

export function ImageAttachmentButton({ attached, onAttach, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5 MB)');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        onAttach({
          base64,
          mimeType: file.type,
          preview: result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (attached) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-1.5">
        <img src={attached.preview} alt="attached" className="h-8 w-8 rounded object-cover" />
        <span className="text-[11.5px] text-fg-muted truncate max-w-[140px]">{attached.name}</span>
        <button
          type="button"
          onClick={() => onAttach(null)}
          className="h-5 w-5 rounded text-fg-muted hover:text-danger flex items-center justify-center"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
        className="h-9 w-9 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40 transition flex items-center justify-center disabled:opacity-50"
        title="Attach image"
      >
        <Paperclip className="h-3.5 w-3.5" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </>
  );
}
