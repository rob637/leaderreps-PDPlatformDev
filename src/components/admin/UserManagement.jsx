import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  User,
  Search, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Copy,
  Trash2,
  Clock,
  Send,
  Globe,
  FileText,
  Save,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Plus,
  UserCog
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  setDoc,
  addDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { buildModulePath } from '../../services/pathUtils';
import { COMMON_TIMEZONES, DEFAULT_TIMEZONE } from '../../services/dateUtils';
import NotificationSettingsModal from './NotificationSettingsModal';

// Facilitators are now stored in Firestore 'facilitators' collection
// and managed via the Facilitators tab in this admin panel

const UserManagement = () => {
  const { db, user } = useAppServices();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'invites', 'cohorts'
  const [users, setUsers] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const [invites, setInvites] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState('displayName'); // 'displayName', 'role', 'cohort', 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  
  // Invite Form State
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    cohortId: '',
    customMessage: "You're invited to join the LeaderReps Arena!"
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUserForNotifications, setSelectedUserForNotifications] = useState(null);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Cohort Form State
  const [cohortForm, setCohortForm] = useState({
    name: '',
    startDate: '',
    timezone: DEFAULT_TIMEZONE,
    description: '',
    facilitatorId: '',
    maxCapacity: 25,
    allowLateJoins: true,
    lateJoinCutoff: 0
  });
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [savingCohort, setSavingCohort] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Facilitator State
  const [facilitators, setFacilitators] = useState([]);
  const [facilitatorForm, setFacilitatorForm] = useState({
    id: null,
    displayName: '',
    email: '',
    title: '',
    bio: '',
    photoUrl: '',
    phone: '',
    linkedIn: ''
  });
  const [isFacilitatorModalOpen, setIsFacilitatorModalOpen] = useState(false);
  const [savingFacilitator, setSavingFacilitator] = useState(false);

  // Handler to select a facilitator for a cohort
  const handleFacilitatorSelect = (facilitatorId) => {
    setCohortForm(prev => ({
      ...prev,
      facilitatorId: facilitatorId
    }));
  };

  // Email Template State
  const [emailTemplate, setEmailTemplate] = useState({
    subject: "You're invited to LeaderReps PD Platform",
    headline: "Welcome to LeaderReps!",
    bodyText: "You have been invited to join the LeaderReps Professional Development Platform.",
    buttonText: "Accept Invitation",
    expiryText: "This invitation will expire in 7 days.",
    footerText: "If you did not expect this invitation, please ignore this email."
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    console.log('[UserManagement] Starting fetchData...', { activeTab, userEmail: user?.email });
    try {
      // Fetch admin emails first
      let admins = ['rob@sagecg.com', 'ryan@leaderreps.com', 'admin@leaderreps.com'];
      try {
        const metadataRef = doc(db, 'metadata', 'config');
        const metadataSnap = await getDoc(metadataRef);
        if (metadataSnap.exists()) {
          const data = metadataSnap.data();
          if (data.adminemails && Array.isArray(data.adminemails)) {
            admins = data.adminemails;
          }
        }
      } catch (e) {
        console.error("Error fetching admin config:", e);
      }
      setAdminEmails(admins);

      // Fetch facilitators for dropdown use in multiple tabs
      try {
        const facilitatorsRef = collection(db, 'facilitators');
        const facilitatorsSnap = await getDocs(query(facilitatorsRef, orderBy('displayName')));
        const facilitatorsList = facilitatorsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFacilitators(facilitatorsList);
      } catch (e) {
        console.error('[UserManagement] Error fetching facilitators:', e);
      }

      if (activeTab === 'users') {
        // Fetch Users
        console.log('[UserManagement] Fetching users from collection...');
        const usersRef = collection(db, 'users');
        const qUsers = query(usersRef, orderBy('email'));
        const usersSnap = await getDocs(qUsers);
        console.log('[UserManagement] Got users snapshot, count:', usersSnap.docs.length);
        const usersList = usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().disabled ? 'Disabled' : 'Active',
          type: 'user'
        }));

        // Build a set of existing user emails (lowercase) for deduplication
        const existingUserEmails = new Set(
          usersList.map(u => (u.email || '').toLowerCase().trim())
        );

        // Fetch Invites - only show pending/sent invites (not accepted ones)
        // AND filter out invites where a user account already exists with that email
        const invitesRef = collection(db, 'invitations');
        const qInvites = query(invitesRef, orderBy('createdAt', 'desc'));
        const invitesSnap = await getDocs(qInvites);
        console.log('[UserManagement] Got invitations snapshot, count:', invitesSnap.docs.length);
        const invitesList = invitesSnap.docs
          .filter(doc => {
            const data = doc.data();
            const status = data.status;
            const inviteEmail = (data.email || '').toLowerCase().trim();
            
            // Only show invites that haven't been accepted yet
            // AND don't already have a corresponding user account
            const isPending = status === 'pending' || status === 'sent';
            const hasExistingUser = existingUserEmails.has(inviteEmail);
            
            // If there's already a user with this email, don't show the pending invite
            // (This handles the case where invite wasn't properly marked as accepted)
            if (hasExistingUser && isPending) {
              console.log(`[UserManagement] Hiding orphaned invite for ${inviteEmail} - user already exists`);
              return false;
            }
            
            return isPending;
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            displayName: doc.data().name, // Map name to displayName for consistent rendering
            status: 'Pending',
            type: 'invite'
          }));

        // Combine and sort by email
        const allUsers = [...usersList, ...invitesList].sort((a, b) => 
          (a.email || '').localeCompare(b.email || '')
        );
        
        console.log('[UserManagement] Total users+invites:', allUsers.length);
        setUsers(allUsers);
      } else if (activeTab === 'invites') {
        const invitesRef = collection(db, 'invitations');
        const q = query(invitesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const invitesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvites(invitesList);
      } else if (activeTab === 'cohorts') {
        // Already fetched in separate effect, but refresh here
        const cohortsRef = collection(db, 'cohorts');
        const q = query(cohortsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const cohortsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCohorts(cohortsList);
      } else if (activeTab === 'templates') {
        // Fetch email templates
        try {
          const templateDoc = await getDoc(doc(db, 'metadata', 'email_templates'));
          if (templateDoc.exists()) {
            const templates = templateDoc.data();
            if (templates.invite) {
              setEmailTemplate(prev => ({ ...prev, ...templates.invite }));
            }
          }
        } catch (e) {
          console.error('[UserManagement] Error fetching email templates:', e);
        }
      }
      console.log('[UserManagement] fetchData complete', { usersCount: users.length });
    } catch (error) {
      console.error("[UserManagement] Error fetching data:", error);
      setFetchError(error.message || 'Failed to load data. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  }, [db, activeTab, user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Cohorts on mount regardless of tab, for dropdowns
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const cohortsRef = collection(db, 'cohorts');
        const q = query(cohortsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const cohortsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCohorts(cohortsList);
      } catch (error) {
        console.error("Error fetching cohorts:", error);
      }
    };
    fetchCohorts();
  }, [db]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'enable' : 'disable'} this user?`)) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        disabled: !currentStatus
      });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, disabled: !currentStatus } : u
      ));
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const handleAssignCohort = async (userId, cohortId) => {
    if (!cohortId) return;
    const cohort = cohorts.find(c => c.id === cohortId);
    if (!cohort) return;

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const isInvite = targetUser.type === 'invite';
    const confirmMessage = isInvite 
      ? `Assign invite for "${targetUser.displayName || targetUser.email}" to cohort "${cohort.name}"?`
      : `Assign user to cohort "${cohort.name}"? This will reset their start date to ${new Date(cohort.startDate.seconds * 1000).toLocaleDateString()}.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      if (isInvite) {
        // Update Invitation
        const inviteRef = doc(db, 'invitations', userId);
        await updateDoc(inviteRef, { cohortId });
      } else {
        // 1. Update User Profile
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { cohortId });

        // 2. Update Development Plan Start Date
        // Path: modules/{userId}/development_plan/current
        const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
        const devPlanRef = doc(db, devPlanPath);
        
        // Use setDoc with merge: true to handle cases where the plan doesn't exist yet
        await setDoc(devPlanRef, {
          startDate: cohort.startDate
        }, { merge: true });
      }

      // Optimistic Update
      setUsers(users.map(u => 
        u.id === userId ? { ...u, cohortId } : u
      ));
      
      alert(`${isInvite ? 'Invite' : 'User'} assigned to cohort successfully.`);
    } catch (error) {
      console.error("Error assigning cohort:", error);
      alert("Failed to assign cohort.");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const isInvite = targetUser.type === 'invite';
    const targetEmailLower = targetUser.email?.toLowerCase();
    const currentIsAdmin = adminEmails.some(e => e.toLowerCase() === targetEmailLower);
    const newIsAdmin = newRole === 'admin';
    
    const roleLabel = newRole === 'admin' ? 'Admin' : 'User';
    const confirmMessage = isInvite
      ? `Change role for invite "${targetUser.displayName || targetUser.email}" to ${roleLabel}?`
      : `Change role for "${targetUser.displayName || targetUser.email}" to ${roleLabel}?${newIsAdmin ? '\n\nThis will grant admin access to the Admin Command Center.' : ''}`;

    if (!window.confirm(confirmMessage)) return;

    try {
      if (isInvite) {
        // Update Invitation
        const inviteRef = doc(db, 'invitations', userId);
        await updateDoc(inviteRef, { role: newRole });
      } else {
        // 1. Update User Profile
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role: newRole });

        // 2. Update adminemails list in metadata/config
        const configRef = doc(db, 'metadata', 'config');
        
        if (newIsAdmin && !currentIsAdmin) {
          // Add to admin emails (always use lowercase)
          await updateDoc(configRef, {
            adminemails: arrayUnion(targetEmailLower)
          });
          setAdminEmails([...adminEmails, targetEmailLower]);
        } else if (!newIsAdmin && currentIsAdmin) {
          // Remove from admin emails (use lowercase for matching)
          await updateDoc(configRef, {
            adminemails: arrayRemove(targetEmailLower)
          });
          setAdminEmails(adminEmails.filter(e => e.toLowerCase() !== targetEmailLower));
        }
      }

      // Optimistic Update for user role
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      alert(`Role updated to ${roleLabel} successfully.`);
    } catch (error) {
      console.error("Error changing role:", error);
      alert("Failed to change role.");
    }
  };

  const handleResendInvite = async (userObj) => {
    // Determine the email and test status
    const email = userObj.email;
    const isTest = userObj.isTest;
    const testRecipient = userObj.testRecipient;
    const displayName = userObj.displayName || 
      (userObj.firstName || userObj.lastName 
        ? `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() 
        : email);
    const inviteId = userObj.id;

    let message = `Resend invitation to ${displayName} (${email})?`;
    
    if (isTest) {
      message += `\n\n(TEST MODE: This email will be redirected to ${testRecipient || 'admin'})`;
    }

    if (!window.confirm(message)) return;
    
    try {
      await updateDoc(doc(db, 'invitations', inviteId), {
        resend: true,
        status: 'pending',
        updatedAt: serverTimestamp()
      });
      alert(`Invitation re-sent to ${isTest ? (testRecipient || 'admin') : email}.`);
    } catch (error) {
      console.error("Error resending invite:", error);
      alert("Failed to resend invite");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    
    // Validate: Cohort is required
    if (!inviteForm.cohortId) {
      alert('Please select a Cohort. All users must be assigned to a cohort.');
      return;
    }
    
    // Validate: If test mode is enabled, testRecipient is required
    if (inviteForm.isTest && !inviteForm.testRecipient?.trim()) {
      alert('Test Mode requires an Override Email address. Please enter the email where test notifications should be sent.');
      return;
    }
    
    setSendingInvite(true);
    
    try {
      const normalizedEmail = inviteForm.email.toLowerCase().trim();
      
      // Check if a user account already exists with this email
      const existingUser = users.find(u => 
        u.type === 'user' && (u.email || '').toLowerCase().trim() === normalizedEmail
      );
      if (existingUser) {
        alert("A user account already exists with this email address.");
        setSendingInvite(false);
        return;
      }
      
      // Check if there's already a pending invitation for this email
      const existingInvite = invites.find(i => i.email.toLowerCase() === normalizedEmail);
      if (existingInvite) {
        alert("An invitation has already been sent to this email.");
        setSendingInvite(false);
        return;
      }

      const inviteData = {
        email: normalizedEmail,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        role: inviteForm.role,
        cohortId: inviteForm.cohortId || null,
        customMessage: inviteForm.customMessage,
        status: 'pending',
        createdAt: serverTimestamp(),
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        createdBy: 'admin',
        isTest: inviteForm.isTest || false,
        testRecipient: inviteForm.isTest ? inviteForm.testRecipient.trim() : null
      };

      await addDoc(collection(db, 'invitations'), inviteData);
      
      // Show appropriate message based on test mode
      if (inviteForm.isTest) {
        alert(`Invitation created for ${inviteForm.email}\n\n🧪 TEST MODE: Email will be sent to ${inviteForm.testRecipient}\n\nAll notifications for this test user will also be redirected to this address.`);
      } else {
        alert(`Invitation created for ${inviteForm.email}`);
      }
      setIsInviteModalOpen(false);
      setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        role: 'user',
        cohortId: '',
        customMessage: "You're invited to join the LeaderReps Arena!",
        isTest: false,
        testRecipient: ''
      });
      fetchData();
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to create invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSaveEmailTemplate = async () => {
    setSavingTemplate(true);
    try {
      await setDoc(doc(db, 'metadata', 'email_templates'), {
        invite: emailTemplate,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email
      }, { merge: true });
      alert('Email template saved successfully!');
    } catch (error) {
      console.error('Error saving email template:', error);
      alert('Failed to save email template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteCohort = async (cohortId) => {
    if (!window.confirm("Are you sure you want to delete this cohort? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'cohorts', cohortId));
      setCohorts(cohorts.filter(c => c.id !== cohortId));
    } catch (error) {
      console.error("Error deleting cohort:", error);
      alert("Failed to delete cohort");
    }
  };

  const handleEditCohort = (cohort) => {
    // Format date for datetime-local input (YYYY-MM-DDThh:mm)
    let dateStr = '';
    if (cohort.startDate) {
      const date = cohort.startDate.toDate ? cohort.startDate.toDate() : new Date(cohort.startDate);
      if (!isNaN(date.getTime())) {
        // Adjust to local ISO string for input
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date - offset)).toISOString().slice(0, 16);
        dateStr = localISOTime;
      }
    }

    setCohortForm({
      id: cohort.id,
      name: cohort.name,
      startDate: dateStr,
      timezone: cohort.timezone || DEFAULT_TIMEZONE,
      description: cohort.description || '',
      facilitatorId: cohort.facilitator?.id || '',
      maxCapacity: cohort.settings?.maxCapacity || 25,
      allowLateJoins: cohort.settings?.allowLateJoins ?? true,
      lateJoinCutoff: cohort.settings?.lateJoinCutoff ?? 0
    });
    setIsCohortModalOpen(true);
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    setSavingCohort(true);

    try {
      const startDate = new Date(cohortForm.startDate);
      // Note: We preserve the time selected by the user for session scheduling
      
      // Build facilitator object from fetched facilitators
      const selectedFacilitator = facilitators.find(f => f.id === cohortForm.facilitatorId);
      const facilitatorData = selectedFacilitator ? {
        id: selectedFacilitator.id,
        name: selectedFacilitator.displayName,
        email: selectedFacilitator.email,
        title: selectedFacilitator.title || 'Leadership Facilitator',
        bio: selectedFacilitator.bio || '',
        photoUrl: selectedFacilitator.photoUrl || '',
        phone: selectedFacilitator.phone || '',
        linkedIn: selectedFacilitator.linkedIn || ''
      } : null;

      const cohortData = {
        name: cohortForm.name,
        description: cohortForm.description || '',
        startDate: Timestamp.fromDate(startDate),
        timezone: cohortForm.timezone || DEFAULT_TIMEZONE,
        facilitator: facilitatorData,
        settings: {
          maxCapacity: parseInt(cohortForm.maxCapacity) || 25,
          allowLateJoins: cohortForm.allowLateJoins,
          lateJoinCutoff: parseInt(cohortForm.lateJoinCutoff) || 3
        }
      };

      if (cohortForm.id) {
        // Update existing cohort
        await updateDoc(doc(db, 'cohorts', cohortForm.id), {
          ...cohortData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new cohort
        await addDoc(collection(db, 'cohorts'), {
          ...cohortData,
          memberCount: 0,
          createdAt: serverTimestamp()
        });
      }

      setIsCohortModalOpen(false);
      setCohortForm({
        name: '',
        startDate: '',
        description: '',
        facilitatorId: '',
        maxCapacity: 25,
        allowLateJoins: true,
        lateJoinCutoff: 0,
        timezone: DEFAULT_TIMEZONE
      });
      fetchData();
    } catch (error) {
      console.error("Error saving cohort:", error);
      alert("Failed to save cohort");
    } finally {
      setSavingCohort(false);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!window.confirm("Are you sure you want to delete this invitation?")) return;
    try {
      await deleteDoc(doc(db, 'invitations', inviteId));
      setInvites(invites.filter(i => i.id !== inviteId));
      setUsers(users.filter(u => u.id !== inviteId));
    } catch (error) {
      console.error("Error deleting invite:", error);
    }
  };

  // Facilitator CRUD handlers
  const handleOpenFacilitatorModal = (facilitator = null) => {
    if (facilitator) {
      setFacilitatorForm({
        id: facilitator.id,
        displayName: facilitator.displayName || '',
        email: facilitator.email || '',
        title: facilitator.title || '',
        bio: facilitator.bio || '',
        photoUrl: facilitator.photoUrl || '',
        phone: facilitator.phone || '',
        linkedIn: facilitator.linkedIn || ''
      });
    } else {
      setFacilitatorForm({
        id: null,
        displayName: '',
        email: '',
        title: '',
        bio: '',
        photoUrl: '',
        phone: '',
        linkedIn: ''
      });
    }
    setIsFacilitatorModalOpen(true);
  };

  const handleSaveFacilitator = async (e) => {
    e.preventDefault();
    setSavingFacilitator(true);

    try {
      const facilitatorData = {
        displayName: facilitatorForm.displayName,
        email: facilitatorForm.email.toLowerCase().trim(),
        title: facilitatorForm.title,
        bio: facilitatorForm.bio,
        photoUrl: facilitatorForm.photoUrl,
        phone: facilitatorForm.phone,
        linkedIn: facilitatorForm.linkedIn,
        updatedAt: serverTimestamp()
      };

      if (facilitatorForm.id) {
        // Update existing facilitator
        await updateDoc(doc(db, 'facilitators', facilitatorForm.id), facilitatorData);
      } else {
        // Create new facilitator
        await addDoc(collection(db, 'facilitators'), {
          ...facilitatorData,
          createdAt: serverTimestamp()
        });
      }

      setIsFacilitatorModalOpen(false);
      fetchData(); // Refresh the facilitators list
    } catch (error) {
      console.error("Error saving facilitator:", error);
      alert("Failed to save facilitator");
    } finally {
      setSavingFacilitator(false);
    }
  };

  const handleDeleteFacilitator = async (facilitatorId) => {
    if (!window.confirm("Are you sure you want to delete this facilitator? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, 'facilitators', facilitatorId));
      setFacilitators(facilitators.filter(f => f.id !== facilitatorId));
    } catch (error) {
      console.error("Error deleting facilitator:", error);
      alert("Failed to delete facilitator");
    }
  };

  // Helper to get cohort name for sorting
  const getCohortName = useCallback((user) => {
    const cohort = cohorts.find(c => c.id === user.cohortId);
    return cohort?.name || '';
  }, [cohorts]);

  // Sort toggle handler
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-corporate-teal" />
      : <ArrowDown className="w-3.5 h-3.5 text-corporate-teal" />;
  };

  const filteredUsers = useMemo(() => {
    // First filter
    let result = users.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Then sort
    result.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortColumn) {
        case 'displayName':
          aVal = (a.displayName || a.email || '').toLowerCase();
          bVal = (b.displayName || b.email || '').toLowerCase();
          break;
        case 'role':
          aVal = (a.role || 'user').toLowerCase();
          bVal = (b.role || 'user').toLowerCase();
          break;
        case 'cohort':
          aVal = getCohortName(a).toLowerCase();
          bVal = getCohortName(b).toLowerCase();
          break;
        case 'status':
          aVal = a.disabled ? 'disabled' : 'active';
          bVal = b.disabled ? 'disabled' : 'active';
          break;
        default:
          aVal = '';
          bVal = '';
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [users, searchTerm, sortColumn, sortDirection, getCohortName]);

  const filteredInvites = invites.filter(invite => 
    invite.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invite.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invite.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">User Management <span className="text-xs text-slate-400 font-normal">(v1.2.1)</span></h2>
          <p className="text-slate-500 dark:text-slate-400">Manage users, cohorts, and invitations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenFacilitatorModal()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <UserCog className="w-4 h-4" />
            Add Facilitator
          </button>
          <button
            onClick={() => setIsCohortModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Users className="w-4 h-4" />
            New Cohort
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('cohorts')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'cohorts'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Cohorts
        </button>
        <button
          onClick={() => setActiveTab('facilitators')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'facilitators'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <UserCog className="w-4 h-4" />
            Facilitators
          </span>
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'invites'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Invitations
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'templates'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Email Templates
          </span>
        </button>
      </div>

      {/* Search Bar */}
      {activeTab !== 'cohorts' && activeTab !== 'facilitators' && activeTab !== 'templates' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 dark:text-slate-400">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {activeTab === 'users' ? (
                  <>
                    <th 
                      className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
                      onClick={() => handleSort('displayName')}
                    >
                      <div className="flex items-center gap-1.5">
                        User
                        <SortIcon column="displayName" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-1.5">
                        Role
                        <SortIcon column="role" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
                      onClick={() => handleSort('cohort')}
                    >
                      <div className="flex items-center gap-1.5">
                        Cohort
                        <SortIcon column="cohort" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        <SortIcon column="status" />
                      </div>
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                  </>
                ) : activeTab === 'cohorts' ? (
                  <>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Cohort Name</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Start Date</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Members</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                  </>
                ) : activeTab === 'facilitators' ? (
                  <>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Facilitator</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Email</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Title</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Recipient</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Role</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Cohort</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {activeTab === 'users' && (
                filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-corporate-navy/10 flex items-center justify-center text-corporate-navy font-bold">
                            {user.displayName?.[0] || user.email?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{user.displayName || 'No Name'}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={adminEmails.some(e => e.toLowerCase() === user.email?.toLowerCase()) ? 'admin' : (user.role || 'user')}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className={`text-xs px-2.5 py-1 rounded-md border-0 font-medium cursor-pointer ${
                            adminEmails.some(e => e.toLowerCase() === user.email?.toLowerCase()) || user.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800' 
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800'
                          }`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.cohortId || ''}
                          onChange={(e) => handleAssignCohort(user.id, e.target.value)}
                          className="text-xs border-slate-200 dark:border-slate-700 rounded-md focus:ring-corporate-teal focus:border-corporate-teal"
                        >
                          <option value="">No Cohort</option>
                          {cohorts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {user.status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : user.disabled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800">
                            <XCircle className="w-3 h-3" /> Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.type === 'user' ? (
                            <>
                              <button
                                onClick={() => setSelectedUserForNotifications(user)}
                                className="text-xs font-medium px-3 py-1 rounded-md transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100"
                              >
                                Notifications
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user.id, user.disabled)}
                                className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                                  user.disabled 
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100' 
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100'
                                }`}
                              >
                                {user.disabled ? 'Enable' : 'Disable'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleResendInvite(user)}
                                className="text-xs font-medium px-3 py-1 rounded-md transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                                title="Resend Invite"
                              >
                                <Send className="w-3 h-3" /> Resend
                              </button>
                              <button
                                onClick={() => handleDeleteInvite(user.id)}
                                className="text-xs font-medium px-3 py-1 rounded-md transition-colors bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100"
                              >
                                Delete Invite
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      {fetchError ? (
                        <div className="text-red-600">
                          <p className="font-medium">Error loading users</p>
                          <p className="text-sm mt-1">{fetchError}</p>
                          <button 
                            onClick={() => fetchData()} 
                            className="mt-2 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        'No users found matching your search.'
                      )}
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'cohorts' && (
                cohorts.length > 0 ? (
                  cohorts.map((cohort) => (
                    <tr key={cohort.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {cohort.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {cohort.startDate?.toDate ? cohort.startDate.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {users.filter(u => u.cohortId === cohort.id).length} Users
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditCohort(cohort)}
                            className="p-1 text-slate-400 hover:text-corporate-teal transition-colors"
                            title="Edit Cohort"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCohort(cohort.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Cohort"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No cohorts defined. Create one to get started.
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'facilitators' && (
                facilitators.length > 0 ? (
                  facilitators.map((facilitator) => (
                    <tr key={facilitator.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {facilitator.photoUrl ? (
                            <img 
                              src={facilitator.photoUrl} 
                              alt={facilitator.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-corporate-teal/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-corporate-teal" />
                            </div>
                          )}
                          <span className="font-medium text-slate-900 dark:text-white">
                            {facilitator.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {facilitator.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {facilitator.title || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenFacilitatorModal(facilitator)}
                            className="p-1 text-slate-400 hover:text-corporate-teal transition-colors"
                            title="Edit Facilitator"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFacilitator(facilitator.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Facilitator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <UserCog className="w-12 h-12 text-slate-300" />
                        <p>No facilitators defined yet.</p>
                        <button
                          onClick={() => handleOpenFacilitatorModal()}
                          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Facilitator
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'invites' && (
                filteredInvites.length > 0 ? (
                  filteredInvites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {invite.firstName || invite.lastName 
                                ? `${invite.firstName || ''} ${invite.lastName || ''}`.trim()
                                : 'No Name'}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{invite.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800">
                          {invite.role || 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {cohorts.find(c => c.id === invite.cohortId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invite.status === 'accepted' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800' 
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800'
                        }`}>
                          {invite.status === 'accepted' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {invite.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/register?token=${invite.token}`);
                              alert("Invite link copied to clipboard!");
                            }}
                            className="p-1 text-slate-400 hover:text-corporate-teal transition-colors"
                            title="Copy Invite Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Invite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No invitations found.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Templates Section */}
      {activeTab === 'templates' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Invitation Email Template</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Customize the email sent when inviting new users. Use variables like <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">{'{{firstName}}'}</code>, <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">{'{{lastName}}'}</code>, <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">{'{{email}}'}</code>.
                </p>
              </div>
              <button
                onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showTemplatePreview 
                    ? 'bg-corporate-teal text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                {showTemplatePreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={emailTemplate.subject}
                  onChange={e => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="You're invited to LeaderReps PD Platform"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Headline</label>
                <input
                  type="text"
                  value={emailTemplate.headline}
                  onChange={e => setEmailTemplate({...emailTemplate, headline: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="Welcome to LeaderReps!"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Body Text <span className="text-slate-400 text-xs">(Can be overridden per-invite with Custom Message)</span>
              </label>
              <textarea
                rows="3"
                value={emailTemplate.bodyText}
                onChange={e => setEmailTemplate({...emailTemplate, bodyText: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                placeholder="You have been invited to join the LeaderReps Professional Development Platform."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Button Text</label>
                <input
                  type="text"
                  value={emailTemplate.buttonText}
                  onChange={e => setEmailTemplate({...emailTemplate, buttonText: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="Accept Invitation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Expiry Text</label>
                <input
                  type="text"
                  value={emailTemplate.expiryText}
                  onChange={e => setEmailTemplate({...emailTemplate, expiryText: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="This invitation will expire in 7 days."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Footer Text</label>
              <input
                type="text"
                value={emailTemplate.footerText}
                onChange={e => setEmailTemplate({...emailTemplate, footerText: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                placeholder="If you did not expect this invitation, please ignore this email."
              />
            </div>
            
            {/* Preview */}
            {showTemplatePreview && (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Email Preview</h4>
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ color: '#0f172a', marginBottom: '16px' }}>{emailTemplate.headline || 'Welcome to LeaderReps!'}</h2>
                    <p style={{ color: '#475569', marginBottom: '16px' }}>{emailTemplate.bodyText || 'You have been invited...'}</p>
                    <p style={{ color: '#475569', marginBottom: '24px' }}>Click the button below to accept your invitation and set up your account:</p>
                    <div style={{ textAlign: 'center', margin: '24px 0' }}>
                      <span style={{ backgroundColor: '#0f766e', color: 'white', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>
                        {emailTemplate.buttonText || 'Accept Invitation'}
                      </span>
                    </div>
                    <p style={{ color: '#475569', marginTop: '24px' }}>{emailTemplate.expiryText || 'This invitation will expire in 7 days.'}</p>
                    <hr style={{ border: '1px solid #e2e8f0', margin: '24px 0' }} />
                    <p style={{ color: '#64748b', fontSize: '12px' }}>{emailTemplate.footerText || 'If you did not expect this invitation...'}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveEmailTemplate}
                disabled={savingTemplate}
                className="flex items-center gap-2 px-5 py-2.5 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 transition-colors"
              >
                {savingTemplate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Invite New User</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.firstName}
                    onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.lastName}
                    onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Cohort *</label>
                  <select
                    required
                    value={inviteForm.cohortId}
                    onChange={e => setInviteForm({...inviteForm, cohortId: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 ${!inviteForm.cohortId ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                  >
                    <option value="">-- Select Cohort --</option>
                    {cohorts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Custom Message</label>
                <textarea
                  rows="3"
                  value={inviteForm.customMessage}
                  onChange={e => setInviteForm({...inviteForm, customMessage: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                ></textarea>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="isTest"
                    checked={inviteForm.isTest || false}
                    onChange={e => setInviteForm({...inviteForm, isTest: e.target.checked})}
                    className="rounded border-slate-300 dark:border-slate-600 text-corporate-teal focus:ring-corporate-teal"
                  />
                  <label htmlFor="isTest" className="text-sm font-medium text-slate-700 dark:text-slate-200">Send as Test Invite</label>
                </div>
                
                {inviteForm.isTest && (
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Override Email <span className="text-red-500">*</span>
                      <span className="text-slate-400 ml-1">(Required for test invites)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteForm.testRecipient || ''}
                      onChange={e => setInviteForm({...inviteForm, testRecipient: e.target.value})}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-corporate-teal"
                      placeholder="Enter the real email to receive notifications"
                    />
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ The invitation email AND all future notifications for <strong>{inviteForm.email || 'this test user'}</strong> will be redirected to this address.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {sendingInvite ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Cohort Modal */}
      {isCohortModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{cohortForm.id ? 'Edit Cohort' : 'Create New Cohort'}</h3>
              <button 
                onClick={() => setIsCohortModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCohort} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Cohort Name *</label>
                <input
                  type="text"
                  required
                  value={cohortForm.name}
                  onChange={e => setCohortForm({...cohortForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="e.g., Spring 2025 Leaders"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <textarea
                  value={cohortForm.description}
                  onChange={e => setCohortForm({...cohortForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="Brief description of this cohort..."
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={cohortForm.startDate}
                  onChange={e => setCohortForm({...cohortForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Development Plan starts on this date. The time will be used for session scheduling.
                </p>
              </div>

              {/* Cohort Timezone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Cohort Timezone *
                </label>
                <select
                  required
                  value={cohortForm.timezone}
                  onChange={e => setCohortForm({...cohortForm, timezone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
                >
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All cohort members will see the same "Day 1", "Day 2", etc. based on this timezone.
                </p>
              </div>

              {/* Facilitator */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Facilitator</label>
                <select
                  value={cohortForm.facilitatorId}
                  onChange={e => handleFacilitatorSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 bg-white dark:bg-slate-800"
                >
                  <option value="">Select a facilitator...</option>
                  {facilitators.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.email || 'No email'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  The facilitator will be shown to cohort members as their point of contact.
                </p>
              </div>

              {/* Cohort Settings */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Cohort Settings</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Max Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={cohortForm.maxCapacity}
                      onChange={e => setCohortForm({...cohortForm, maxCapacity: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Late Join Cutoff (days)</label>
                    <input
                      type="number"
                      min="0"
                      max="14"
                      value={cohortForm.lateJoinCutoff}
                      onChange={e => setCohortForm({...cohortForm, lateJoinCutoff: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                      disabled={!cohortForm.allowLateJoins}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cohortForm.allowLateJoins}
                      onChange={e => setCohortForm({...cohortForm, allowLateJoins: e.target.checked})}
                      className="w-4 h-4 text-corporate-teal border-slate-300 dark:border-slate-600 rounded focus:ring-corporate-teal"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">Allow late joins</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                    {cohortForm.allowLateJoins 
                      ? `Users can join up to ${cohortForm.lateJoinCutoff} days after start date`
                      : 'No new members after start date'
                    }
                  </p>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCohortModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCohort}
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {savingCohort ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {cohortForm.id ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      {cohortForm.id ? 'Update Cohort' : 'Create Cohort'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Facilitator Modal */}
      {isFacilitatorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {facilitatorForm.id ? 'Edit Facilitator' : 'Add Facilitator'}
              </h3>
              <button 
                onClick={() => setIsFacilitatorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveFacilitator} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={facilitatorForm.displayName}
                    onChange={e => setFacilitatorForm({...facilitatorForm, displayName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                    placeholder="Ryan Yeoman"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={facilitatorForm.email}
                    onChange={e => setFacilitatorForm({...facilitatorForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                    placeholder="ryan@leaderreps.com"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title</label>
                  <input
                    type="text"
                    value={facilitatorForm.title}
                    onChange={e => setFacilitatorForm({...facilitatorForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                    placeholder="Founder & Lead Facilitator"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Bio</label>
                  <textarea
                    value={facilitatorForm.bio}
                    onChange={e => setFacilitatorForm({...facilitatorForm, bio: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 min-h-[80px]"
                    placeholder="Brief bio about the facilitator..."
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Photo URL</label>
                  <input
                    type="url"
                    value={facilitatorForm.photoUrl}
                    onChange={e => setFacilitatorForm({...facilitatorForm, photoUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 text-sm"
                    placeholder="https://..."
                  />
                  {facilitatorForm.photoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={facilitatorForm.photoUrl} 
                        alt="Preview"
                        className="w-12 h-12 rounded-full object-cover"
                        onError={e => e.target.style.display = 'none'}
                      />
                      <span className="text-xs text-slate-500">Photo preview</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={facilitatorForm.phone}
                    onChange={e => setFacilitatorForm({...facilitatorForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={facilitatorForm.linkedIn}
                    onChange={e => setFacilitatorForm({...facilitatorForm, linkedIn: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 text-sm"
                    placeholder="username or full URL"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFacilitatorModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFacilitator}
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {savingFacilitator ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {facilitatorForm.id ? 'Update Facilitator' : 'Add Facilitator'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={!!selectedUserForNotifications}
        onClose={() => setSelectedUserForNotifications(null)}
        userId={selectedUserForNotifications?.id}
        userName={selectedUserForNotifications?.displayName || selectedUserForNotifications?.email}
      />
    </div>
  );
};

export default UserManagement;
