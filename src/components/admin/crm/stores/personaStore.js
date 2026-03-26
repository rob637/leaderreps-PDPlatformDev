/**
 * Persona Store
 * 
 * Allows admins to "act as" a different team member.
 * The active persona determines:
 *   - Which prospects show as "mine"
 *   - Which Gmail account is used for sending
 *   - Who activities are logged under
 * 
 * Non-admins always act as themselves.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TEAM_MEMBERS, getTeamMember, isAdmin, getCanonicalEmail } from '../config/team';

export const usePersonaStore = create(
  persist(
    (set, get) => ({
      // The email of the team member we're acting as (null = use logged-in user)
      activePersonaEmail: null,

      /**
       * Get the active persona (team member object).
       * Falls back to the logged-in user if no persona is set.
       */
      getActivePersona: (loggedInEmail) => {
        const { activePersonaEmail } = get();
        if (activePersonaEmail) {
          return getTeamMember(activePersonaEmail) || null;
        }
        if (loggedInEmail) {
          return getTeamMember(loggedInEmail) || null;
        }
        return null;
      },

      /**
       * Get the canonical email for the active persona.
       * This is what should be used for prospect ownership, activity logging, etc.
       */
      getActiveEmail: (loggedInEmail) => {
        const { activePersonaEmail } = get();
        return activePersonaEmail || getCanonicalEmail(loggedInEmail);
      },

      /**
       * Switch to acting as a different team member.
       * Only admins should call this.
       */
      setPersona: (email) => {
        set({ activePersonaEmail: email ? getCanonicalEmail(email) : null });
      },

      /**
       * Reset to acting as the logged-in user.
       */
      clearPersona: () => {
        set({ activePersonaEmail: null });
      },

      /**
       * Check if we're acting as someone other than the logged-in user.
       */
      isActingAs: (loggedInEmail) => {
        const { activePersonaEmail } = get();
        if (!activePersonaEmail) return false;
        return activePersonaEmail !== getCanonicalEmail(loggedInEmail);
      },
    }),
    {
      name: 'lr-crm-persona',
      partialize: (state) => ({ activePersonaEmail: state.activePersonaEmail }),
    }
  )
);
