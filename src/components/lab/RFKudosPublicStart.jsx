// src/components/lab/RFKudosPublicStart.jsx
//
// Public marketing landing for Reinforcing Feedback Kudos.
// Reached via ?rf-kudos-start
//
// Why a marketing landing rather than the actual tool:
//   The RF Kudos practice rep lives in the Leadership Lab sub-app
//   (leaderreps-lab.web.app) and requires sign-in — it's a personal
//   practice tool that tracks a leader's reps over time. This page sells
//   the *why* up front and CTAs visitors into Leadership Lab sign-up.
//
// On the public side, no Firestore access is required; everything is
// static + an outbound link to the sub-app's sign-up flow.

import React from 'react';
import {
  ThumbsUp,
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Heart,
  Award,
} from 'lucide-react';

const LAB_URL = 'https://leaderreps-lab.web.app/';

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

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
      <CheckCircle2 className="w-4 h-4 text-corporate-teal shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

export default function RFKudosPublicStart() {
  const goSignUp = () => {
    window.location.href = LAB_URL;
  };

  return (
    <div className="min-h-screen bg-[#FFFAF8] dark:bg-slate-950">
      {/* Hero */}
      <header className="bg-corporate-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-corporate-teal mb-3">
            <ThumbsUp className="w-4 h-4" />
            Reinforcing Feedback Kudos
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl">
            Your team can&rsquo;t repeat what they did right if you never
            tell them what it was.
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
            Reinforcing Feedback Kudos is a free practice rep from LeaderReps.
            You draft a piece of recognition for someone on your team — an AI
            coach grades it for specificity, behavior-anchoring, and impact,
            then suggests stronger versions. Get reps in before the moment
            matters.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={goSignUp}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-corporate-orange text-white text-sm md:text-base font-bold hover:bg-corporate-orange/90 transition-colors"
            >
              Open Leadership Lab — free
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/30 text-white text-sm md:text-base font-semibold hover:bg-white/10 transition-colors"
            >
              How it works
            </a>
          </div>
          <p className="mt-4 text-xs text-white/60">
            Sign-in required. The Lab tracks your reps over time so you can
            see yourself improving.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-10 md:space-y-14">
        {/* Why this rep matters */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-card">
          <div className="flex items-start gap-4">
            <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-corporate-orange/10 text-corporate-orange">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white">
                Most leaders under-deliver reinforcing feedback by 3×.
              </h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                The research is clear: the ratio of reinforcing to redirecting
                feedback should run at least 3:1. Most leaders run closer to
                1:3 — and the ones who default to corrective-only feedback
                quietly train their people to brace for criticism rather than
                reach for growth. Catching people doing things right is a
                leadership behavior, not a personality trait. It takes
                practice.
              </p>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <ValueBlock
            icon={Sparkles}
            title="AI coach grades your draft"
            body="Specificity, behavior-anchoring, and impact — the three things that make reinforcing feedback land. You see a score, what worked, and what to sharpen."
          />
          <ValueBlock
            icon={Target}
            title="Stronger version suggestions"
            body="Not a rewrite that takes your voice away — a stronger version that shows you exactly what a more specific, more behavior-anchored kudos sounds like."
          />
          <ValueBlock
            icon={Award}
            title="Reps that compound"
            body="Every kudos you practice is logged. Over weeks you can see your scores climb, your specificity tighten, and your default move shift from 'good job' to feedback that actually gets repeated."
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
                    Open Leadership Lab and create a free account
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Takes 30 seconds. The account is what lets the Lab track
                    your reps over time so you can see yourself improving.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-corporate-teal text-white font-extrabold flex items-center justify-center">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy dark:text-white">
                    Pick someone on your team
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Real person, real recent behavior. Think of something
                    they did this week you want more of.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-corporate-teal text-white font-extrabold flex items-center justify-center">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy dark:text-white">
                    Draft the kudos in your own voice
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Whatever you&rsquo;d actually say. Don&rsquo;t pre-edit —
                    the rep is more useful when the AI sees your real default.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-corporate-teal text-white font-extrabold flex items-center justify-center">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy dark:text-white">
                    See your score and a stronger version
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    The AI coach grades you on specificity, behavior-anchoring,
                    and impact — and shows you what a sharper version sounds
                    like. Send the stronger one. Run another rep tomorrow.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* What makes reinforcing feedback land */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-card">
          <h2 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white mb-4">
            What separates &ldquo;good job&rdquo; from kudos that get
            repeated
          </h2>
          <ul className="space-y-2.5">
            <Bullet>
              <strong>Specific behavior</strong> — name the exact thing they
              did, not the trait you think it reflects
            </Bullet>
            <Bullet>
              <strong>Observable moment</strong> — &ldquo;in Tuesday&rsquo;s
              standup when you asked Priya to walk through her reasoning&rdquo;
              beats &ldquo;your leadership in meetings&rdquo;
            </Bullet>
            <Bullet>
              <strong>Impact</strong> — what changed because of it: for the
              team, the customer, the work
            </Bullet>
            <Bullet>
              <strong>Repeatable</strong> — they can read your kudos and know
              what to do again on Monday
            </Bullet>
            <Bullet>
              <strong>Timely</strong> — within a week, not at the annual
              review
            </Bullet>
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-corporate-teal text-white rounded-2xl p-8 md:p-12 text-center shadow-card">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Run one rep today. Your team will feel the difference this week.
          </h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Free. Five minutes. No team admin required — this is a personal
            practice tool, between you and an AI coach.
          </p>
          <button
            onClick={goSignUp}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-corporate-teal text-sm md:text-base font-bold hover:bg-white/90 transition-colors"
          >
            Open Leadership Lab
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        <footer className="text-center text-xs text-slate-500 dark:text-slate-400 pt-6">
          A LeaderReps Lab experiment. Questions? Email
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
