// src/components/widgets/AscentSmsPrefsWidget.jsx
//
// Ascent Revamp WS-5 — Phone verification + SMS notification opt-in.
// Drops into Locker. Self-contained (its own state, its own writes).
//
// Flow:
//   1. User types phone (E.164: +14155551212).
//   2. "Send Code" calls `sendPhoneVerification` callable.
//   3. User enters 6-digit code.
//   4. "Verify" calls `verifyPhoneCode` callable, which writes
//      `profile.phone` and `profile.phoneVerified=true`.
//   5. Once verified, user can toggle `notifications.sms` on/off.

import React, { useEffect, useState } from 'react';
import {
  Smartphone, ShieldCheck, Loader2, AlertCircle, Send,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';

// Normalize to E.164. Accepts:
//   "+14155551212"        → "+14155551212"
//   "14155551212"         → "+14155551212"
//   "415-555-1212"        → "+14155551212"  (assumes US/CA if 10 digits)
//   "(415) 555 1212"      → "+14155551212"
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

const AscentSmsPrefsWidget = () => {
  const { db, user } = useAppServices();
  const userId = user?.uid;

  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState('idle'); // idle | sending | sent | verifying
  const [error, setError] = useState(null);
  const [smsBusy, setSmsBusy] = useState(false);

  useEffect(() => {
    if (!db || !userId) return undefined;
    return onSnapshot(doc(db, 'users', userId), (snap) => {
      const data = snap.data() || {};
      setProfile(data.profile || null);
      if (!phone && data.profile?.phone) setPhone(data.profile.phone);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, userId]);

  const verified = !!profile?.phoneVerified && profile?.phone === phone;
  const smsOn = !!profile?.notifications?.sms;

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
        { merge: true }
      );
    } finally {
      setSmsBusy(false);
    }
  };

  return (
    <Card className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-teal relative overflow-hidden p-5">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="w-5 h-5 text-corporate-teal" />
        <h3 className="text-base font-semibold text-corporate-navy dark:text-white">
          Text Message Notifications
        </h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Get nudges and reminders by SMS. Verify your phone first.
      </p>

      <label
        htmlFor="ascent-sms-phone"
        className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
      >
        Mobile Number
      </label>
      <div className="flex gap-2 mb-3">
        <input
          id="ascent-sms-phone"
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
          disabled={!phoneIsValid(phone) || stage === 'sending' || verified}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50"
        >
          {stage === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {verified ? 'Verified' : 'Send Code'}
        </button>
      </div>

      {(stage === 'sent' || stage === 'verifying') && !verified && (
        <div className="mb-3">
          <label
            htmlFor="ascent-sms-code"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
          >
            6-digit Code
          </label>
          <div className="flex gap-2">
            <input
              id="ascent-sms-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={stage === 'verifying'}
              className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tracking-widest font-mono focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal"
            />
            <button
              type="button"
              onClick={onVerify}
              disabled={code.length !== 6 || stage === 'verifying'}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-corporate-orange text-white hover:bg-corporate-orange/90 disabled:opacity-50"
            >
              {stage === 'verifying' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
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
                {smsOn ? 'On — you’ll get rep nudges and reminders.' : 'Off — opt in to start receiving SMS nudges.'}
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
    </Card>
  );
};

export default AscentSmsPrefsWidget;
