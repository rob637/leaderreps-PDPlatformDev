import { motion } from 'framer-motion';
import { Sparkles, Clock, Target, Award, ChevronRight, Users, TrendingUp, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';

const Landing = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-white.png" 
              alt="LeaderReps" 
              className="h-8 md:h-10"
            />
          </div>
          <a 
            href="https://www.leaderreps.com" 
            className="text-orange hover:text-orange/80 transition text-sm"
          >
            Learn about our programs →
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-orange mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Assessment</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            How Accountable{' '}
            <span className="gradient-text-orange">Are You, Really?</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto"
          >
            Discover your accountability strengths and blindspots in 5 minutes. Get personalized AI insights and a clear path to becoming the leader others can truly count on.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={onStart}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-orange hover:bg-orange/90 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange/20 pulse-ring-orange"
            >
              <span>Take the Assessment</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-10 text-white/50 text-sm"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>12 questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Free forever</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* The Problem Section */}
      <section className="px-4 py-12 md:py-16 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              The #1 Reason Teams Underperform
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              It's not strategy. It's not talent. It's accountability gaps—and most leaders don't know where theirs are.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <AlertTriangle className="w-6 h-6" />,
                stat: '82%',
                label: 'of leaders overestimate their accountability',
                subtext: 'Gallup Research',
              },
              {
                icon: <Users className="w-6 h-6" />,
                stat: '3x',
                label: 'more likely to hit goals with accountability systems',
                subtext: 'American Society of Training',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                stat: '91%',
                label: 'of high-performing teams cite accountability as key',
                subtext: 'Partners In Leadership',
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-orange/20 flex items-center justify-center mx-auto mb-4 text-orange">
                  {item.icon}
                </div>
                <div className="text-4xl font-bold text-white mb-2">{item.stat}</div>
                <p className="text-white/70 text-sm mb-2">{item.label}</p>
                <p className="text-white/40 text-xs">{item.subtext}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll discover section */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-white text-center mb-12"
          >
            What You'll Discover
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Your Accountability Profile',
                description: 'See exactly where you excel and where you have blindspots across 5 core accountability dimensions.',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Your Maturity Level',
                description: 'Get an honest assessment of where you stand: Emerging, Developing, Strong, or Exemplary.',
              },
              {
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: 'Your Growth Path',
                description: 'Receive AI-generated recommendations tailored to your specific gaps and strengths.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-teal/20 flex items-center justify-center mx-auto mb-4 text-teal">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 Dimensions Preview */}
      <section className="px-4 py-12 md:py-16 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              5 Dimensions of Accountability
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              We measure the specific behaviors that separate accountable leaders from the rest.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { emoji: '🎯', name: 'Ownership', desc: 'Taking full responsibility' },
              { emoji: '✅', name: 'Reliability', desc: 'Following through always' },
              { emoji: '🔍', name: 'Transparency', desc: 'Proactive communication' },
              { emoji: '📏', name: 'Standards', desc: 'Clear expectations' },
              { emoji: '💪', name: 'Feedback', desc: 'Growth through honesty' },
            ].map((dim, i) => (
              <motion.div
                key={dim.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 text-center"
              >
                <div className="text-3xl mb-2">{dim.emoji}</div>
                <div className="font-semibold text-white text-sm mb-1">{dim.name}</div>
                <div className="text-white/50 text-xs">{dim.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-bold text-white mb-6"
          >
            Ready to Know Where You Stand?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 mb-8 text-lg"
          >
            Join thousands of leaders who've discovered their accountability profile. Takes just 5 minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={onStart}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-orange hover:bg-orange/90 text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange/20"
            >
              <span>Start Free Assessment</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-white/40 text-sm">
        <p>© {new Date().getFullYear()} LeaderReps. Building accountable leaders.</p>
      </footer>
    </motion.div>
  );
};

export default Landing;
