// src/components/rep/RepMessage.jsx
// A single message from Rep or the user

import React from 'react';
import RepAvatar from './RepAvatar';

/**
 * RepMessage - A chat bubble from Rep or the user
 * Rep messages appear on the left with avatar
 * User messages appear on the right
 */
const RepMessage = ({ 
  content, 
  sender = 'rep', // 'rep' | 'user' | 'system'
  timestamp,
  isTyping = false,
  children // For embedded widgets
}) => {
  const isRep = sender === 'rep';
  const isSystem = sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-4 ${isRep ? 'justify-start' : 'justify-end'}`}>
      {/* Rep Avatar (only for Rep messages) */}
      {isRep && (
        <div className="flex-shrink-0">
          <RepAvatar size="sm" pulse={isTyping} />
        </div>
      )}

      {/* Message Bubble */}
      <div 
        className={`
          max-w-[85%] md:max-w-[70%]
          ${isRep 
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-md' 
            : 'bg-corporate-teal text-white rounded-2xl rounded-tr-md'
          }
          ${children ? 'p-2' : 'px-4 py-3'}
        `}
      >
        {/* Typing indicator */}
        {isTyping ? (
          <div className="flex items-center gap-1 py-1">
            <span className="w-2 h-2 bg-corporate-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-corporate-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-corporate-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <>
            {/* Text content */}
            {content && (
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            )}
            
            {/* Embedded widget/component */}
            {children && (
              <div className="mt-2">
                {children}
              </div>
            )}
          </>
        )}

        {/* Timestamp (optional) */}
        {timestamp && !isTyping && (
          <p className={`text-xs mt-2 ${isRep ? 'text-slate-500 dark:text-slate-400' : 'text-white/70'}`}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
};

export default RepMessage;
