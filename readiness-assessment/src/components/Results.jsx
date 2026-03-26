import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, RefreshCw, ExternalLink, Twitter, Linkedin, CheckCircle2, Sparkles, ArrowRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { READINESS_DIMENSIONS, READINESS_ARCHETYPES, getGrowthRecommendations } from '../data/questions';
import confetti from 'canvas-confetti';

// Pentagon radar chart component (5 dimensions)
const RadarChart = ({ scores }) => {
  const dimensions = Object.keys(READINESS_DIMENSIONS);
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
        const data = READINESS_DIMENSIONS[dim];
        
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
        const data = READINESS_DIMENSIONS[dim];
        
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
  const data = READINESS_DIMENSIONS[dimension];
  
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
const ScoreGauge = ({ score, readinessLevel }) => {
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
          className="text-3xl font-bold text-white"
        >
          {score}
        </motion.div>
        <div className="text-white/60 text-xs">/ 100</div>
      </div>
    </div>
  );
};

const Results = ({ results, aiInsights, email, onRestart }) => {
  const [shareText, setShareText] = useState('');
  
  const archetype = READINESS_ARCHETYPES[results.archetype];
  const topDimension = READINESS_DIMENSIONS[results.topDimensions[0]];
  const secondDimension = READINESS_DIMENSIONS[results.topDimensions[1]];
  const growthDimension = READINESS_DIMENSIONS[results.growthArea];

  // Fire confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#47A88D', '#E04E1B', '#8B5CF6', '#F59E0B', '#06B6D4'],
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = (platform) => {
    const text = `I just discovered my Leadership Readiness Profile! I scored ${results.overallScore}% and I'm a ${archetype.name}. 🎯\n\nTake the free assessment:`;
    const url = 'https://readiness.leaderreps.com';
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-teal mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Your Results Are In!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Leadership Readiness Profile
          </h1>
          <p className="text-white/60">
            Based on your responses across 5 key leadership dimensions
          </p>
        </motion.div>

        {/* Main Score & Archetype Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden"
        >
          {/* Background gradient */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 30% 0%, ${topDimension.color} 0%, transparent 50%)`,
            }}
          />
          
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            {/* Score */}
            <div className="text-center">
              <ScoreGauge score={results.overallScore} readinessLevel={results.readinessLevel} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4"
              >
                <div 
                  className="inline-block px-4 py-2 rounded-full text-white font-bold"
                  style={{ backgroundColor: topDimension.color }}
                >
                  {results.readinessLevel}
                </div>
                <p className="text-white/60 text-sm mt-2 max-w-xs mx-auto">
                  {results.readinessDescription}
                </p>
              </motion.div>
            </div>

            {/* Archetype */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-white/60 text-sm uppercase tracking-wide mb-2">
                  Your Leadership Archetype
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  {archetype.name}
                </h2>
                <p className="text-teal font-medium mb-4">
                  "{archetype.tagline}"
                </p>
                <p className="text-white/70 text-sm">
                  {archetype.description}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Dimensions Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4 text-center">
              Your Leadership Profile
            </h3>
            <RadarChart scores={results.scores} />
          </motion.div>

          {/* Dimension Bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              Dimension Scores
            </h3>
            <div className="space-y-4">
              {results.sortedDimensions.map(([dim, score], i) => (
                <DimensionBar key={dim} dimension={dim} score={score} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Strengths & Growth */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-3xl p-6 border-l-4"
            style={{ borderLeftColor: topDimension.color }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${topDimension.color}30` }}
              >
                {topDimension.icon}
              </div>
              <div>
                <div className="text-teal text-sm font-medium">Top Strength</div>
                <h3 className="text-lg font-bold text-white">{topDimension.name}</h3>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">{topDimension.description}</p>
            <div className="space-y-2">
              {topDimension.strengths.map((strength, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Growth Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl p-6 border-l-4"
            style={{ borderLeftColor: growthDimension.color }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${growthDimension.color}30` }}
              >
                {growthDimension.icon}
              </div>
              <div>
                <div className="text-orange text-sm font-medium">Growth Opportunity</div>
                <h3 className="text-lg font-bold text-white">{growthDimension.name}</h3>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">{growthDimension.description}</p>
            <div className="space-y-2">
              {growthDimension.growth.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <AlertTriangle className="w-4 h-4 text-orange shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Insights (if available) */}
        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-3xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-lg">
                🤖
              </div>
              <h3 className="text-lg font-bold text-white">AI Coaching Insights</h3>
            </div>
            <div className="text-white/80 text-sm whitespace-pre-line">
              {aiInsights}
            </div>
          </motion.div>
        )}

        {/* LeaderReps CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-3xl p-6 md:p-8 mb-6 bg-gradient-to-br from-teal/20 to-transparent"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Ready to Accelerate Your Leadership?
              </h3>
              <p className="text-white/70 text-sm mb-4">
                {archetype.leaderRepsPath}
              </p>
              <ul className="space-y-2 text-sm text-white/80 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  8-week structured leadership development program
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  Daily practices tailored to your growth areas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                  AI coaching + expert human facilitation
                </li>
              </ul>
            </div>
            <div className="shrink-0">
              <a
                href="https://www.leaderreps.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal hover:bg-teal/90 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <span>Explore LeaderReps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Share & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <Twitter className="w-4 h-4" />
            <span>Share on Twitter</span>
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <Linkedin className="w-4 h-4" />
            <span>Share on LinkedIn</span>
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Take Again</span>
          </button>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/40 text-sm">
          <p>Your results have been sent to {email}</p>
          <p className="mt-2">© {new Date().getFullYear()} LeaderReps. All rights reserved.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Results;
