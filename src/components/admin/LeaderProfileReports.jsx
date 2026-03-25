import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { 
  Loader, Download, Search, ChevronUp, ChevronDown, X,
  User, Building2, Briefcase, Calendar, Users, Target,
  MessageSquare, TrendingUp, Award, Heart, Zap, Clock,
  Phone, Mail, AlertTriangle, CheckCircle, Circle, 
  Battery, BatteryLow, Brain, Flame, Shield
} from 'lucide-react';

// ============================================
// SORT CONFIGURATION
// ============================================
const SORTABLE_COLUMNS = [
  { key: 'userName', label: 'Leader' },
  { key: 'companyName', label: 'Company' },
  { key: 'roleAlignment', label: 'Level' },
  { key: 'teamState', label: 'Team State' },
  { key: 'completeness', label: 'Profile %' },
  { key: 'updatedAt', label: 'Updated' },
];

// ============================================
// PROFILE COMPLETENESS CALCULATOR
// ============================================
const calculateCompleteness = (profile) => {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'department', 
    'companyName', 'jobTitle', 'roleAlignment', 
    'yearsLeading', 'teamState', 'catchPhrase',
    'whatWouldBreak', 'leadershipMuscle'
  ];
  const optionalFields = [
    'companySize', 'industry', 'directReports',
    'underPressure', 'energyDrain', 'biggestChallenge',
    'primaryGoal', 'feedbackReceptionScore', 'feedbackGivingScore',
    'phoneNumber', 'leadershipStyleDescription'
  ];
  
  let completed = 0;
  let total = requiredFields.length + optionalFields.length;
  
  requiredFields.forEach(f => {
    const val = profile[f];
    if (val && (Array.isArray(val) ? val.length > 0 : val !== '')) completed++;
  });
  optionalFields.forEach(f => {
    const val = profile[f];
    if (val && (Array.isArray(val) ? val.length > 0 : val !== '')) completed++;
  });
  
  return Math.round((completed / total) * 100);
};

// ============================================
// TEAM STATE BADGE
// ============================================
const TeamStateBadge = ({ state }) => {
  const config = {
    stabilizing: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30', icon: Shield },
    maintaining: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30', icon: CheckCircle },
    scaling: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30', icon: TrendingUp },
    transforming: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30', icon: Zap },
  };
  const cfg = config[state] || { color: 'bg-slate-100 text-slate-600', icon: Circle };
  const Icon = cfg.icon;
  
  return state ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {state.charAt(0).toUpperCase() + state.slice(1)}
    </span>
  ) : <span className="text-slate-400">—</span>;
};

