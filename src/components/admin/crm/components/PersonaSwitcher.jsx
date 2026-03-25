/**
 * PersonaSwitcher — Prominent header component showing who you're acting as.
 * 
 * For admins: shows a dropdown to switch between team members.
 * For non-admins: shows their own name (no switching).
 * 
 * When acting as someone other than yourself, displays a bold colored banner
 * so you never accidentally send as the wrong person.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, UserCheck, AlertTriangle } from 'lucide-react';
import { usePersonaStore } from '../stores/personaStore';
import { useAuthStore } from '../stores/authStore';
import { TEAM_MEMBERS, isAdmin, getTeamMember, getCanonicalEmail } from '../config/team';

export default function PersonaSwitcher() {
  const { user } = useAuthStore();
  const { activePersonaEmail, getActivePersona, isActingAs, setPersona, clearPersona } = usePersonaStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const loggedInEmail = user?.email;
  const userIsAdmin = isAdmin(loggedInEmail);
  const persona = getActivePersona(loggedInEmail);
  const actingAsOther = isActingAs(loggedInEmail);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!persona) return null;

  const handleSelect = (email) => {
    const canonical = getCanonicalEmail(email);
    const myCanonical = getCanonicalEmail(loggedInEmail);
    if (canonical === myCanonical) {
      clearPersona();
    } else {
      setPersona(email);
    }
    setOpen(false);
  };

  // Determine the self member for display
  const selfMember = getTeamMember(loggedInEmail);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Main button / display */}
      <button
        onClick={() => userIsAdmin && setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          actingAsOther
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600 shadow-md'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
        } ${userIsAdmin ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Avatar with persona color */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: persona.color }}
        >
          {persona.initials}
        </div>

        <div className="flex flex-col items-start leading-tight">
          {actingAsOther && (
            <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Acting as
            </span>
          )}
          <span className={actingAsOther ? 'text-sm font-bold' : 'text-sm'}>
            {persona.name}
          </span>
        </div>

        {userIsAdmin && (
          <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''} ${
            actingAsOther ? 'text-amber-600' : 'text-slate-400'
          }`} />
        )}
      </button>

      {/* Dropdown */}
      {open && userIsAdmin && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            Act as team member
          </div>

          {/* Self option */}
          {selfMember && (
            <button
              onClick={() => handleSelect(selfMember.email)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                !actingAsOther ? 'bg-brand-teal/10 dark:bg-brand-teal/20' : ''
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: selfMember.color }}
              >
                {selfMember.initials}
              </div>
              <div className="flex-1 text-left">
                <span className="text-slate-900 dark:text-slate-100 font-medium">{selfMember.name}</span>
                <span className="text-slate-400 ml-1 text-xs">(you)</span>
              </div>
              {!actingAsOther && <UserCheck className="w-4 h-4 text-brand-teal" />}
            </button>
          )}

          <div className="border-t border-slate-200 dark:border-slate-600 my-1" />

          {/* Other team members */}
          {TEAM_MEMBERS.filter(m => m.email !== selfMember?.email).map(member => {
            const isActive = activePersonaEmail === member.email;
            return (
              <button
                key={member.email}
                onClick={() => handleSelect(member.email)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                  isActive ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-slate-900 dark:text-slate-100 font-medium">{member.name}</span>
                </div>
                {isActive && <UserCheck className="w-4 h-4 text-amber-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
