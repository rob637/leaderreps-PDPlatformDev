import React from 'react';

const QUOTES = [
  { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
  { text: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.", author: "Ronald Reagan" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { text: "To handle yourself, use your head; to handle others, use your heart.", author: "Eleanor Roosevelt" }
];

const ScrollingQuotes = () => {
  return (
    <div className="bg-corporate-navy text-white py-2 overflow-hidden relative z-40 border-b border-corporate-teal/30">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-16">
        {/* Duplicate the quotes to ensure seamless scrolling */}
        {[...QUOTES, ...QUOTES, ...QUOTES, ...QUOTES].map((quote, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
            <span className="italic">"{quote.text}"</span>
            <span className="text-corporate-teal font-bold text-xs uppercase tracking-wider">— {quote.author}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default ScrollingQuotes;
