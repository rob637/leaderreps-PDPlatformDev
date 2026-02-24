import React from 'react';
import { 
  X, User, Mail, Phone, Linkedin, Building2, 
  MessageSquare, Award, Calendar
} from 'lucide-react';
import { Button } from '../ui';
import FacilitatorAvatar from './FacilitatorAvatar';

/**
 * FacilitatorProfileModal - Shows facilitator introduction and contact info
 * 
 * Displays:
 * - Photo or initials avatar
 * - Name and title
 * - Bio/summary
 * - Contact options (email, phone, LinkedIn)
 * 
 * Props:
 * - facilitator: { name, email, title, bio, photoUrl, phone, linkedIn }
 * - cohortName: optional cohort name for context
 * - onClose: close handler
 * - isOpen: visibility state
 */
const FacilitatorProfileModal = ({ facilitator, cohortName, onClose, isOpen }) => {
  if (!isOpen || !facilitator) return null;

  const {
    name = 'Your Facilitator',
    email,
    title = 'Leadership Facilitator',
    bio,
    photoUrl,
    phone,
    linkedIn
  } = facilitator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-corporate-navy via-corporate-navy/95 to-corporate-teal pt-8 pb-16 px-6">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="text-center">
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">
              {cohortName ? `${cohortName} Facilitator` : 'Your Facilitator'}
            </p>
          </div>
        </div>

        {/* Profile Card - overlaps header */}
        <div className="relative -mt-12 px-6">
          <div className="bg-white dark:bg-slate-700 rounded-xl shadow-lg p-6 border border-slate-100 dark:border-slate-600">
            {/* Avatar */}
            <div className="flex justify-center -mt-14 mb-4">
              <FacilitatorAvatar name={name} photoUrl={photoUrl} size="lg" />
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-corporate-navy dark:text-white">{name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-1.5 mt-1">
                <Award className="w-4 h-4" />
                {title}
              </p>
            </div>

            {/* Bio */}
            {bio && (
              <div className="bg-slate-50 dark:bg-slate-600 rounded-xl p-4 mb-4">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{bio}</p>
              </div>
            )}

            {/* Contact Options */}
            <div className="space-y-2">
              {email && (
                <a 
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-corporate-teal/5 hover:bg-corporate-teal/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-corporate-teal" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                    <p className="text-sm text-corporate-navy dark:text-white font-medium group-hover:text-corporate-teal transition-colors">{email}</p>
                  </div>
                </a>
              )}

              {phone && (
                <a 
                  href={`tel:${phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-corporate-teal/5 hover:bg-corporate-teal/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-corporate-teal" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="text-sm text-corporate-navy dark:text-white font-medium group-hover:text-corporate-teal transition-colors">{phone}</p>
                  </div>
                </a>
              )}

              {linkedIn && (
                <a 
                  href={
                    linkedIn.startsWith('http') 
                      ? linkedIn 
                      : linkedIn.includes('linkedin.com')
                        ? `https://${linkedIn}`
                        : `https://linkedin.com/in/${linkedIn}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">LinkedIn</p>
                    <p className="text-sm text-blue-600 font-medium group-hover:underline">View Profile</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FacilitatorProfileModal;
