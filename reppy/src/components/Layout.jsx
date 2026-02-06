import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import { useTheme } from '../App';

export default function Layout() {
  const { isDark } = useTheme();
  
  return (
    <>
      {/* Shared Header with Logo */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-gray-900/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'} safe-area-top`}>
        <div className="flex justify-center py-3 px-5">
          <img 
            src={isDark ? "/logo-full.png" : "/logo-full-white.png"} 
            alt="LeaderReps" 
            className={`${isDark ? 'h-8' : 'h-10'} object-contain`}
          />
        </div>
      </div>
      <Outlet />
      <BottomNavigation />
    </>
  );
}
