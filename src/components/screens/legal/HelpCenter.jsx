import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, BookOpen, Users, Settings, Zap, Calendar, Target } from 'lucide-react';
import PageLayout from '../../ui/PageLayout';
import { Card } from '../../ui';

// FAQ Categories with questions and answers
const FAQ_DATA = [
  {
    category: 'Getting Started',
    icon: Zap,
    questions: [
      {
        q: 'What is the LeaderReps PD Platform?',
        a: 'LeaderReps PD Platform is a comprehensive leadership development application designed to help you build and strengthen your leadership skills through daily practice, structured learning, and personalized coaching.'
      },
      {
        q: 'How do I complete the Prep Phase?',
        a: 'During the Prep Phase, you need to complete two required items: your Leader Profile and the Baseline Assessment. Once both are complete, you\'ll unlock additional tools like Win the Day and PM Reflection to practice before your cohort begins.'
      },
      {
        q: 'What is the Foundation Prep phase?',
        a: 'Foundation Prep is the onboarding period before your cohort officially starts. Use this time to set up your profile, complete your baseline assessment, and familiarize yourself with the daily leadership tools you\'ll be using throughout the program.'
      }
    ]
  },
  {
    category: 'Daily Practice',
    icon: Target,
    questions: [
      {
        q: 'What is "Win the Day"?',
        a: 'Win the Day is your morning planning tool where you set your top 3 priorities for the day. Starting each morning with clear intentions helps you focus on what matters most and builds consistency in your leadership practice.'
      },
      {
        q: 'What is the PM Reflection?',
        a: 'The PM Reflection is your end-of-day check-in where you reflect on what went well, what needs work, and capture a closing thought. This daily reflection habit accelerates your growth by turning experiences into insights.'
      },
      {
        q: 'What is the Grounding Rep?',
        a: 'The Grounding Rep is a quick morning ritual where you read your Leadership Identity Statement (LIS). This brief practice keeps you connected to who you want to be as a leader and sets a positive intention for your day.'
      },
      {
        q: 'How do Daily Reps work?',
        a: 'Daily Reps are specific leadership behaviors you practice each day. They\'re targeted micro-practices that build your leadership muscles over time through consistent repetition.'
      }
    ]
  },
  {
    category: 'Program & Cohorts',
    icon: Users,
    questions: [
      {
        q: 'What is a cohort?',
        a: 'A cohort is a group of leaders who go through the program together. You\'ll have scheduled live sessions with your cohort and a facilitator who guides your learning journey.'
      },
      {
        q: 'How long is the program?',
        a: 'The core program runs for 8 weeks, with weekly live sessions and daily practice between sessions. After the 8-week program, you continue with ongoing daily practice and access to resources.'
      },
      {
        q: 'What happens in Session One?',
        a: 'Session One is your cohort\'s first live meeting where you\'ll meet your facilitator and fellow cohort members, establish group norms, and begin your structured leadership journey together.'
      }
    ]
  },
  {
    category: 'Content & Resources',
    icon: BookOpen,
    questions: [
      {
        q: 'What is the Content Library?',
        a: 'The Content Library contains curated leadership resources including reading materials, videos, and tools organized by topic. Content is released progressively as you advance through the program.'
      },
      {
        q: 'How do I access videos and readings?',
        a: 'Videos and readings appear in your Daily Plan based on your current week in the program. You can also browse the full Content Library from the navigation menu to explore available materials.'
      },
      {
        q: 'What are Leader Reps?',
        a: 'Leader Reps are structured practice exercises that help you apply leadership concepts in real-world situations. Each rep focuses on a specific skill like giving feedback, running meetings, or coaching conversations.'
      }
    ]
  },
  {
    category: 'Account & Settings',
    icon: Settings,
    questions: [
      {
        q: 'How do I update my profile?',
        a: 'You can update your Leader Profile at any time through the Settings menu. Changes to your profile help personalize your experience and recommendations.'
      },
      {
        q: 'How do I change my notification preferences?',
        a: 'Notification preferences can be updated in your Leader Profile settings. You can enable or disable email and SMS notifications based on your preferences.'
      },
      {
        q: 'What if I forget my password?',
        a: 'Use the "Forgot Password" link on the login page to reset your password. You\'ll receive an email with instructions to create a new password.'
      }
    ]
  }
];

// Single FAQ Item component
const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-slate-100 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left hover:bg-slate-50 transition-colors px-4 -mx-4"
    >
      <span className="font-medium text-slate-900 dark:text-white pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="pb-4 px-4 -mx-4">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{answer}</p>
      </div>
    )}
  </div>
);

// FAQ Category component
const FAQCategory = ({ category, icon: Icon, questions, openItems, onToggle }) => (
  <Card>
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-corporate-teal/10 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-corporate-teal" />
        </div>
        <h3 className="text-lg font-semibold text-corporate-navy">{category}</h3>
      </div>
      <div className="space-y-0">
        {questions.map((faq, idx) => (
          <FAQItem
            key={idx}
            question={faq.q}
            answer={faq.a}
            isOpen={openItems[`${category}-${idx}`]}
            onToggle={() => onToggle(`${category}-${idx}`)}
          />
        ))}
      </div>
    </div>
  </Card>
);

const HelpCenter = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (key) => {
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter FAQs based on search query
  const filteredData = searchQuery.trim() === '' 
    ? FAQ_DATA 
    : FAQ_DATA.map(category => ({
        ...category,
        questions: category.questions.filter(faq => 
          faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0);

  return (
    <PageLayout
      title="Help Center"
      icon={HelpCircle}
      description="Find answers to common questions about the LeaderReps PD Platform."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
              focus:border-corporate-teal focus:outline-none focus:ring-4 focus:ring-corporate-teal/20
              transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* FAQ Categories */}
        {filteredData.length > 0 ? (
          <div className="space-y-6">
            {filteredData.map((category, idx) => (
              <FAQCategory
                key={idx}
                category={category.category}
                icon={category.icon}
                questions={category.questions}
                openItems={openItems}
                onToggle={toggleItem}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-8 text-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No results found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Try adjusting your search terms or browse the categories above.
              </p>
            </div>
          </Card>
        )}

        {/* Still need help? */}
        <Card>
          <div className="p-6 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">
            <h3 className="text-lg font-semibold text-corporate-navy mb-2">Still have questions?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Can't find what you're looking for? Our team is happy to help.
            </p>
            <a
              href="mailto:ryan@leaderreps.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-corporate-teal text-white rounded-xl font-medium hover:bg-corporate-teal/90 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default HelpCenter;
