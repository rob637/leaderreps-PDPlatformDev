// src/components/screens/dashboard/TestUtilsModal.jsx
import React, { useState } from 'react';
import { Button } from './DashboardComponents.jsx';
import { COLORS } from './dashboardConstants.js';
import { Trash2 } from 'lucide-react';

const TestUtilsModal = ({ isOpen, onDeletePlan, onClose, membershipData, updateMembershipData }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSettingTier, setIsSettingTier] = useState(false);

  const safeMembership = membershipData || {};

  // Don't render if not open
  if (!isOpen) return null;

  const handleSetTier = async (tier) => {
    if (!updateMembershipData) {
      setStatusMessage('updateMembershipData not available');
      return;
    }
    setIsSettingTier(true);
    setStatusMessage('Setting tier...');
    try {
      const ok = await updateMembershipData({ currentTier: tier, lastUpdated: new Date().toISOString() });
      if (ok) {
        setStatusMessage(`membership.currentTier set to '${tier}'`);
      } else {
        setStatusMessage('Failed to update membership (false returned)');
      }
    } catch (err) {
      console.error('[TestUtils] Error setting tier:', err);
      setStatusMessage('Error updating membershipData');
    } finally {
      setIsSettingTier(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 max-w-md w-full">
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
          ⚙️ Test Utilities (Danger Zone)
        </h2>
        <p className="text-sm text-red-600 mb-4">
          WARNING: These actions are for debugging and QA only.
        </p>

        <div className="mb-4">
          <p className="text-sm font-semibold">Membership Snapshot</p>
          <pre className="text-xs p-3 mt-2 bg-gray-50 rounded" style={{ maxHeight: 160, overflow: 'auto' }}>{JSON.stringify(safeMembership, null, 2)}</pre>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button onClick={() => handleSetTier('premium')} variant="primary" size="sm" className="w-full" disabled={isSettingTier}>
            Set Tier: Premium
          </Button>
          <Button onClick={() => handleSetTier('free')} variant="outline" size="sm" className="w-full" disabled={isSettingTier}>
            Set Tier: Free
          </Button>
        </div>

        {statusMessage && (
          <div className="mb-3 text-sm text-gray-700">Status: {statusMessage}</div>
        )}

        {confirmDelete ? (
          <>
            <p className="text-base font-semibold mb-3">
              Are you sure? This will delete all plan and daily rep progress.
            </p>
            <Button onClick={onDeletePlan} variant="danger" size="md" className="w-full mb-2">
              <Trash2 className="w-4 h-4 mr-2" /> Yes, Delete Plan & Reset
            </Button>
            <Button onClick={() => setConfirmDelete(false)} variant="outline" size="sm" className="w-full">
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setConfirmDelete(true)} variant="secondary" size="md" className="w-full">
            Delete Plan and Start Over
          </Button>
        )}

        <div className="pt-4 mt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
          <Button onClick={onClose} variant="ghost" size="sm" className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default TestUtilsModal;
