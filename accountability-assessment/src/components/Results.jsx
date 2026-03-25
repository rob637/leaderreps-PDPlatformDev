import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, RefreshCw, ExternalLink, Twitter, Linkedin, CheckCircle2, Sparkles, ArrowRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { ACCOUNTABILITY_DIMENSIONS, getGrowthRecommendations } from '../data/questions';

// Pentagon radar chart component (5 dimensions)
const RadarChart = ({ scores }) => {
  const dimensions = Object.keys(ACCOUNTABILITY_DIMENSIONS);
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  
  // Calculate points for each dimension (pentagon)
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
        fill="rgba(224, 78, 27, 0.3)"
        stroke="#E04E1B"
        strokeWidth="2"
      />

      {/* Dimension labels */}
      {dimensions.map((dim, i) => {
        const labelRadius = radius + 35;
        const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        const data = ACCOUNTABILITY_DIMENSIONS[dim];
        
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
        const data = ACCOUNTABILITY_DIMENSIONS[dim];
        
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
  const data = ACCOUNTABILITY_DIMENSIONS[dimension];
  
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

// Score gauge component
const ScoreGauge = ({ score, maturityLevel }) => {
  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 65) return '#47A88D';
    if (score >= 50) return '#F59E0B';
    return '#E04E1B';
  };
  
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative inline-flex">
      <svg width="160" height="160" className="transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="60"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          fill="none"
        />
        <motion.circle
          cx="80"
          cy="80"
          r="60"
          stroke={getColor()}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="text-4xl font-bold text-white"
        >
          {score}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm font-medium"
          style={{ color: getColor() }}
        >
          {maturityLevel}
        </motion.div>
      </div>
    </div>
  );
};

const Results = ({ results, aiInsights, email, onRestart }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const archetype = results?.archetypeData;
  const sortedDimensions = results?.sortedDimensions || [];
  const topDimension = ACCOUNTABILITY_DIMENSIONS[results?.topDimensions?.[0]];
  const weakestDimension = results?.weakestDimension;
  const growthRecommendations = getGrowthRecommendations(weakestDimension);
  const overallScore = results?.overallScore || 0;
  const maturityLevel = results?.maturityLevel || 'Developing';
  const maturityDescription = results?.maturityDescription || '';

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
          colors: ['#E04E1B', '#47A88D', '#002E47', '#8B5CF6', '#06B6D4'],
        });
      });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const shareOnLinkedIn = () => {
    const text = `I just discovered my Accountability Profile! My overall score: ${overallScore}/100 🎯\n\nTake the free assessment:`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://accountability.leaderreps.com')}`;
    window.open(url, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Just discovered my Accountability Profile! I'm "${archetype?.name}" with a ${overallScore}/100 score 🎯\n\nTake the free assessment:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://accountability.leaderreps.com')}`;
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange/20 text-orange text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Your Results Are Ready</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Accountability Profile
          </h1>
          <p className="text-white/60">
            Results sent to {email}
          </p>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden"
        >
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${topDimension?.color || '#E04E1B'} 0%, transparent 50%)`,
            }}
          />
          
          <div className="relative flex flex-col md:flex-row gap-8 items-center">
            {/* Score Gauge */}
            <div className="shrink-0">
              <ScoreGauge score={overallScore} maturityLevel={maturityLevel} />
            </div>
            
            {/* Summary */}
            <div className="text-center md:text-left flex-1">
              <div className="text-white/60 text-sm uppercase tracking-wide mb-2">
                Accountability Maturity Level
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {maturityLevel}
              </h2>
              <p className="text-white/70 mb-4">
                {maturityDescription}
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal">{topDimension?.icon}</div>
                  <div className="text-white/60 text-xs">Top Strength</div>
                  <div className="text-white text-sm font-medium">{topDimension?.shortName}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange">{ACCOUNTABILITY_DIMENSIONS[weakestDimension]?.icon}</div>
                  <div className="text-white/60 text-xs">Growth Area</div>
                  <div className="text-white text-sm font-medium">{ACCOUNTABILITY_DIMENSIONS[weakestDimension]?.shortName}</div>
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="shrink-0">
              <RadarChart scores={results?.scores || {}} />
            </div>
          </div>
        </motion.div>

        {/* Archetype Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-6 md:p-8 mb-6"
        >
          <div className="text-white/60 text-sm uppercase tracking-wide mb-2">
            Your Accountability Archetype
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {archetype?.name || 'Accountable Leader'}
          </h2>
          <p className="text-orange font-medium mb-4">
            {archetype?.tagline}
          </p>
          <p className="text-white/70 mb-4">
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
        </motion.div>

        {/* Dimensions Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Score bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-3xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-6">
              Your Accountability Dimensions
            </h3>
            <div className="space-y-4">
              {sortedDimensions.map(([dim, score], index) => (
                <DimensionBar key={dim} dimension={dim} score={score} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Growth Focus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange" />
              <h3 className="text-lg font-bold text-white">Your Growth Focus</h3>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{ACCOUNTABILITY_DIMENSIONS[weakestDimension]?.icon}</span>
                <span className="font-semibold text-white">{ACCOUNTABILITY_DIMENSIONS[weakestDimension]?.name}</span>
              </div>
              <p className="text-white/60 text-sm mb-4">
                {ACCOUNTABILITY_DIMENSIONS[weakestDimension]?.description}
              </p>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-semibold text-white/70 mb-3">Quick Wins to Start</h4>
              <div className="space-y-3">
                {growthRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange/20 text-orange flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-white/70 text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-3xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-orange" />
              <h3 className="text-lg font-bold text-white">AI-Powered Coaching Insights</h3>
            </div>
            <div className="text-white/80 space-y-4 whitespace-pre-wrap leading-relaxed">
              {aiInsights}
            </div>
          </motion.div>
        )}

        {/* LeaderReps CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="gradient-border-orange rounded-3xl"
        >
          <div className="glass rounded-2xl p-6 md:p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-orange" />
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Ready to Build Unshakeable Accountability?
              </h3>
            </div>
            
            <p className="text-white/60 mb-4 max-w-xl mx-auto">
              LeaderReps is an 8-week leadership development program built around daily accountability practices, AI coaching, and a community of leaders committed to results.
            </p>
            
            {archetype?.leaderRepsPath && (
              <div className="glass rounded-xl p-4 mb-6 max-w-xl mx-auto text-left">
                <div className="text-orange text-sm font-semibold mb-2">Your Personalized Path:</div>
                <p className="text-white/70 text-sm">{archetype.leaderRepsPath}</p>
              </div>
            )}
            
            <a
              href="https://www.leaderreps.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange hover:bg-orange/90 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl"
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
          transition={{ delay: 0.8 }}
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
          <p>© {new Date().getFullYear()} LeaderReps. Building accountable leaders.</p>
          <p className="mt-1">
            <a href="https://www.leaderreps.com" className="hover:text-orange transition">
              www.leaderreps.com
            </a>
          </p>
        </footer>
      </div>
    </motion.div>
  );
};

export default Results;
