import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, DollarSign, Clock, ArrowRight, 
  CheckCircle2, BarChart3, Building2, Sparkles,
  ChevronDown
} from 'lucide-react';

// Conservative, defensible stats — not big-number marketing claims.
const stats = [
  { value: '35-150%', label: 'of salary to replace one departing employee', source: 'SHRM, CAP, Work Institute' },
  { value: '75%', label: 'of employees who quit are quitting their manager', source: 'Gallup' },
  { value: '1', label: 'leader is enough to start the conversation', source: 'LeaderReps' },
];

const benefits = [
  { icon: TrendingUp, title: 'See the hidden costs', desc: 'Recruiting, ramp-up, lost productivity — broken out, not hand-waved' },
  { icon: Users, title: 'Frame capacity, not cuts', desc: 'Better leaders raise the lid on growth, they don\'t shrink the team' },
  { icon: DollarSign, title: 'Three defensible scenarios', desc: 'Save 1 person, reclaim 2 hrs/week, land 1 more deal — pick what fits' },
  { icon: Clock, title: 'Two minutes', desc: 'Per-leader view first; scale only when you want to' },
];

const Landing = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-bg opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-12"
          >
            <img 
              src="/logo-white.png" 
              alt="LeaderReps" 
              className="h-8 sm:h-10"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="text-white/60 text-sm hidden sm:block">Leadership Development Solutions</span>
          </motion.div>
          
          {/* Hero Content */}
          <div className="text-center py-8 sm:py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-8"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Free • 2 Minutes • Instant Results</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight"
            >
              The hidden cost of
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
                an untrained manager.
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto mb-10 font-light"
            >
              A two-minute walk-through that shows the per-leader picture —
              <br className="hidden sm:block" />
              built from conservative numbers a CFO can actually defend.
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-corporate-navy font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all pulse-ring"
            >
              <BarChart3 className="w-6 h-6" />
              Walk Through It
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/50 text-sm mt-6"
            >
              Educational, not salesy. No big-number projections.
            </motion.p>
          </div>
          
          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"
              >
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 mb-2">{stat.label}</div>
                <div className="text-white/40 text-xs">{stat.source}</div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, y: { repeat: Infinity, duration: 2 } }}
            className="flex justify-center mt-12"
          >
            <ChevronDown className="w-8 h-8 text-white/40" />
          </motion.div>
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className="bg-slate-50 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-corporate-navy mb-4">
              Why a per-leader view?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Aggregated savings figures rarely survive a CFO review.
              The case for one leader and one direct report does.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-corporate-teal/20 to-corporate-navy/20 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-corporate-teal" />
                </div>
                <h3 className="font-bold text-corporate-navy text-lg mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-corporate-navy mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Get your personalized ROI analysis in 3 simple steps
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'One leader, one report', desc: 'Start with the simplest defensible scope. Add manager and report salary, industry, and turnover.' },
              { step: '02', title: 'See three scenarios', desc: 'Save one person from leaving, reclaim two hours of leader capacity, land one more deal — each with the math shown.' },
              { step: '03', title: 'Take it to the table', desc: 'Use the verbal ROI to start the conversation with finance — no inflated projections required.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-8xl font-black text-slate-100 absolute -top-4 left-0">
                  {item.step}
                </div>
                <div className="relative pt-12">
                  <h3 className="text-xl font-bold text-corporate-navy mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-br from-corporate-navy to-corporate-navy/90 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Building2 className="w-12 h-12 text-corporate-teal mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to walk through it?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Two minutes. Per leader. Conservative by design.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-corporate-teal text-white font-bold text-lg rounded-xl shadow-xl hover:bg-emerald-500 transition-colors"
            >
              Start the Walk-Through
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/60 text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-corporate-teal" />
                Conservative figures by design
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-corporate-teal" />
                The math is shown
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-corporate-teal" />
                Educational, not a sales pitch
              </span>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} LeaderReps. Leadership Development Solutions.
          </p>
          <p className="text-slate-400 text-xs mt-2">
            ROI calculations based on research from Gallup, SHRM, Brandon Hall Group, and McKinsey.
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default Landing;
