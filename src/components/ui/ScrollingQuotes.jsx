import React, { useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';

const FALLBACK_QUOTES = [
  { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
  { text: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.", author: "Ronald Reagan" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { text: "To handle yourself, use your head; to handle others, use your heart.", author: "Eleanor Roosevelt" }
];

const ScrollingQuotes = () => {
  const { globalMetadata } = useAppServices();

  React.useEffect(() => {
    console.log('📜 [ScrollingQuotes] globalMetadata updated:', globalMetadata);
    console.log('📜 [ScrollingQuotes] SYSTEM_QUOTES:', globalMetadata?.SYSTEM_QUOTES);
  }, [globalMetadata]);

  const quotes = useMemo(() => {
    const systemQuotes = globalMetadata?.SYSTEM_QUOTES;
    
    if (systemQuotes && Array.isArray(systemQuotes) && systemQuotes.length > 0) {
      return systemQuotes.map(item => {
        // Handle "Quote|Author" format
        if (typeof item === 'string') {
          const parts = item.split('|');
          if (parts.length >= 2) {
            return { text: parts[0].trim(), author: parts[1].trim() };
          }
          return { text: item, author: '' };
        }
        return item; // Fallback if it's already an object (future proofing)
      });
    }
    
    return FALLBACK_QUOTES;
  }, [globalMetadata?.SYSTEM_QUOTES]);

  return (
    <div className="bg-corporate-navy text-white py-3 overflow-hidden relative z-40 border-b border-corporate-teal/30">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {/* Duplicate the quotes to ensure seamless scrolling */}
        {[...quotes, ...quotes].map((quote, index) => (
          <div key={index} className="flex items-center mx-8 text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
            <span className="italic mr-2">"{quote.text}"</span>
            {quote.author && (
              <span className="text-corporate-teal font-bold text-xs uppercase tracking-wider">— {quote.author}</span>
            )}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default ScrollingQuotes;
