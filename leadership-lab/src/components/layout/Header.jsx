import { useAuth } from '../../hooks/useAuth.js';

/**
 * Top header with LeaderReps branding + current role indicator.
 * Always visible (except on full-screen views like ConversationScreen).
 */
export default function Header() {
  const { isFacilitator, viewAs, user, userProfile } = useAuth();
  const showingFacilitator = isFacilitator && viewAs === 'facilitator';

  const name =
    userProfile?.firstName ||
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    '';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2.5 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/leaderreps-logo.svg"
            alt=""
            className="h-8 w-8 flex-shrink-0 rounded-lg"
          />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-bold text-lab-navy truncate">
              Leadership Lab
            </p>
            {name && (
              <p className="text-[11px] text-stone-500 truncate">
                {showingFacilitator ? `${name} · Trainer` : name}
              </p>
            )}
          </div>
        </div>
        {isFacilitator && (
          <button
            type="button"
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 ${
              showingFacilitator
                ? 'bg-lab-coral/10 text-lab-coral ring-1 ring-lab-coral/20'
                : 'bg-lab-teal/10 text-lab-teal ring-1 ring-lab-teal/20'
            }`}
            title={
              showingFacilitator
                ? 'You are viewing the app as a Trainer'
                : 'You are viewing the app as a Leader'
            }
          >
            {showingFacilitator ? 'Trainer' : 'Leader'}
          </button>
        )}
      </div>
    </header>
  );
}
