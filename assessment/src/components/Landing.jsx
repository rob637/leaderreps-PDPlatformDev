import { motion } from 'framer-motion';
import { Sparkles, Clock, Target, Award, ChevronRight, Users, TrendingUp, Zap } from 'lucide-react';

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
            className="text-teal hover:text-teal-light transition text-sm"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-teal mb-8"
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
            Discover Your{' '}
            <span className="gradient-text">Leadership DNA</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto"
          >
            Uncover your unique leadership style in 5 minutes. Get personalized AI insights and actionable strategies to elevate your impact.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={onStart}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-teal hover:bg-teal-light text-white font-bold text-lg rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-teal/20 pulse-ring"
            >
              <span>Start Free Assessment</span>
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
                icon: <Zap className="w-6 h-6" />,
                title: 'Your Leadership Archetype',
                description: 'Discover which of 6 leadership archetypes best matches your natural style.',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Strengths & Growth Areas',
                description: 'Get a detailed breakdown of your top leadership dimensions and opportunities.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Personalized Strategies',
                description: 'Receive AI-generated recommendations tailored to your unique profile.',
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

      {/* Social proof */}
      <section className="px-4 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/60 text-sm max-w-2xl mx-auto"
          >
            <p className="mb-4">
              "This assessment gave me clarity I didn't know I needed. Finally understand why I lead the way I do."
            </p>
            <p className="text-white/40 text-xs">
              Based on research-backed leadership frameworks used by Fortune 500 companies
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-4 text-center text-white/30 text-xs">
        © 2026 LeaderReps. All rights reserved.
      </footer>
    </motion.div>
  );
};

export default Landing;
