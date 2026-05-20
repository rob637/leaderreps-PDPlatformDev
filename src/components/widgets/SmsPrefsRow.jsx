// src/components/widgets/SmsPrefsRow.jsx
//
// SMS phone-verification + opt-in, presented as a single row inside the
// "My Settings" card. Click the row → modal with the verify flow.
//
// Replaces the standalone AscentSmsPrefsWidget card so SMS sits alongside
// the other notification-channel preferences instead of getting its own
// disproportionate card on the Locker.
//
// Flow inside the modal:
//   1. Type phone (E.164 or 10-digit US/CA).
//   2. Send Code → sendPhoneVerification callable.
//   3. Enter 6-digit code → verifyPhoneCode callable writes
//      profile.phone + profile.phoneVerified=true.
//   4. Toggle profile.notifications.sms on/off once verified.

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Smartphone,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Send,
  Edit2,
  X,
  CheckCircle,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAppServices } from '../../services/useAppServices';

// --- phone helpers ---------------------------------------------------------

const normalizeToE164 = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
};

const phoneIsValid = (p) => /^\+\d{8,15}$/.test(normalizeToE164(p));

// Mask the middle of a verified E.164 number for display:
//   "+14155551212" → "+1 415 ••• 1212"
const maskPhone = (e164) => {
  if (!e164) return '';
  const digits = e164.replace(/\D/g, '');
  if (digits.length < 6) return e164;
  const last4 = digits.slice(-4);
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 ${digits.slice(1, 4)} ••• ${last4}`;
  }
  return `+${digits.slice(0, digits.length - 7)} ••• ${last4}`;
};

// --- component -------------------------------------------------------------

const SmsPrefsRow = () => {
  const { db, user } = useAppServices();
  const userId = user?.uid;

  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState('idle'); // idle | sending | sent | verifying
  const [error, setError] = useState(null);
  const [smsBusy, setSmsBusy] = useState(false);

  // Live profile subscription so the row reflects verified state immediately
  // after the callable completes.
  useEffect(() => {
    if (!db || !userId) return undefined;
    return onSnapshot(doc(db, 'users', userId), (snap) => {
      const data = snap.data() || {};
      setProfile(data.profile || null);
      // Seed input with the stored phone when modal opens for the first time
      // OR whenever it gets verified externally.
      if (data.profile?.phone && !phone) setPhone(data.profile.phone);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, userId]);

  const storedPhone = profile?.phone || '';
  const verified = !!profile?.phoneVerified && !!storedPhone;
  const smsOn = !!profile?.notifications?.sms;

  // --- row content -----------------
  // Subtitle reflects three states: verified+on, verified+off, not set up.
  let subtitle;
  if (verified && smsOn) subtitle = `On · ${maskPhone(storedPhone)}`;
  else if (verified) subtitle = `Verified · ${maskPhone(storedPhone)}`;
  else subtitle = 'Not set up';

  const ctaLabel = verified ? 'Edit' : 'Set up';

  // --- modal actions ----------------
  const onSendCode = async () => {
    setError(null);
    const e164 = normalizeToE164(phone);
    if (!phoneIsValid(phone)) {
      setError('Enter a valid mobile number (10 digits for US/CA, or full international with +).');
      return;
    }
    setStage('sending');
    try {
      const fn = httpsCallable(getFunctions(), 'sendPhoneVerification');
      await fn({ phone: e164 });
      setPhone(e164);
      setStage('sent');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('sendPhoneVerification failed', err);
      setError(err?.message || 'Could not send code.');
      setStage('idle');
    }
  };

  const onVerify = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code.');
      return;
    }
    setStage('verifying');
    try {
      const fn = httpsCallable(getFunctions(), 'verifyPhoneCode');
      await fn({ phone: normalizeToE164(phone), code: code.trim() });
      setCode('');
      setStage('idle');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('verifyPhoneCode failed', err);
      setError(err?.message || 'Could not verify code.');
      setStage('sent');
    }
  };

  const toggleSms = async (next) => {
    if (!db || !userId) return;
    setSmsBusy(true);
    try {
      await setDoc(
        doc(db, 'users', userId),
        { profile: { notifications: { sms: next } } },
        { merge: true },
      );
    } finally {
      setSmsBusy(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setError(null);
    setCode('');
    setStage('idle');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-corporate-teal/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              verified
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-slate-100 dark:bg-slate-700'
            }`}
          >
            {verified ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Smartphone className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="text-left">
            <h4 className="font-medium text-corporate-navy dark:text-white text-sm">
              Text Messages
            </h4>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-corporate-teal-ink">
          <span className="text-xs font-medium">{ctaLabel}</span>
          <Edit2 className="w-3.5 h-3.5" />
        </div>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-8 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onClick={closeModal}
          >
            <div
              className="relative w-full max-w-md my-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-corporate-teal" />
                  <h3 className="text-base font-semibold text-corporate-navy dark:text-white">
                    Text Message Notifications
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Get nudges and reminders by SMS. Verify your phone first.
                </p>

                <label
                  htmlFor="sms-row-phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Mobile Number
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    id="sms-row-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(415) 555-1212"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={stage === 'sending' || stage === 'verifying'}
                    className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal"
                  />
                  <button
                    type="button"
                    onClick={onSendCode}
                    disabled={
                      !phoneIsValid(phone) ||
                      stage === 'sending' ||
                      (verified && normalizeToE164(phone) === storedPhone)
                    }
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50"
                  >
                    {stage === 'sending' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {verified && normalizeToE164(phone) === storedPhone
                      ? 'Verified'
                      : 'Send Code'}
                  </button>
                </div>

                {(stage === 'sent' || stage === 'verifying') &&
                  !(verified && normalizeToE164(phone) === storedPhone) && (
                    <div className="mb-3">
                      <label
                        htmlFor="sms-row-code"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
                      >
                        6-digit Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="sms-row-code"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={code}
                          onChange={(e) =>
                            setCode(e.target.value.replace(/\D/g, ''))
                          }
                          disabled={stage === 'verifying'}
                          className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tracking-widest font-mono focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal"
                        />
                        <button
                          type="button"
                          onClick={onVerify}
                          disabled={code.length !== 6 || stage === 'verifying'}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-corporate-orange text-white hover:bg-corporate-orange/90 disabled:opacity-50"
                        >
                          {stage === 'verifying' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                {error && (
                  <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {verified && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          SMS Notifications
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {smsOn
                            ? 'On — you’ll get rep nudges and reminders.'
                            : 'Off — opt in to start receiving SMS nudges.'}
                        </div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={smsOn}
                          onChange={(e) => toggleSms(e.target.checked)}
                          disabled={smsBusy}
                        />
                        <span className="w-11 h-6 bg-slate-300 peer-checked:bg-corporate-teal rounded-full transition relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:transition peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default SmsPrefsRow;
