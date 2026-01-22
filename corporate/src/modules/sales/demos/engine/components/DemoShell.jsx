import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Menu, X, Home, Map, BookOpen, Video, LayoutDashboard, Users, UserCheck, Rocket, Phone, Play, Pause, Volume2, VolumeX, SkipForward, RotateCcw } from 'lucide-react';

import WelcomeScreen from '../screens/WelcomeScreen';
import JourneyOverviewScreen from '../screens/JourneyOverviewScreen';
import FoundationScreen from '../screens/FoundationScreen';
import LiveSessionScreen from '../screens/LiveSessionScreen';
import ArenaScreen from '../screens/ArenaScreen';
import ContentScreen from '../screens/ContentScreen';
import CommunityScreen from '../screens/CommunityScreen';
import CoachingScreen from '../screens/CoachingScreen';
import AscentScreen from '../screens/AscentScreen';
import ConclusionScreen from '../screens/ConclusionScreen';

const screens = [
  { id: 'welcome', name: 'Welcome', icon: <Home className="w-4 h-4" />, component: WelcomeScreen, audio: '/audio/welcome.mp3' },
  { id: 'journey', name: 'Journey', icon: <Map className="w-4 h-4" />, component: JourneyOverviewScreen, audio: '/audio/journey.mp3' },
  { id: 'foundation', name: 'Foundation', icon: <BookOpen className="w-4 h-4" />, component: FoundationScreen, audio: '/audio/foundation.mp3' },
  { id: 'live-session', name: 'Live Session', icon: <Video className="w-4 h-4" />, component: LiveSessionScreen, audio: '/audio/live-session.mp3' },
  { id: 'arena', name: 'Arena', icon: <LayoutDashboard className="w-4 h-4" />, component: ArenaScreen, audio: '/audio/arena.mp3' },
  { id: 'content', name: 'Content', icon: <BookOpen className="w-4 h-4" />, component: ContentScreen, audio: '/audio/content.mp3' },
  { id: 'community', name: 'Community', icon: <Users className="w-4 h-4" />, component: CommunityScreen, audio: '/audio/community.mp3' },
  { id: 'coaching', name: 'Coaching', icon: <UserCheck className="w-4 h-4" />, component: CoachingScreen, audio: '/audio/coaching.mp3' },
  { id: 'ascent', name: 'Ascent', icon: <Rocket className="w-4 h-4" />, component: AscentScreen, audio: '/audio/ascent.mp3' },
  { id: 'contact', name: 'Contact Us', icon: <Phone className="w-4 h-4" />, component: ConclusionScreen, audio: '/audio/conclusion.mp3' },
];

