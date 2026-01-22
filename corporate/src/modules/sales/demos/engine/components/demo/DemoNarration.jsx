import React from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

const DemoNarration = ({ narration, isVisible = true, hasAudio, isAudioPlaying, onReplayAudio }) => {
  if (!narration || !isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-4 shadow-lg mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{narration.headline}</h3>
          <p className="text-primary-100 text-sm leading-relaxed">{narration.body}</p>
          {narration.highlight && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-amber-300">💡</span>
              <span className="text-amber-100">{narration.highlight}</span>
            </div>
          )}
        </div>
        
        {/* Audio Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasAudio && (
            <>
              {/* Playing indicator */}
              {isAudioPlaying && (
                <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full">
                  <Volume2 className="w-4 h-4 text-white animate-pulse" />
                  <span className="text-xs">Playing</span>
                </div>
              )}
              
              {/* Replay button */}
              <button
                onClick={onReplayAudio}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Replay narration"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
          
          {!hasAudio && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-xs text-primary-200">
              <VolumeX className="w-3 h-3" />
              <span>No audio</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoNarration;