// ============================================
// ROLE ALIGNMENT BADGE
// ============================================
const RoleAlignmentBadge = ({ role }) => {
  const shortLabels = {
    'Individual contributor with people responsibilities': 'IC+',
    'Frontline manager': 'Frontline',
    'Manager of managers': 'MoM',
    'Senior leader / executive': 'Executive',
  };
  const colors = {
    'Individual contributor with people responsibilities': 'bg-slate-100 text-slate-700',
    'Frontline manager': 'bg-blue-100 text-blue-700',
    'Manager of managers': 'bg-indigo-100 text-indigo-700',
    'Senior leader / executive': 'bg-purple-100 text-purple-700',
  };
  
  return role ? (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[role] || 'bg-slate-100 text-slate-600'}`}>
      {shortLabels[role] || role}
    </span>
  ) : <span className="text-slate-400">—</span>;
};

// ============================================
// LEADER PROFILE DETAIL MODAL (Comprehensive)
// ============================================
const LeaderProfileModal = ({ profile, onClose }) => {
  if (!profile) return null;

  const completeness = calculateCompleteness(profile);
  
  const Section = ({ icon: Icon, title, children, color = 'slate', defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-${color}-50 dark:bg-${color}-900/20 border-b border-slate-200 dark:border-slate-700 hover:bg-${color}-100 dark:hover:bg-${color}-900/30 transition-colors`}
        >
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 text-${color}-600`} />
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title}</h4>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {isOpen && <div className="p-4">{children}</div>}
      </div>
    );
  };

  const InfoRow = ({ label, value, fullWidth = false }) => (
    <div className={`flex ${fullWidth ? 'flex-col gap-1' : 'justify-between'} py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0`}>
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-medium text-slate-700 dark:text-slate-200 ${fullWidth ? 'bg-slate-50 dark:bg-slate-700/50 p-2 rounded' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );

  const TagList = ({ items, color = 'slate' }) => {
    if (!items || items.length === 0) return <span className="text-sm text-slate-400 italic">None selected</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={`px-2 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 rounded-lg text-xs font-medium`}>
            {item}
          </span>
        ))}
      </div>
    );
  };

  const ScoreBar = ({ label, score, maxScore = 5, color = 'corporate-teal' }) => {
    const percentage = score ? (score / maxScore) * 100 : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{label}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{score || '—'}/{maxScore}</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full bg-${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-corporate-navy to-corporate-navy/90">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {profile.firstName && profile.lastName 
                  ? `${profile.firstName} ${profile.lastName}` 
                  : profile.userName}
              </h2>
              <p className="text-sm text-white/70">{profile.userEmail}</p>
              <div className="flex items-center gap-3 mt-1">
                <RoleAlignmentBadge role={profile.roleAlignment} />
                <TeamStateBadge state={profile.teamState} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Completeness indicator */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-corporate-teal rounded-full" style={{ width: `${completeness}%` }} />
              </div>
              <span className="text-xs text-white/80">{completeness}%</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Contact Info */}
          <Section icon={Mail} title="Contact Information" color="slate" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow label="Email" value={profile.email || profile.userEmail} />
              <InfoRow label="Phone" value={profile.phoneNumber || '—'} />
              <InfoRow label="Prefers SMS" value={profile.preferSMS ? 'Yes' : 'No'} />
              <InfoRow label="Timezone" value={profile.timezone} />
            </div>
          </Section>

          {/* Professional Info */}
          <Section icon={Briefcase} title="Professional Background" color="blue">
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow label="Company" value={profile.companyName} />
              <InfoRow label="Company Size" value={profile.companySize} />
              <InfoRow label="Industry" value={profile.industry} />
              <InfoRow label="Department" value={profile.department} />
              <InfoRow label="Job Title" value={profile.jobTitle} />
              <InfoRow label="Years in Role" value={profile.yearsInRole} />
              <InfoRow label="Direct Reports" value={profile.directReports} />
              <InfoRow label="Role Responsibility" value={profile.roleResponsibility} />
            </div>
          </Section>

          {/* Leadership Context */}
          <Section icon={Users} title="Leadership Context" color="indigo">
            <div className="grid grid-cols-2 gap-x-6 mb-4">
              <InfoRow label="Role Level" value={profile.roleAlignment} />
              <InfoRow label="Years Leading" value={profile.yearsLeading} />
              <InfoRow label="Team State" value={profile.teamState} />
              <InfoRow label="Years Managing" value={profile.yearsManaging ? `${profile.yearsManaging} years` : '—'} />
            </div>
            
            {profile.catchPhrase && (
              <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  Leadership Catch Phrase
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 font-medium italic">
                  "{profile.catchPhrase}"
                </p>
              </div>
            )}
            
            {profile.whatWouldBreak && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  What Would Break If You Left
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                  {profile.whatWouldBreak}
                </p>
              </div>
            )}
          </Section>

          {/* Self-Awareness Section */}
          <Section icon={Brain} title="Self-Awareness Insights" color="purple">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Behaviors Under Pressure
                </span>
                <div className="mt-2">
                  <TagList items={profile.underPressure} color="red" />
                </div>
              </div>
              
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <BatteryLow className="w-3 h-3" /> Energy Drains
                </span>
                <div className="mt-2">
                  <TagList items={profile.energyDrain} color="amber" />
                </div>
              </div>
              
              {profile.leadershipMuscle && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Leadership Muscle to Strengthen
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 font-medium">
                    {profile.leadershipMuscle}
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Leadership Style */}
          {(profile.leadershipStyleDescription || profile.leadershipStyle) && (
            <Section icon={Award} title="Leadership Style" color="purple" defaultOpen={false}>
              {profile.leadershipStyleDescription && (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {profile.leadershipStyleDescription}
                </p>
              )}
              {profile.leadershipStyle && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {profile.leadershipStyle}
                  </span>
                </div>
              )}
            </Section>
          )}

          {/* Feedback Scores */}
          <Section icon={MessageSquare} title="Feedback Assessment" color="green" defaultOpen={false}>
            <div className="space-y-4">
              <ScoreBar label="Comfort Receiving Feedback" score={profile.feedbackReceptionScore} color="blue-500" />
              <ScoreBar label="Comfort Giving Feedback" score={profile.feedbackGivingScore} color="green-500" />
              {profile.feedbackPreference && (
                <InfoRow label="Feedback Preference" value={profile.feedbackPreference} />
              )}
            </div>
          </Section>

          {/* Goals & Development */}
          <Section icon={Target} title="Development Goals" color="orange">
            {profile.biggestChallenge && (
              <div className="mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Biggest Leadership Challenge
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                  {profile.biggestChallenge}
                </p>
              </div>
            )}
            {profile.primaryGoal && (
              <div className="mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Primary Goal for Program
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                  {profile.primaryGoal}
                </p>
              </div>
            )}
            {profile.successDefinition && (
              <div className="mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Definition of Success
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                  {profile.successDefinition}
                </p>
              </div>
            )}
            {profile.currentHabit && (
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Current Habit Focus
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                  {profile.currentHabit}
                </p>
              </div>
            )}
            {!profile.biggestChallenge && !profile.primaryGoal && !profile.successDefinition && !profile.currentHabit && (
              <p className="text-sm text-slate-500 italic">No development goals captured yet.</p>
            )}
          </Section>

          {/* Preferences */}
          <Section icon={Clock} title="Preferences" color="slate" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow label="Preferred Learning Time" value={profile.preferredLearningTime} />
              <InfoRow label="Feedback Preference" value={profile.feedbackPreference} />
            </div>
          </Section>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>User ID: {profile.userId?.slice(0, 12)}...</span>
            <div className="flex items-center gap-4">
              <span>Created: {profile.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
              <span>Updated: {profile.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SORTABLE TABLE HEADER
// ============================================
const SortableHeader = ({ column, currentSort, onSort }) => {
  const isActive = currentSort.key === column.key;
  const isAsc = currentSort.direction === 'asc';

  return (
    <button
      onClick={() => onSort(column.key)}
      className="flex items-center gap-1 hover:text-corporate-teal transition-colors group"
    >
      <span>{column.label}</span>
      <div className="flex flex-col">
        <ChevronUp 
          className={`w-3 h-3 -mb-1 ${isActive && isAsc ? 'text-corporate-teal' : 'text-slate-300 group-hover:text-slate-400'}`} 
        />
        <ChevronDown 
          className={`w-3 h-3 ${isActive && !isAsc ? 'text-corporate-teal' : 'text-slate-300 group-hover:text-slate-400'}`} 
        />
      </div>
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const LeaderProfileReports = () => {
  const { db } = useAppServices();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'userName', direction: 'asc' });

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // 1. Fetch all users
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Fetch profiles for each user
        const profilePromises = users.map(async (user) => {
          const profileRef = doc(db, `user_data/${user.id}/leader_profile/current`);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            return {
              userId: user.id,
              userName: user.displayName || user.name || 'Unknown',
              userEmail: user.email,
              ...profileSnap.data()
            };
          }
          return null;
        });

        const results = await Promise.all(profilePromises);
        setProfiles(results.filter(p => p !== null));
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [db]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort profiles
  const processedProfiles = useMemo(() => {
    let result = profiles
      .map(p => ({ ...p, completeness: calculateCompleteness(p) }))
      .filter(p => 
        p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.roleAlignment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.teamState?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === 'updatedAt') {
        aVal = aVal?.toDate?.() || new Date(0);
        bVal = bVal?.toDate?.() || new Date(0);
        return sortConfig.direction === 'asc' 
          ? aVal - bVal 
          : bVal - aVal;
      }
      
      // Handle completeness
      if (sortConfig.key === 'completeness') {
        return sortConfig.direction === 'asc' 
          ? (a.completeness || 0) - (b.completeness || 0)
          : (b.completeness || 0) - (a.completeness || 0);
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });

    return result;
  }, [profiles, searchTerm, sortConfig]);

  const exportCSV = () => {
    const headers = [
      'Name', 'Email', 'Company', 'Company Size', 'Industry', 'Department', 'Job Title',
      'Role Level', 'Years Leading', 'Years Managing', 'Direct Reports', 'Team State',
      'Catch Phrase', 'What Would Break', 'Leadership Muscle',
      'Under Pressure Behaviors', 'Energy Drains',
      'Biggest Challenge', 'Primary Goal', 'Success Definition', 'Current Habit',
      'Leadership Style', 'Leadership Style Description',
      'Feedback Reception Score', 'Feedback Giving Score', 'Feedback Preference',
      'Phone', 'Preferred Learning Time', 'Timezone',
      'Profile Completeness %', 'Last Updated'
    ];
    
    const csvContent = [
      headers.join(','),
      ...processedProfiles.map(p => [
        `"${p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.userName}"`,
        `"${p.userEmail}"`,
        `"${p.companyName || ''}"`,
        `"${p.companySize || ''}"`,
        `"${p.industry || ''}"`,
        `"${p.department || ''}"`,
        `"${p.jobTitle || ''}"`,
        `"${p.roleAlignment || ''}"`,
        `"${p.yearsLeading || ''}"`,
        `"${p.yearsManaging || ''}"`,
        `"${p.directReports || ''}"`,
        `"${p.teamState || ''}"`,
        `"${(p.catchPhrase || '').replace(/"/g, '""')}"`,
        `"${(p.whatWouldBreak || '').replace(/"/g, '""')}"`,
        `"${(p.leadershipMuscle || '').replace(/"/g, '""')}"`,
        `"${(p.underPressure || []).join('; ')}"`,
        `"${(p.energyDrain || []).join('; ')}"`,
        `"${(p.biggestChallenge || '').replace(/"/g, '""')}"`,
        `"${(p.primaryGoal || '').replace(/"/g, '""')}"`,
        `"${(p.successDefinition || '').replace(/"/g, '""')}"`,
        `"${(p.currentHabit || '').replace(/"/g, '""')}"`,
        `"${p.leadershipStyle || ''}"`,
        `"${(p.leadershipStyleDescription || '').replace(/"/g, '""')}"`,
        p.feedbackReceptionScore || '',
        p.feedbackGivingScore || '',
        `"${p.feedbackPreference || ''}"`,
        `"${p.phoneNumber || ''}"`,
        `"${p.preferredLearningTime || ''}"`,
        `"${p.timezone || ''}"`,
        p.completeness || 0,
        p.updatedAt?.toDate?.()?.toISOString() || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leader_profiles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">Leader Profiles</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {processedProfiles.length} leader{processedProfiles.length !== 1 ? 's' : ''} • Click a row to view full profile
          </p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search leaders by name, email, or company..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 bg-white dark:bg-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                {SORTABLE_COLUMNS.map(column => (
                  <th key={column.key} className="px-4 py-3">
                    <SortableHeader 
                      column={column} 
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {processedProfiles.map(profile => (
                <tr 
                  key={profile.userId} 
                  onClick={() => setSelectedProfile(profile)}
                  className="hover:bg-corporate-teal/5 cursor-pointer transition-colors"
                >
                  {/* Leader Name & Email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-corporate-navy/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-corporate-navy" />
                      </div>
                      <div>
                        <div className="font-medium text-corporate-navy dark:text-white hover:text-corporate-teal transition-colors">
                          {profile.firstName && profile.lastName 
                            ? `${profile.firstName} ${profile.lastName}` 
                            : profile.userName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{profile.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  {/* Company */}
                  <td className="px-4 py-3">
                    <div>{profile.companyName || '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{profile.industry || profile.companySize}</div>
                  </td>
                  {/* Role Level */}
                  <td className="px-4 py-3">
                    <RoleAlignmentBadge role={profile.roleAlignment} />
                    {profile.yearsLeading && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{profile.yearsLeading}</div>
                    )}
                  </td>
                  {/* Team State */}
                  <td className="px-4 py-3">
                    <TeamStateBadge state={profile.teamState} />
                    {profile.directReports && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{profile.directReports} reports</div>
                    )}
                  </td>
                  {/* Profile Completeness */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            profile.completeness >= 80 ? 'bg-green-500' :
                            profile.completeness >= 50 ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${profile.completeness}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        profile.completeness >= 80 ? 'text-green-600' :
                        profile.completeness >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {profile.completeness}%
                      </span>
                    </div>
                  </td>
                  {/* Updated */}
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {profile.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                </tr>
              ))}
              {processedProfiles.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No leader profiles found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <LeaderProfileModal 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)} 
        />
      )}
    </div>
  );
};

export default LeaderProfileReports;
