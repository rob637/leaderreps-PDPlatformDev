// src/components/screens/AskCoach.jsx
//
// Ascent Revamp — Ask a Coach screen (NEW).
// PLACEHOLDER for WS-4. Real implementation will:
//   - Message-board UI (list of posts: title + scenario body + tags).
//   - Any Ascent participant can post a question.
//   - Only Christina + Ryan (admin allowlist) respond — via short video reply.
//   - New collections: `coach_questions`, `coach_questions/{id}/responses`.
//   - Videos stored in Firebase Storage at `coach-responses/{questionId}/`.
//   - Cloud Function notifies admins on new post.

import React from 'react';
import { MessageCircleQuestion, Construction } from 'lucide-react';

const AskCoach = () => {
  return (
    <div className="max-w-[860px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <MessageCircleQuestion className="w-8 h-8 text-corporate-teal" />
          <h1
            className="text-3xl font-bold text-corporate-navy dark:text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ask a Coach
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Post a scenario or question. Christina or Ryan will reply with a short
          video.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Construction className="w-12 h-12 mx-auto text-corporate-orange mb-4" />
        <h2 className="text-xl font-semibold text-corporate-navy dark:text-white mb-2">
          Coming for May 11
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          A new way to get a real human, on-camera answer to specific leadership
          situations you're working through.
        </p>
      </div>
    </div>
  );
};

export default AskCoach;
