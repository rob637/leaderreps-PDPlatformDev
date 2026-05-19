// src/components/admin/crm/components/ConfirmDialog.jsx
//
// Shared confirmation dialog for the CRM. Replaces native window.confirm()
// for a modern, accessible, themeable experience.
//
// Usage (imperative — drop-in confirm() replacement):
//   const confirm = useConfirm();
//   if (await confirm({ title: 'Delete?', message: '...', tone: 'danger' })) {
//     // user confirmed
//   }
//
// Usage (declarative):
//   <ConfirmDialog
//     open={open}
//     title="Delete?"
//     message="This cannot be undone."
//     tone="danger"
//     onConfirm={...}
//     onCancel={() => setOpen(false)}
//   />

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, Info } from 'lucide-react';

const TONES = {
  danger: {
    Icon: AlertTriangle,
    iconWrap: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
    defaultLabel: 'Delete',
  },
  warning: {
    Icon: AlertTriangle,
    iconWrap: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500',
    defaultLabel: 'Continue',
  },
  info: {
    Icon: Info,
    iconWrap: 'bg-corporate-teal/10 text-corporate-teal dark:bg-corporate-teal/20',
    confirmBtn:
      'bg-corporate-teal hover:bg-corporate-teal-ink text-white focus-visible:ring-corporate-teal',
    defaultLabel: 'Confirm',
  },
  question: {
    Icon: HelpCircle,
    iconWrap: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    confirmBtn:
      'bg-corporate-navy hover:bg-corporate-navy-ink text-white focus-visible:ring-corporate-navy',
    defaultLabel: 'OK',
  },
};

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = '',
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'question',
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);
  const config = TONES[tone] || TONES.question;
  const { Icon } = config;
  const finalConfirmLabel = confirmLabel || config.defaultLabel;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    document.addEventListener('keydown', onKey);
    // Focus confirm button on next tick so the user can press Enter immediately.
    const t = setTimeout(() => confirmRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.iconWrap}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirm-dialog-title"
                className="text-base font-semibold text-slate-900 dark:text-white"
              >
                {title}
              </h3>
              {message && (
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${config.confirmBtn}`}
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Imperative API: useConfirm() returns an async function
// ─────────────────────────────────────────────────────────────────────────────

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: undefined,
    cancelLabel: 'Cancel',
    tone: 'question',
    resolver: null,
  });

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        setState({
          open: true,
          title: opts.title || 'Are you sure?',
          message: opts.message || '',
          confirmLabel: opts.confirmLabel,
          cancelLabel: opts.cancelLabel || 'Cancel',
          tone: opts.tone || 'question',
          resolver: resolve,
        });
      }),
    []
  );

  const close = useCallback(
    (result) => {
      state.resolver?.(result);
      setState((s) => ({ ...s, open: false, resolver: null }));
    },
    [state]
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        tone={state.tone}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback to window.confirm() if provider isn't mounted, so callers
    // never crash. Logged once for visibility during development.
    if (typeof window !== 'undefined' && !window.__crmConfirmFallbackWarned) {
      window.__crmConfirmFallbackWarned = true;
      // eslint-disable-next-line no-console
      console.warn('[CRM] useConfirm() called without <ConfirmProvider>; using window.confirm fallback.');
    }
    return async (opts = {}) =>
      // eslint-disable-next-line no-alert
      window.confirm(`${opts.title || ''}\n\n${opts.message || ''}`.trim());
  }
  return ctx;
}

export default ConfirmDialog;
