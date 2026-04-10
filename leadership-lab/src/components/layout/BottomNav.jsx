import { MessageCircle, Scan, FlaskConical, Users, BookOpen, LayoutDashboard, Calendar, Settings, ArrowLeftRight } from 'lucide-react';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { USER_NAV_ITEMS, FACILITATOR_NAV_ITEMS, SCREENS } from '../../config/navigation.js';

const ICON_MAP = {
  MessageCircle,
  Scan,
  FlaskConical,
  Users,
  BookOpen,
  LayoutDashboard,
  Calendar,
  Settings,
};

export default function BottomNav() {
  const { currentScreen, navigate } = useNavigation();
  const { isFacilitator, viewAs, setViewAs } = useAuth();

  const showingFacilitator = isFacilitator && viewAs === 'facilitator';
  const navItems = showingFacilitator ? FACILITATOR_NAV_ITEMS : USER_NAV_ITEMS;

  // Hide bottom nav on full-screen views like conversations
  if (currentScreen === 'conversation') return null;

  function handleToggle() {
    const next = viewAs === 'facilitator' ? 'participant' : 'facilitator';
    setViewAs(next);
    navigate(next === 'facilitator' ? SCREENS.ADMIN : SCREENS.FEED, {}, { replace: true });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = currentScreen === item.key;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key, {}, { replace: true })}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-lab-teal'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        {isFacilitator && (
          <button
            onClick={handleToggle}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all text-stone-400 hover:text-lab-coral"
            title={showingFacilitator ? 'Switch to participant view' : 'Switch to facilitator view'}
          >
            <ArrowLeftRight size={22} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">
              {showingFacilitator ? 'Leader' : 'Trainer'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