const DemoShell = ({ onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);

  // Check if audio files exist
  useEffect(() => {
    const audio = new Audio(screens[0].audio);
    audio.addEventListener('canplaythrough', () => setAudioLoaded(true));
    audio.addEventListener('error', () => setAudioError(true));
    return () => {
      audio.removeEventListener('canplaythrough', () => {});
      audio.removeEventListener('error', () => {});
    };
  }, []);

  // Handle audio ended - auto advance to next screen
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (currentIndex < screens.length - 1 && isPlaying) {
        setTimeout(() => {
          setDirection(1);
          setCurrentIndex(prev => prev + 1);
        }, 1000); // 1 second pause between screens
      } else if (currentIndex === screens.length - 1) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentIndex, isPlaying]);

  // Play audio when screen changes and isPlaying is true
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioLoaded) return;

    audio.src = screens[currentIndex].audio;
    if (isPlaying && !isMuted) {
      audio.play().catch(console.error);
    }
  }, [currentIndex, isPlaying, audioLoaded]);

  const startDemo = () => {
    setShowStartOverlay(false);
    setIsPlaying(true);
    if (audioRef.current && audioLoaded) {
      audioRef.current.play().catch(console.error);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audio.play().catch(console.error);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const skipToNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (currentIndex < screens.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentIndex(0);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current && audioLoaded) {
        audioRef.current.src = screens[0].audio;
        audioRef.current.play().catch(console.error);
      }
    }, 100);
  };

  const goToScreen = (index) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setMenuOpen(false);
    if (isPlaying && audioRef.current && audioLoaded) {
      setTimeout(() => {
        audioRef.current.src = screens[index].audio;
        audioRef.current.play().catch(console.error);
      }, 300);
    }
  };

  const goNext = () => {
    if (currentIndex < screens.length - 1) {
      goToScreen(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      goToScreen(currentIndex - 1);
    }
  };

  const CurrentScreen = screens[currentIndex].component;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Audio element */}
      <audio ref={audioRef} preload="auto" />

      {/* Start Overlay */}
      <AnimatePresence>
        {showStartOverlay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-navy-500 via-navy-600 to-teal-600 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }} className="text-center max-w-md">
              
              <motion.img src="/logo-full.png" alt="LeaderReps" 
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }} className="h-16 mx-auto mb-8" />
              
              <h1 className="text-3xl font-bold text-white mb-4">Welcome to the LeaderReps Demo</h1>
              <p className="text-white/80 mb-8">Experience our leadership development platform with a guided audio tour.</p>
              
              <div className="bg-white/10 rounded-xl p-4 mb-8">
                <div className="flex items-center gap-3 text-white">
                  <Volume2 className="w-6 h-6 text-teal-300" />
                  <div className="text-left">
                    <p className="font-medium">🔊 Turn Up Your Sound</p>
                    <p className="text-sm text-white/70">This demo includes audio narration</p>
                  </div>
                </div>
              </div>

              {audioError && (
                <p className="text-yellow-300 text-sm mb-4">
                  Note: Audio files not yet uploaded. Demo will work without narration.
                </p>
              )}

              <motion.button onClick={startDemo}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="bg-teal-500 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 mx-auto hover:bg-teal-400 transition-colors shadow-lg">
                <Play className="w-6 h-6" />
                Start Demo
              </motion.button>

              <p className="text-white/50 text-sm mt-6">~3.5 minutes</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="LeaderReps" className="h-8 w-auto" />
            <span className="font-semibold text-navy-500 hidden sm:inline">LeaderReps</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Audio controls */}
            <div className="flex items-center gap-1 mr-2 bg-gray-100 rounded-lg p-1">
              <button onClick={togglePlay}
                className="p-2 rounded-lg hover:bg-gray-200 text-navy-500" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-gray-200 text-navy-500" title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={skipToNext} disabled={currentIndex === screens.length - 1}
                className="p-2 rounded-lg hover:bg-gray-200 text-navy-500 disabled:opacity-30" title="Skip">
                <SkipForward className="w-4 h-4" />
              </button>
              <button onClick={restart}
                className="p-2 rounded-lg hover:bg-gray-200 text-navy-500" title="Restart">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="hidden md:flex items-center gap-1 mr-4">
              {screens.map((_, i) => (
                <button key={i} onClick={() => goToScreen(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-teal-500 w-4' : i < currentIndex ? 'bg-teal-300' : 'bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
            
            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 md:hidden">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white border-t border-gray-100">
              <nav className="p-2 space-y-1">
                {screens.map((screen, i) => (
                  <button key={screen.id} onClick={() => goToScreen(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${
                      i === currentIndex 
                        ? 'bg-navy-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    {screen.icon}
                    <span>{screen.name}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="max-w-4xl mx-auto px-4 py-6 h-full overflow-y-auto">
            <CurrentScreen />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer navigation */}
      <footer className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentIndex === 0 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-navy-500 hover:bg-navy-50'
            }`}>
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="flex items-center gap-2">
            {isPlaying && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex items-center gap-1 text-teal-500 text-sm">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                <span className="hidden sm:inline">Playing</span>
              </motion.div>
            )}
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {screens.length}
            </span>
          </div>
          
          <button onClick={goNext} disabled={currentIndex === screens.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentIndex === screens.length - 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'bg-teal-500 text-white hover:bg-teal-600'
            }`}>
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default DemoShell;
