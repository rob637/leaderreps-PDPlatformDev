import React from 'react';
import { Card } from '../ui';
import { PenTool, Save, Zap, Quote, User } from 'lucide-react';

const GroundingRepWidget = ({ scope }) => {
  const {
    identityStatement,
    setIdentityStatement,
    handleSaveIdentity,
    isEditingLIS,
    setIsEditingLIS
  } = scope;

  const hasLIS = identityStatement && identityStatement.trim().length > 0;
  const isEditing = typeof isEditingLIS !== 'undefined' ? isEditingLIS : false;
  const setEditing = typeof setIsEditingLIS !== 'undefined' ? setIsEditingLIS : () => {};

  if (isEditing) {
    return (
      <Card title="LIS Maker" icon={PenTool} accent="NAVY">
        <div className="space-y-2">
          <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
            <h4 className="font-bold text-teal-900 mb-1">Build Your Identity</h4>
            <p className="text-sm text-teal-800 mb-2">
              Your Leadership Identity Statement (LIS) anchors you in who you want to be.
            </p>
            <p className="text-xs text-teal-600 italic mb-1">
              Try this format: "I am a [Core Value] leader who [Action] to create [Impact]."
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Your Statement
            </label>
            <textarea 
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.target.value)}
              onBlur={() => handleSaveIdentity(identityStatement)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm min-h-[80px]"
              placeholder="I am a..."
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setEditing(false)}
              className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                handleSaveIdentity(identityStatement);
                setEditing(false);
              }}
              className="flex-1 py-2 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Grounding Rep" icon={Zap} accent="ORANGE">
      {hasLIS ? (
        <div className="text-center relative overflow-hidden group">
          
          <p className="text-lg font-serif font-medium text-slate-800 relative z-10 italic">
            "{identityStatement}"
          </p>
          
          <div className="mt-1 flex justify-center">
             <button 
               className="text-xs font-bold text-yellow-700 hover:text-yellow-800 uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
               onClick={() => setEditing(true)}
             >
               Edit Statement
             </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
            <User className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-700 mb-1">Who are you as a leader?</h4>
          <p className="text-sm text-slate-500 mb-3">
            You haven't defined your Leadership Identity Statement yet.
          </p>
          <button 
            className="px-4 py-2 bg-[#002E47] text-white rounded-lg text-sm font-bold hover:bg-[#003E5F] transition-colors"
            onClick={() => setEditing(true)}
          >
            Create LIS
          </button>
        </div>
      )}
    </Card>
  );
};

export default GroundingRepWidget;
