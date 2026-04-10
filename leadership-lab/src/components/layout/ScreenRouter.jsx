import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { SCREENS } from '../../config/navigation.js';
import FeedScreen from '../screens/FeedScreen.jsx';
import ConversationScreen from '../screens/ConversationScreen.jsx';
import MirrorScreen from '../screens/MirrorScreen.jsx';
import LabScreen from '../screens/LabScreen.jsx';
import CohortScreen from '../screens/CohortScreen.jsx';
import StoryScreen from '../screens/StoryScreen.jsx';
import OnboardingScreen from '../screens/OnboardingScreen.jsx';
import WarRoomScreen from '../screens/WarRoomScreen.jsx';
import MemberDeepDiveScreen from '../screens/MemberDeepDiveScreen.jsx';
import SessionPlannerScreen from '../screens/SessionPlannerScreen.jsx';
import AdminScreen from '../screens/AdminScreen.jsx';

const SCREEN_MAP = {
  [SCREENS.FEED]: FeedScreen,
  [SCREENS.CONVERSATION]: ConversationScreen,
  [SCREENS.MIRROR]: MirrorScreen,
  [SCREENS.LAB]: LabScreen,
  [SCREENS.COHORT]: CohortScreen,
  [SCREENS.STORY]: StoryScreen,
  [SCREENS.ONBOARDING]: OnboardingScreen,
  [SCREENS.WAR_ROOM]: WarRoomScreen,
  [SCREENS.MEMBER_DEEP_DIVE]: MemberDeepDiveScreen,
  [SCREENS.SESSION_PLANNER]: SessionPlannerScreen,
  [SCREENS.ADMIN]: AdminScreen,
};

export default function ScreenRouter() {
  const { currentScreen, screenParams } = useNavigation();

  const Screen = SCREEN_MAP[currentScreen];

  if (!Screen) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        <p>Screen not found: {currentScreen}</p>
      </div>
    );
  }

  return <Screen key={JSON.stringify(screenParams)} {...screenParams} />;
}
