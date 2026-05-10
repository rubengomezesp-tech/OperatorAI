'use client';

import { useState } from 'react';
import { Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 🔒 SETTINGS / PRIVACY
 *
 * GDPR controls:
 *   - Export all data (JSON download)
 *   - Delete account (with confirmation)
 */

export default function PrivacyPage() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `operator-ai-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success('Datos exportados correctamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Escribe "DELETE" para confirmar');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      // Sign out + redirect (server-side cleanup happened, client cookie still active)
      window.location.href = '/login?deleted=1';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          Settings · Privacy
        </div>
        <h1 className="font-display text-[32px]">Privacidad y datos</h1>
        <p className="text-[14px] text-fg-muted mt-2 max-w-[560px]">
          Tus datos te pertenecen. Puedes descargar una copia completa o eliminar tu cuenta en cualquier momento.
        </p>
      </div>

      {/* EXPORT */}
      <div className="rounded-xl border border-border bg-surface-2 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-display text-[18px] mb-2">Exportar mis datos</h2>
            <p className="text-[13.5px] text-fg-muted leading-relaxed">
              Descarga un archivo JSON con todos tus datos: perfil, conversaciones, documentos, campañas, integraciones, memoria.
              Conforme al GDPR Artículo 20 (derecho a portabilidad).
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-surface-3 border border-border hover:border-gold/40 hover:bg-gold/10 transition-all text-[13.5px] disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{exporting ? 'Exportando...' : 'Descargar JSON'}</span>
          </button>
        </div>
      </div>

      {/* DELETE */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-[18px] text-red-300 mb-2">Eliminar cuenta</h2>
            <p className="text-[13.5px] text-fg-muted leading-relaxed">
              Esto eliminará permanentemente tu cuenta y todos los datos asociados. No se puede deshacer.
              Recibirás un email de confirmación. Conforme al GDPR Artículo 17 (derecho al olvido).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all text-[13.5px] text-red-300"
        >
          <Trash2 className="h-4 w-4" />
          <span>Eliminar mi cuenta</span>
        </button>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-red-500/30 bg-surface-2 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
              <div>
                <h3 className="font-display text-[18px] text-red-300 mb-2">¿Estás seguro?</h3>
                <p className="text-[13px] text-fg-muted leading-relaxed">
                  Esto eliminará permanentemente tu cuenta, conversaciones, documentos, campañas y todas las integraciones. <strong className="text-fg">Esta acción no se puede deshacer.</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-fg-muted mb-2">
                Escribe <span className="font-mono text-red-300">DELETE</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                className="w-full h-10 px-3 rounded-md bg-bg border border-border focus:border-red-500/40 outline-none text-[13.5px] font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 h-10 rounded-md bg-surface-3 border border-border hover:border-fg-muted transition-all text-[13.5px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-md bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-all text-[13.5px] text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{deleting ? 'Eliminando...' : 'Eliminar cuenta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
