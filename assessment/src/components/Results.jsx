import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, RefreshCw, ExternalLink, Twitter, Linkedin, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { LEADERSHIP_DIMENSIONS } from '../data/questions';

// Radar chart component
const RadarChart = ({ scores }) => {
  const dimensions = Object.keys(LEADERSHIP_DIMENSIONS);
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  
  // Calculate points for each dimension
  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  // Create polygon path
  const polygonPoints = dimensions
    .map((dim, i) => {
      const point = getPoint(i, scores[dim] || 0);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  // Create grid circles
  const gridCircles = [20, 40, 60, 80, 100];

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
      {/* Grid circles */}
      {gridCircles.map((level) => (
        <circle
          key={level}
          cx={centerX}
          cy={centerY}
          r={(level / 100) * radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      
      {/* Axis lines */}
      {dimensions.map((dim, i) => {
        const point = getPoint(i, 100);
        return (
          <line
            key={dim}
            x1={centerX}
            y1={centerY}
            x2={point.x}
            y2={point.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
        points={polygonPoints}
        fill="rgba(71, 168, 141, 0.3)"
        stroke="#47A88D"
        strokeWidth="2"
      />

      {/* Dimension labels */}
      {dimensions.map((dim, i) => {
        const labelRadius = radius + 35;
        const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        const data = LEADERSHIP_DIMENSIONS[dim];
        
        return (
          <g key={`label-${dim}`}>
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm fill-white/80"
            >
              {data.icon}
            </text>
          </g>
        );
      })}

      {/* Score dots */}
      {dimensions.map((dim, i) => {
        const point = getPoint(i, scores[dim] || 0);
        const data = LEADERSHIP_DIMENSIONS[dim];
        
        return (
          <motion.circle
            key={`dot-${dim}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            cx={point.x}
            cy={point.y}
            r="6"
            fill={data.color}
            stroke="white"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
};

// Dimension bar component
const DimensionBar = ({ dimension, score, index }) => {
  const data = LEADERSHIP_DIMENSIONS[dimension];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="flex items-center gap-4"
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: `${data.color}30` }}
      >
        {data.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white font-medium text-sm truncate">{data.name}</span>
          <span className="text-white/60 text-sm ml-2">{score}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            className="h-full rounded-full"
            style={{ backgroundColor: data.color }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const Results = ({ results, aiInsights, email, onRestart }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const archetype = results?.archetypeData;
  const sortedDimensions = results?.sortedDimensions || [];
  const topDimension = LEADERSHIP_DIMENSIONS[results?.topDimensions?.[0]];

  // Trigger confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
      // Load and trigger confetti
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#47A88D', '#E04E1B', '#002E47', '#8B5CF6', '#F59E0B'],
        });
      });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const shareOnLinkedIn = () => {
    const text = `I just discovered my Leadership DNA! I'm a "${archetype?.name}" 🎯\n\nTake the free assessment: assessment.leaderreps.com`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://assessment.leaderreps.com')}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Just discovered my Leadership DNA! I'm a "${archetype?.name}" 🎯\n\nTake the free assessment:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://assessment.leaderreps.com')}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-8 px-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal/20 text-teal text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Your Results Are Ready</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Leadership DNA
          </h1>
          <p className="text-white/60">
            Results sent to {email}
          </p>
        </motion.div>

        {/* Archetype Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden"
        >
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${topDimension?.color || '#47A88D'} 0%, transparent 50%)`,
            }}
          />
          
          <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="text-center md:text-left flex-1">
              <div className="text-white/60 text-sm uppercase tracking-wide mb-2">
                Your Leadership Archetype
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {archetype?.name || 'Leadership Excellence'}
              </h2>
              <p className="text-teal font-medium mb-4">
                {archetype?.tagline}
              </p>
              <p className="text-white/70 text-sm md:text-base mb-4">
                {archetype?.description}
              </p>
              
              {archetype?.superpower && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-sm mb-3">
                  <span>⚡</span>
                  <span>Superpower: <strong>{archetype.superpower}</strong></span>
                </div>
              )}
              
              {archetype?.famousLeaders && (
                <div className="text-white/50 text-sm">
                  <span className="font-medium text-white/70">Similar leaders: </span>
                  {archetype.famousLeaders.join(', ')}
                </div>
              )}
            </div>

            <div className="shrink-0">
              <RadarChart scores={results?.scores || {}} />
            </div>
          </div>
        </motion.div>

        {/* Dimensions Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Score bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-6">
              Your Leadership Dimensions
            </h3>
            <div className="space-y-4">
              {sortedDimensions.map(([dim, score], index) => (
                <DimensionBar key={dim} dimension={dim} score={score} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Top strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-3xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              Your Top Strengths
            </h3>
            
            {results?.topDimensions?.slice(0, 2).map((dim) => {
              const data = LEADERSHIP_DIMENSIONS[dim];
              return (
                <div key={dim} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{data.icon}</span>
                    <span className="font-semibold text-white">{data.shortName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.strengths.map((strength) => (
                      <span
                        key={strength}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${data.color}30`, color: data.color }}
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Growth Areas */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white/60 mb-3">Growth Opportunities</h4>
              {sortedDimensions.slice(-2).reverse().map(([dim]) => {
                const data = LEADERSHIP_DIMENSIONS[dim];
                return (
                  <div key={`growth-${dim}`} className="text-sm text-white/50 mb-2">
                    <span className="mr-2">{data.icon}</span>
                    {data.growth[0]}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-teal" />
              <h3 className="text-lg font-bold text-white">AI-Powered Insights</h3>
            </div>
            <div className="text-white/80 space-y-4 whitespace-pre-wrap">
              {aiInsights}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="gradient-border rounded-3xl"
        >
          <div className="glass rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Ready to Level Up Your Leadership?
            </h3>
            <p className="text-white/60 mb-6 max-w-xl mx-auto">
              Join our 8-week leadership development program. Go from knowing your strengths to mastering them with daily practice, AI coaching, and a community of growth-minded leaders.
            </p>
            
            <a
              href="https://www.leaderreps.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-teal hover:bg-teal-light text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl"
            >
              <span>Explore LeaderReps Programs</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            
            <div className="mt-4 text-white/40 text-sm">
              Limited spots available for next cohort
            </div>
          </div>
        </motion.div>

        {/* Share & Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <button
            onClick={shareOnLinkedIn}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0077B5] hover:bg-[#0077B5]/80 text-white text-sm transition"
          >
            <Linkedin className="w-4 h-4" />
            <span>Share on LinkedIn</span>
          </button>
          
          <button
            onClick={shareOnTwitter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white text-sm transition"
          >
            <Twitter className="w-4 h-4" />
            <span>Share on X</span>
          </button>
          
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 text-white/70 text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retake Assessment</span>
          </button>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 text-center text-white/30 text-xs">
          <p>© 2026 LeaderReps. All rights reserved.</p>
          <p className="mt-1">
            <a href="https://www.leaderreps.com" className="hover:text-teal transition">
              www.leaderreps.com
            </a>
          </p>
        </footer>
      </div>
    </motion.div>
  );
};

export default Results;
