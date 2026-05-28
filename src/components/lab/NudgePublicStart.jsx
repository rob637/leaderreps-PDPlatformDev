// src/components/lab/NudgePublicStart.jsx
//
// Public marketing landing for Constructive Nudges.
// Reached via ?nudge-start
//
// Why this is a marketing page rather than a public composer:
//   The `sendNudge` Cloud Function requires Firebase Auth by design. The
//   threat model for anonymous-to-recipient upward feedback requires that
//   the *platform* knows who sent it (for moderation, rate limiting, and
//   abuse response) even when the recipient does not. So sending a nudge
//   requires a (free) account.
//
// This page:
//   1. Sells the value of the tool
//   2. Shows the safety/moderation guardrails up front (de-risks)
//   3. CTAs to free sign-up → in-platform composer at `lab-nudges`
//
// On the public side, no Firestore access is required; everything is
// static + a single nav CTA back into the main app's auth flow.

import React from 'react';
import {
  MessageSquareWarning,
  ShieldCheck,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Heart,
} from 'lucide-react';

function ValueBlock({ icon: Icon, title, body }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-corporate-teal/10 text-corporate-teal mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-extrabold text-corporate-navy dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function GuardrailRow({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
      <CheckCircle2 className="w-4 h-4 text-corporate-teal shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

export default function NudgePublicStart() {
  // The main app's auth flow lives at the root URL. Removing the query
  // string sends the visitor through the standard sign-in / sign-up path
  // and then into the in-platform composer once authenticated.
  const goSignIn = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#FFFAF8] dark:bg-slate-950">
      {/* Hero */}
      <header className="bg-corporate-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-corporate-teal mb-3">
            <MessageSquareWarning className="w-4 h-4" />
            Constructive Nudges
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl">
            Tell your manager what would make them better — anonymously, and
            without it being weird.
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
            Constructive Nudges is a free tool from LeaderReps. Pick from a
            curated catalog of common boss patterns, get auto-suggested
            improvements, write a short note, and we send it to your manager
            anonymously. AI screens every nudge for attacks, accusations, and
            identifying details before it leaves the platform.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={goSignIn}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-corporate-orange text-white text-sm md:text-base font-bold hover:bg-corporate-orange/90 transition-colors"
            >
              Create a free account to send a nudge
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/30 text-white text-sm md:text-base font-semibold hover:bg-white/10 transition-colors"
            >
              How it works
            </a>
          </div>
          <p className="mt-4 text-xs text-white/60 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Free account required to send. We need to know who sent it (your
            manager will never).
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-10 md:space-y-14">
        {/* Why */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <ValueBlock
            icon={EyeOff}
            title="Truly anonymous to your manager"
            body="They see the nudge, the issue pattern, and the suggestion. They never see your name, email, or any detail that would identify you."
          />
          <ValueBlock
            icon={ShieldCheck}
            title="Safe by design"
            body="Every nudge is screened for personal attacks, accusations, and identity-leaking details before it leaves the platform. If something needs softening, we suggest a rewrite."
          />
          <ValueBlock
            icon={Sparkles}
            title="Constructive, not corrosive"
            body="Pull from a curated catalog of common manager patterns — we auto-suggest research-backed improvements and a small practice rep your manager can try."
          />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-corporate-navy dark:text-white">
            How it works
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-card">
            <ol className="space-y-5">
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-corporate-teal text-white font-extrabold flex items-center justify-center">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy dark:text-white">
                    Create a free account
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Takes 30 seconds. We need an account so we can rate-limit,
                    moderate, and respond to abuse — never to identify you to
                    your manager.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-corporate-teal text-white font-extrabold flex items-center justify-center">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy dark:text-white">
                    Pick the pattern(s)
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Choose up to three issues from a curated catalog (e.g.
                    &ldquo;runs over people in meetings,&rdquo; &ldquo;changes
                    direction without context&rdquo;). We auto-suggest the
                    improvements and the practice rep that would help.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-corporate-teal text-white font-extrabold flex items-center justify-center">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy dark:text-white">
                    Write your note
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Optional. Up to 800 characters in your own voice. Our
                    safety AI scans for attacks, accusations, and identifying
                    details — and suggests a rewrite if needed.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-corporate-teal text-white font-extrabold flex items-center justify-center">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy dark:text-white">
                    Send anonymously
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Your manager receives a short, kind, useful email from
                    LeaderReps. No sender info. No way to trace it. Just the
                    nudge and a research-backed suggestion.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Guardrails */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-card">
          <h2 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white mb-4">
            What we will not let through
          </h2>
          <ul className="space-y-2.5">
            <GuardrailRow>
              Personal attacks, name-calling, or character assassinations
            </GuardrailRow>
            <GuardrailRow>
              Specific accusations of misconduct (those need a real channel —
              not an anonymous nudge)
            </GuardrailRow>
            <GuardrailRow>
              Details that would identify you (specific meetings, dates, roles,
              quoted phrases that only you would know)
            </GuardrailRow>
            <GuardrailRow>
              Anything we judge as likely to escalate rather than nudge
            </GuardrailRow>
            <GuardrailRow>
              Rate-limited: you can send a small number per week. This is
              feedback, not a campaign.
            </GuardrailRow>
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-corporate-teal text-white rounded-2xl p-8 md:p-12 text-center shadow-card">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Your manager probably wants to know.
          </h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Most leaders genuinely want to be better — they just don&rsquo;t
            hear what would help. Give them that in a way that&rsquo;s safe for
            both of you.
          </p>
          <button
            onClick={goSignIn}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-corporate-teal text-sm md:text-base font-bold hover:bg-white/90 transition-colors"
          >
            Get started — free
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        <footer className="text-center text-xs text-slate-500 dark:text-slate-400 pt-6">
          A LeaderReps Lab experiment. Questions? Concerns? Email
          <a
            href="mailto:hello@leaderreps.com"
            className="text-corporate-teal hover:underline ml-1"
          >
            hello@leaderreps.com
          </a>
          .
        </footer>
      </main>
    </div>
  );
}
