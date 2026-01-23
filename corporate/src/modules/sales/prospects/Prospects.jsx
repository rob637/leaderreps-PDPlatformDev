import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Building2, User, Mail, Phone, Linkedin, Edit2, Trash2, UserPlus, Sparkles, Globe, MapPin, Users, Target, X, ChevronDown, ExternalLink, HelpCircle, Download, FileText, TrendingUp, BookOpen, Send, Lock, Unlock, LayoutGrid, List, GripVertical, DollarSign, Play, Calendar, Clock, AlertTriangle, CheckCircle, Eye, ChevronRight } from 'lucide-react';
import { collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import app, { db } from '../../../firebase';

const Prospects = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProspect, setEditingProspect] = useState(null);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' or 'search'
  const [searchMode, setSearchMode] = useState('people'); // 'people' or 'companies'
  
  // Search criteria state - Enhanced to match Apollo's full capabilities
  const [searchCriteria, setSearchCriteria] = useState({
    titles: '',
    companies: '',
    industries: '',
    locations: '',
    companySize: '',
    keywords: '',
    // NEW: Advanced filters
    seniorities: [], // C-Suite, VP, Director, Manager, etc.
    departments: [], // Sales, Marketing, HR, Engineering, etc.
    revenueMin: '',
    revenueMax: '',
    fundingStages: [], // Seed, Series A, B, C, etc.
    technologies: '', // Tech stack used by company
    emailStatus: 'any', // 'any', 'verified', 'likely'
    excludeTitles: '', // Exclude certain titles
    yearsInPosition: '', // Min years in current role
    companyHeadquarters: '', // HQ location only
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [profile, setProfile] = useState({}); // Stores user profile for credit usage tracking
  const [searching, setSearching] = useState(false);
  const [apolloKey, setApolloKey] = useState('');
  const [apolloCreditsUsed, setApolloCreditsUsed] = useState(0);
  const [apolloCreditsLimit, setApolloCreditsLimit] = useState(200); // Free tier default
  const [apolloSettingsLoaded, setApolloSettingsLoaded] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban' for the Saved tab
  const [draggedProspect, setDraggedProspect] = useState(null);  // For Kanban drag-and-drop

  // Sequence Launcher Modal State
  const [showSequenceLauncher, setShowSequenceLauncher] = useState(false);
  const [sequenceProspect, setSequenceProspect] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sequenceStartDate, setSequenceStartDate] = useState('');
  const [previewStep, setPreviewStep] = useState(0);
  const [launchConfirmed, setLaunchConfirmed] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [selectedSender, setSelectedSender] = useState(''); // Who replies go to

  // Team members who can be assigned as senders (replies go to their inbox)
  const TEAM_SENDERS = [
    { email: 'ryan@leaderreps.com', name: 'Ryan' },
    { email: 'jeff@leaderreps.com', name: 'Jeff' },
    { email: 'cristina@leaderreps.com', name: 'Cristina' },
    { email: 'rob@leaderreps.com', name: 'Rob' },
  ];

  // Available Campaigns/Sequences
  const CAMPAIGNS = {
    'c1': {
      id: 'c1',
      name: 'The "Trojan Horse" Workshop',
      description: 'Invite HR/Sales leaders to a free "Leader Circle" session to demonstrate value before selling.',
      color: 'teal',
      steps: [
        { 
          day: 0, 
          type: 'email', 
          name: 'Private Invite: Leader Circle',
          subject: "Invitation: Private Leader Circle for [Company]",
          template: "Hi [First Name],\n\nI'm hosting a private 'Leader Circle' session on [Date] focusing on [Topic]. \n\nWe're curating a small group of 5-6 leaders from similar sized companies to share what's actually working in 2024. No pitch, just peer learning.\n\nI'd love to have your perspective from [Company] in the room.\n\nOpen to it?",
          psychology: "The 'No Ask' Invitation - frames this as peer-learning rather than sales."
        },
        { 
          day: 3, 
          type: 'linkedin', 
          name: 'Connect + Mention Invite',
          template: "Hi [First Name], sent you an invite to the Leader Circle earlier. Would love to connect here regardless.",
          psychology: "Omnichannel nudge increases familiarity."
        },
        { 
          day: 7, 
          type: 'email', 
          name: 'Send "Culture Audit" PDF',
          subject: "Thought you might like this (Culture Audit)",
          template: "Hi [First Name],\n\nSince you're busy, I thought I'd send over the 'Culture Audit' framework we'll be discussing.\n\nIt takes about 3 minutes to run through and usually highlights the #1 gap in retention strategies.\n\n[Link]\n\nHope it's helpful.",
          psychology: "Law of Reciprocity - giving value creates psychological debt."
        },
        { 
          day: 12, 
          type: 'call', 
          name: 'Brief 5-min intro call',
          script: "Hi [First Name], just calling to see if that Culture Audit was useful. No worries if not, just wanted to close the loop.",
          psychology: "'Close the Loop' Call - follow-up on value, not cold outreach."
        }
      ]
    },
    'c2': {
      id: 'c2',
      name: 'Founder-to-Founder',
      description: 'Direct high-level outreach from Rob to other CEOs/Founders. Personal and authentic.',
      color: 'indigo',
      steps: [
        { day: 0, type: 'linkedin', name: 'Founder Connection Request', template: "Hi [First Name], fellow founder here. Love what you're building at [Company]. Would love to connect.", psychology: "Peer-to-peer credibility." },
        { day: 2, type: 'email', name: 'Quick Question Email', subject: "Quick question, [First Name]", template: "Hi [First Name],\n\nI know you're slammed, so I'll keep this brief.\n\nHow are you handling leadership development for your team at [Company]? It's something we've been solving at LeaderReps and I'd love to get your take.\n\n30 seconds of your thoughts would be invaluable.", psychology: "Brevity + genuine curiosity." },
        { day: 5, type: 'video', name: '30s Personal Loom Video', template: "Record a 30-second Loom: 'Hey [First Name], Rob from LeaderReps. Wanted to put a face to the name...'", psychology: "Video creates personal connection and stands out." }
      ]
    },
    'c3': {
      id: 'c3',
      name: 'Strategic Partnership',
      description: 'Initiate high-level partnership discussions with complementary businesses.',
      color: 'amber',
      steps: [
        {
          day: 0,
          type: 'email',
          name: 'Partnership Inquiry',
          subject: "Partnership idea: LeaderReps + [Company]",
          template: "Hi [First Name],\n\nI've been following [Company] and love what you're doing in [Industry].\n\nI think there's a strong alignment between our audiences. I have an idea for a collaboration that could drive significant value for both sides without much lift.\n\nOpen to a 10-min chat to explore?",
          psychology: "'Better Together' Framing - focuses on mutual value and low effort."
        },
        {
          day: 4,
          type: 'linkedin',
          name: 'LinkedIn Connect',
          template: "Hi [First Name], sent a note about a potential partnership. Let's connect.",
          psychology: "Professional multi-channel follow-up."
        },
        {
          day: 8,
          type: 'email',
          name: 'Value Proposition Follow-up',
          subject: "Re: Partnership idea",
          template: "Hi [First Name],\n\nWanted to circle back on my partnership note. I've put together a quick one-pager on what this could look like.\n\n[Link to Doc]\n\nNo pressure - just wanted to give you something concrete to react to.",
          psychology: "Providing concrete value reduces mental effort to respond."
        }
      ]
    },
    'c4': {
      id: 'c4',
      name: 'Direct Sales Outreach',
      description: 'Traditional sales sequence for qualified prospects. More direct approach.',
      color: 'red',
      steps: [
        { day: 0, type: 'email', name: 'Introduction Email', subject: "Helping [Company] develop leaders", template: "Hi [First Name],\n\nI work with companies like [Company] to build stronger leadership pipelines.\n\nGiven your role as [Title], I thought you might be interested in how we're helping similar organizations reduce manager turnover by 30%.\n\nWorth a quick call?", psychology: "Direct value proposition with social proof." },
        { day: 3, type: 'call', name: 'Discovery Call Attempt', script: "Hi [First Name], this is Rob from LeaderReps. I sent you an email about leadership development - do you have 2 minutes?", psychology: "Phone creates urgency and personal connection." },
        { day: 5, type: 'email', name: 'Case Study Follow-up', subject: "How [Similar Company] reduced turnover 30%", template: "Hi [First Name],\n\nQuick follow-up with a case study that might resonate.\n\n[Link]\n\nHappy to walk you through how they did it if helpful.", psychology: "Social proof with similar companies." },
        { day: 10, type: 'email', name: 'Breakup Email', subject: "Should I close your file?", template: "Hi [First Name],\n\nI've reached out a few times and haven't heard back. Totally understand if the timing isn't right.\n\nI'll assume this isn't a priority and close your file for now. If things change, I'm here.\n\nBest,\nRob", psychology: "'Breakup' email often triggers response due to loss aversion." }
      ]
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    linkedin: '',
    status: 'new',
    notes: '',
  });

  const PRESETS = [
    { label: "Tech Executives", titles: "CTO, VP Engineering, CIO", industries: "Technology, Software", seniorities: ['vp', 'c_suite'] },
    { label: "Sales Leaders", titles: "VP Sales, CRO, Director of Sales", industries: "SaaS, Technology", departments: ['sales'] },
    { label: "HR Decision Makers", titles: "CHRO, VP People, HR Director", companySize: "51-200", departments: ['human_resources'] },
    { label: "Small Biz Owners", titles: "Owner, Founder, CEO", companySize: "1-10", seniorities: ['owner', 'founder'] },
    { label: "Marketing Leaders", titles: "CMO, VP Marketing, Head of Marketing", industries: "Technology, SaaS", departments: ['marketing'] },
    { label: "Funded Startups", titles: "CEO, Founder, COO", fundingStages: ['seed', 'series_a', 'series_b'], companySize: "11-50" },
  ];

  // Seniority levels (Apollo API values)
  const SENIORITY_OPTIONS = [
    { value: 'owner', label: 'Owner' },
    { value: 'founder', label: 'Founder' },
    { value: 'c_suite', label: 'C-Suite' },
    { value: 'partner', label: 'Partner' },
    { value: 'vp', label: 'VP' },
    { value: 'head', label: 'Head' },
    { value: 'director', label: 'Director' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior', label: 'Senior IC' },
    { value: 'entry', label: 'Entry Level' },
  ];

  // Department/Function filters (Apollo API values)
  const DEPARTMENT_OPTIONS = [
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'product_management', label: 'Product' },
    { value: 'human_resources', label: 'HR / People' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
    { value: 'it', label: 'IT' },
    { value: 'legal', label: 'Legal' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'education', label: 'Education/Training' },
    { value: 'customer_service', label: 'Customer Success' },
  ];

  // Funding stage filters
  const FUNDING_OPTIONS = [
    { value: 'seed', label: 'Seed' },
    { value: 'series_a', label: 'Series A' },
    { value: 'series_b', label: 'Series B' },
    { value: 'series_c', label: 'Series C' },
    { value: 'series_d', label: 'Series D+' },
    { value: 'private_equity', label: 'Private Equity' },
    { value: 'other', label: 'Other' },
  ];

  // Revenue ranges
  const REVENUE_OPTIONS = [
    { value: '', label: 'Any' },
    { value: '0', label: '$0' },
    { value: '1000000', label: '$1M' },
    { value: '10000000', label: '$10M' },
    { value: '50000000', label: '$50M' },
    { value: '100000000', label: '$100M' },
    { value: '500000000', label: '$500M' },
    { value: '1000000000', label: '$1B+' },
  ];

  // Industry categories (common ones)
  const INDUSTRY_OPTIONS = [
    'Technology', 'Software', 'SaaS', 'Healthcare', 'Finance', 'Manufacturing',
    'Retail', 'Education', 'Professional Services', 'Real Estate', 'Media',
    'Telecommunications', 'Transportation', 'Energy', 'Agriculture', 'Hospitality'
  ];

  const applyPreset = (preset) => {
    setSearchCriteria({
      ...searchCriteria,
      titles: preset.titles || '',
      companies: '',
      industries: preset.industries || '',
      locations: '',
      companySize: preset.companySize || '',
      keywords: '',
      seniorities: preset.seniorities || [],
      departments: preset.departments || [],
      fundingStages: preset.fundingStages || [],
    });
  };

  // Load prospects from Firestore
  useEffect(() => {
    loadProspects();
  }, []);

  // Load Apollo settings from Firestore (per-user)
  useEffect(() => {
    const loadApolloSettings = async () => {
      if (!currentUser) {
        setApolloSettingsLoaded(true);
        return;
      }
      try {
        const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'apollo');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setApolloKey(data.apiKey || '');
          setApolloCreditsUsed(data.creditsUsed || 0);
          setApolloCreditsLimit(data.creditsLimit || 200);
          // Reset credits monthly
          const lastReset = data.lastCreditReset ? new Date(data.lastCreditReset) : null;
          const now = new Date();
          if (!lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
            // New month - reset credits
            await setDoc(settingsRef, {
              ...data,
              creditsUsed: 0,
              lastCreditReset: now.toISOString()
            }, { merge: true });
            setApolloCreditsUsed(0);
          }
        }
      } catch (error) {
        console.error('Error loading Apollo settings:', error);
      } finally {
        setApolloSettingsLoaded(true);
      }
    };
    loadApolloSettings();
  }, [currentUser]);

  const loadProspects = async () => {
    try {
      const q = query(collection(db, 'corporate_prospects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      // Filter out partners and vendors client-side for backward compatibility
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => !['partner', 'vendor'].includes(p.category));
      setProspects(data);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      if (editingProspect) {
        // Ownership Check
        if (editingProspect.ownerId && editingProspect.ownerId !== user?.uid) {
            alert(`Access Denied: This prospect records belongs to ${editingProspect.ownerName}. You cannot edit it.`);
            return;
        }

        // Update existing
        await updateDoc(doc(db, 'corporate_prospects', editingProspect.id), {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Duplicate Check
        if (formData.email) {
            const dupQ = query(collection(db, 'corporate_prospects'), where('email', '==', formData.email));
            const dupSnap = await getDocs(dupQ);
            if (!dupSnap.empty) {
                const existing = dupSnap.docs[0].data();
                alert(`Duplicate: This prospect exists and is owned by ${existing.ownerName || 'another rep'}. Please coordinate with them.`);
                return;
            }
        }

        // Add new
        await addDoc(collection(db, 'corporate_prospects'), {
          ...formData,
          ownerId: user?.uid,
          ownerName: user?.displayName || user?.email || 'Rep',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      resetForm();
      loadProspects();
    } catch (error) {
      console.error('Error saving prospect:', error);
      alert('Failed to save prospect');
    }
  };

  const handleDelete = async (id) => {
    const prospect = prospects.find(p => p.id === id);
    const auth = getAuth();
    if (prospect?.ownerId && prospect.ownerId !== auth.currentUser?.uid) {
        alert("You cannot delete a prospect owned by another rep.");
        return;
    }

    if (!confirm('Delete this prospect?')) return;
    try {
      await deleteDoc(doc(db, 'corporate_prospects', id));
      loadProspects();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleEdit = (prospect) => {
    setFormData({
      name: prospect.name || '',
      company: prospect.company || '',
      title: prospect.title || '',
      email: prospect.email || '',
      phone: prospect.phone || '',
      linkedin: prospect.linkedin || '',
      status: prospect.status || 'new',
      notes: prospect.notes || '',
    });
    setEditingProspect(prospect);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      title: '',
      email: '',
      phone: '',
      linkedin: '',
      status: 'new',
      notes: '',
    });
    setEditingProspect(null);
    setShowAddModal(false);
  };

  // Apollo.io search function
  const searchApollo = async (overrideParams = null, overrideMode = null) => {
    if (!apolloKey) {
      setShowApiSetup(true);
      return;
    }
    
    // Check if searching for companies or people
    const currentMode = overrideMode || searchMode;
    
    setSearching(true);
    setSearchResults([]); // Clear previous results

    try {
      // Build the query for Apollo
      const body = {
        api_key: apolloKey,
        page: 1,
        per_page: 25,
      };

      if (overrideParams) {
        // Use provided params (e.g. for "Find Decision Makers" drill-down)
        Object.assign(body, overrideParams);
      } else {
        // Build from state - Enhanced with all Apollo filters
        if (currentMode === 'people') {
             // Basic filters
             if (searchCriteria.titles) body.person_titles = searchCriteria.titles.split(',').map(t => t.trim());
             if (searchCriteria.locations) body.person_locations = searchCriteria.locations.split(',').map(l => l.trim());
             if (searchCriteria.industries) body.organization_industry_tag_ids = searchCriteria.industries.split(',').map(i => i.trim());
             if (searchCriteria.companies) body.organization_names = searchCriteria.companies.split(',').map(c => c.trim());
             if (searchCriteria.keywords) body.q_keywords = searchCriteria.keywords;
             
             // NEW: Seniority filter (Apollo's person_seniorities)
             if (searchCriteria.seniorities?.length > 0) {
               body.person_seniorities = searchCriteria.seniorities;
             }
             
             // NEW: Department/Function filter (Apollo's person_departments)  
             if (searchCriteria.departments?.length > 0) {
               body.person_departments = searchCriteria.departments;
             }
             
             // NEW: Email status filter
             if (searchCriteria.emailStatus === 'verified') {
               body.contact_email_status = ['verified'];
             } else if (searchCriteria.emailStatus === 'likely') {
               body.contact_email_status = ['verified', 'likely_to_engage'];
             }
             
             // NEW: Exclude titles
             if (searchCriteria.excludeTitles) {
               body.person_not_titles = searchCriteria.excludeTitles.split(',').map(t => t.trim());
             }
             
             // NEW: Company headquarters location
             if (searchCriteria.companyHeadquarters) {
               body.organization_hq_location_ids = searchCriteria.companyHeadquarters.split(',').map(l => l.trim());
             }
             
        } else {
             // Company Search
             if (searchCriteria.companies) body.q_organization_name = searchCriteria.companies;
             if (searchCriteria.locations) body.organization_locations = searchCriteria.locations.split(',').map(l => l.trim());
             if (searchCriteria.industries) body.organization_industry_tag_ids = searchCriteria.industries.split(',').map(i => i.trim());
             if (searchCriteria.keywords) body.q_organization_keyword_tags = searchCriteria.keywords.split(',').map(k => k.trim());
             
             // NEW: Technologies filter for companies
             if (searchCriteria.technologies) {
               body.organization_technologies = searchCriteria.technologies.split(',').map(t => t.trim());
             }
        }

        // Company size filter (both modes)
        if (searchCriteria.companySize) {
          const sizeMap = {
            '1-10': ['1', '10'],
            '11-50': ['11', '50'],
            '51-200': ['51', '200'],
            '201-500': ['201', '500'],
            '501-1000': ['501', '1000'],
            '1000+': ['1001', '10000'],
          };
          if (sizeMap[searchCriteria.companySize]) {
            body.organization_num_employees_ranges = [sizeMap[searchCriteria.companySize].join(',')];
          }
        }
        
        // NEW: Revenue range filter
        if (searchCriteria.revenueMin || searchCriteria.revenueMax) {
          const revMin = searchCriteria.revenueMin ? parseInt(searchCriteria.revenueMin) : 0;
          const revMax = searchCriteria.revenueMax ? parseInt(searchCriteria.revenueMax) : 1000000000000;
          body.organization_estimated_revenue_range = { min: revMin, max: revMax };
        }
        
        // NEW: Funding stage filter
        if (searchCriteria.fundingStages?.length > 0) {
          body.organization_latest_funding_stage_cd = searchCriteria.fundingStages;
        }
      }

      const functions = getFunctions(app, 'us-central1');
      const apolloSearch = httpsCallable(functions, 'apolloSearchProxy');
      
      const { api_key, ...searchParams } = body;
      console.log(`Searching Apollo (${currentMode}) with params:`, searchParams);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 20000)
      );
      
      const result = await Promise.race([
        apolloSearch({ apiKey: apolloKey, searchParams, mode: currentMode === 'companies' ? 'organizations' : 'people' }),
        timeoutPromise
      ]);
      
      const data = result.data;
      console.log('Apollo search data:', data);

      if (currentMode === 'companies') {
          if (data.organizations) {
             setSearchResults(data.organizations.map(org => ({
                 id: org.id,
                 type: 'company',
                 name: org.name,
                 industry: org.industry,
                 location: org.city ? `${org.city}, ${org.state}` : org.country,
                 companySize: org.estimated_num_employees,
                 website: org.website_url,
                 description: org.short_description,
                 logo: org.logo_url,
                 linkedin: org.linkedin_url,
                 twitter: org.twitter_url,
                 original: org
             })));
          } else {
              alert('No organizations found or API format changed.');
          }
      } else {
         // PEOPLE PROCESSING
         if (data.people) {
            setSearchResults(data.people.map(person => ({
            id: person.id,
            type: 'person',
            name: person.name || (person.first_name ? `${person.first_name} ${person.last_name || person.last_name_obfuscated || ''}` : 'Unknown Name'),
            title: person.title || person.headline || 'No Title',
            company: person.organization?.name || person.organization_name || 'No Company',
            companyId: person.organization?.id || person.organization_id, // Important for drill down
            email: person.email || (person.has_email ? 'Email Available (Locked)' : null),
            phone: person.phone_numbers?.[0]?.sanitized_number || (person.has_direct_phone ? 'Phone Available (Locked)' : null),
            linkedin: person.linkedin_url,
            location: person.city ? `${person.city}, ${person.state}` : (person.country || (person.organization?.has_city ? 'Location Available' : 'No Location')),
            companySize: person.organization?.estimated_num_employees || (person.organization?.has_employee_count ? 'Size Available' : 'Unknown Size'),
            industry: person.organization?.industry || (person.organization?.has_industry ? 'Industry Available' : 'Unknown Industry'),
            website: person.organization?.website_url,
            photo: person.photo_url,
            original: person // Keep raw data for debugging
            })));
        } else if (data.contacts) {
            // ... strict legacy support ...
            setSearchResults(data.contacts.map(contact => ({
            id: contact.id,
            type: 'person',
            name: contact.name || `${contact.first_name} ${contact.last_name}`,
            title: contact.title,
            company: contact.organization_name || contact.organization?.name,
            email: contact.email,
            phone: contact.phone_numbers?.[0]?.sanitized_number,
            linkedin: contact.linkedin_url,
            location: contact.city ? `${contact.city}, ${contact.state}` : contact.country,
            companySize: contact.organization?.estimated_num_employees,
            industry: contact.organization?.industry,
            website: contact.website_url || contact.organization?.website_url,
            photo: contact.photo_url,
            original: contact
            })));
        } else if (data.error) {
            alert('Apollo API error: ' + data.error);
        } else {
            console.warn('Unexpected Apollo response format:', data);
            alert('Search completed but no data format matched.');
        }
      }
      // Track credit usage for successful search (Apollo charges ~1 credit per search)
      await trackCreditUsage(1);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Check console for details.');
    } finally {
      setSearching(false);
    }
  };
  
  // Drill down from company to people
  const findDecisionMakers = (company) => {
      setSearchMode('people');
      setSearchCriteria({
          ...searchCriteria,
          companies: company.name, // Visual update
      });
      console.log("Drilling down into company:", company.name, company.id);
      
      // Execute immediate search for decision makers at this company
      // Organization ID is more precise than name if we have it
      let params = {};
      if (company.id) {
          params.organization_ids = [company.id];
      } else {
          params.organization_names = [company.name];
      }
      
      // Default to "Leaders" if no titles set
      if (!searchCriteria.titles) {
          params.person_titles = ["VP Sales", "Chief Revenue Officer", "Head of Sales", "Director of Learning", "VP HR", "CEO"];
      }
      
      searchApollo(params, 'people');
  };

  // Unlock contact info (Consumes Apollo Credit)
  const revealContact = async (person) => {
    if (!profile || !apolloKey) {
       alert("Please ensure your API Key is saved."); 
       return;
    }
    
    if (!confirm(`Unlock contact info for ${person.name}? This will use 1 Apollo Credit.`)) return;

    try {
        const functions = getFunctions(app, 'us-central1');
        // Apollo uses the 'people/match' or specific enrichment endpoints for this.
        // We will reuse the proxy but pass specific 'reveal' mode if needed, 
        // or just re-query with email_not_null to try and force a fetch if we have ID.
        // BETTER: The standard search returns "email" if it's already revealed, 
        // but to *force* a reveal often requires a specific enrichment call.
        // For this V1 implementation, we will try to fetch the person's details directly.
        
        // Note: The most reliable way to 'reveal' in many APIs is to request the enriched profile.
        const apolloReveal = httpsCallable(functions, 'apolloSearchProxy');
        
        const result = await apolloReveal({ 
            apiKey: apolloKey, 
            mode: 'enrich', // We'll add this handler
            entityId: person.id 
        });

        const enrichedPerson = result.data.person;
        
        // Update the local state with the revealed info
        setSearchResults(prev => prev.map(p => {
            if (p.id === person.id) {
                // Construct full name if available
                const fullName = enrichedPerson.name || 
                               (enrichedPerson.first_name ? `${enrichedPerson.first_name} ${enrichedPerson.last_name}` : p.name);

                return {
                    ...p,
                    name: fullName, 
                    email: enrichedPerson.email || p.email,
                    phone: enrichedPerson.phone_numbers?.[0]?.sanitized_number || p.phone,
                    // Update other potentially richer fields from full profile
                    title: enrichedPerson.title || p.title,
                    linkedin: enrichedPerson.linkedin_url || p.linkedin,
                    company: enrichedPerson.organization?.name || p.company,
                    location: enrichedPerson.city ? `${enrichedPerson.city}, ${enrichedPerson.state}` : p.location,
                    website: enrichedPerson.organization?.website_url || p.website,
                    industry: enrichedPerson.organization?.industry || p.industry,
                    companySize: enrichedPerson.organization?.estimated_num_employees || p.companySize,
                    revealed: true
                };
            }
            return p;
        }));
        
        alert("Contact unlocked & profile updated!");

    } catch (e) {
        console.error("Reveal failed:", e);
        alert("Failed to unlock contact. You may be out of credits.");
    }
  };

  // Save a found prospect to our database
  const saveProspect = async (result) => {
    try {
      await addDoc(collection(db, 'corporate_prospects'), {
        name: result.name,
        company: result.company || '',
        title: result.title || '',
        email: result.email || '',
        phone: result.phone || '',
        linkedin: result.linkedin || '',
        location: result.location || '',
        website: result.website || '',
        status: 'new',
        notes: `Found via Apollo search. Industry: ${result.industry || 'N/A'}. Company size: ${result.companySize || 'N/A'}. ${result.notes || ''}`,
        source: 'apollo',
        apolloId: result.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Remove from search results
      setSearchResults(prev => prev.filter(r => r.id !== result.id));
      loadProspects();
    } catch (error) {
      console.error('Error saving prospect:', error);
    }
  };

  const handleSaveAll = async () => {
    if (!confirm(`Save all ${searchResults.length} prospects to your list?`)) return;
    // Simple loop to save all since we don't have batch write limits logic here yet
    // and we want to reuse the simple addDoc pattern
    let savedCount = 0;
    for (const result of searchResults) {
        try {
            await addDoc(collection(db, 'corporate_prospects'), {
                name: result.name,
                company: result.company || '',
                title: result.title || '',
                email: result.email || '',
                phone: result.phone || '',
                linkedin: result.linkedin || '',
                status: 'new',
                notes: `Found via Apollo search. Industry: ${result.industry || 'N/A'}. Company size: ${result.companySize || 'N/A'}`,
                source: 'apollo',
                apolloId: result.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            savedCount++;
        } catch (e) {
            console.error("Failed to save one:", e);
        }
    }
    setSearchResults([]);
    loadProspects();
    alert(`Successfully saved ${savedCount} prospects!`);
  };

  const saveApiKey = async () => {
    if (!currentUser) {
      alert('You must be logged in to save API settings.');
      return;
    }
    try {
      const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'apollo');
      await setDoc(settingsRef, {
        apiKey: apolloKey,
        creditsUsed: apolloCreditsUsed,
        creditsLimit: apolloCreditsLimit,
        lastCreditReset: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setShowApiSetup(false);
    } catch (error) {
      console.error('Error saving Apollo settings:', error);
      alert('Failed to save API settings. Please try again.');
    }
  };

  // Track credit usage after a successful search
  const trackCreditUsage = async (creditsUsed = 1) => {
    if (!currentUser) return;
    const newTotal = apolloCreditsUsed + creditsUsed;
    setApolloCreditsUsed(newTotal);
    try {
      const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'apollo');
      await setDoc(settingsRef, {
        creditsUsed: newTotal,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error tracking credit usage:', error);
    }
  };

  const handleExportCSV = () => {
    if (prospects.length === 0) {
        alert("No prospects to export.");
        return;
    }
    const headers = ["Name", "Company", "Title", "Email", "Phone", "LinkedIn", "Status", "Notes"];
    const csvContent = [
        headers.join(","),
        ...prospects.map(p => [
            `"${p.name || ''}"`,
            `"${p.company || ''}"`,
            `"${p.title || ''}"`,
            `"${p.email || ''}"`,
            `"${p.phone || ''}"`,
            `"${p.linkedin || ''}"`,
            `"${p.status || ''}"`,
            `"${p.notes || ''}"`
        ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leaderreps_prospects_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProspects = prospects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to fill merge fields in templates
  const fillMergeFields = (text, prospect, startDate = null) => {
    if (!text) return '';
    const firstName = prospect.name ? prospect.name.split(' ')[0] : '';
    const lastName = prospect.name ? prospect.name.split(' ').slice(1).join(' ') : '';
    
    // Calculate date for [Date] placeholder
    const eventDate = startDate ? new Date(startDate) : new Date();
    eventDate.setDate(eventDate.getDate() + 7); // Default event 1 week from start
    const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    return text
      .replace(/\[First Name\]/g, firstName || '[First Name]')
      .replace(/\[Last Name\]/g, lastName || '[Last Name]')
      .replace(/\[Full Name\]/g, prospect.name || '[Full Name]')
      .replace(/\[Company\]/g, prospect.company || '[Company]')
      .replace(/\[Their Company\]/g, prospect.company || '[Their Company]')
      .replace(/\[Title\]/g, prospect.title || '[Title]')
      .replace(/\[Industry\]/g, prospect.industry || 'your industry')
      .replace(/\[Date\]/g, formattedDate)
      .replace(/\[Topic\]/g, 'Leadership Development')
      .replace(/\[Link\]/g, '[Link will be inserted]');
  };

  // Calculate actual date for each step
  const getStepDate = (stepDay, startDate) => {
    const date = startDate ? new Date(startDate) : new Date();
    date.setDate(date.getDate() + stepDay);
    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  };

  // Open sequence launcher modal
  const openSequenceLauncher = (prospect) => {
    setSequenceProspect(prospect);
    setSelectedCampaign(null);
    setSequenceStartDate(new Date().toISOString().split('T')[0]); // Today
    setPreviewStep(0);
    setLaunchConfirmed(false);
    setSelectedSender(''); // No default - require user to choose who gets replies
    setShowSequenceLauncher(true);
  };

  // Launch the sequence
  const launchSequence = async () => {
    if (!sequenceProspect || !selectedCampaign || !launchConfirmed || !selectedSender) return;
    
    setLaunching(true);
    try {
      const campaign = CAMPAIGNS[selectedCampaign];
      const startDate = sequenceStartDate ? new Date(sequenceStartDate) : new Date();
      const senderInfo = TEAM_SENDERS.find(s => s.email === selectedSender);
      
      // Calculate first task date based on first step
      const firstStep = campaign.steps[0];
      const firstTaskDate = getStepDate(firstStep.day, startDate);
      
      await updateDoc(doc(db, 'corporate_prospects', sequenceProspect.id), {
        status: 'sequence_active',
        campaignId: selectedCampaign,
        campaignName: campaign.name,
        sequenceStartDate: startDate.toISOString(),
        currentStepIndex: 0,
        nextTaskDate: firstTaskDate.toISOString(),
        nextTaskType: firstStep.type,
        sequenceLaunchedAt: new Date().toISOString(),
        sequenceLaunchedBy: currentUser?.email || 'unknown',
        // Sender configuration - who replies go to
        assignedSenderEmail: selectedSender,
        assignedSenderName: senderInfo?.name || selectedSender,
        assignedSenderTitle: senderInfo?.title || '',
      });
      
      setShowSequenceLauncher(false);
      loadProspects();
      
      // Show success with details
      alert(`✅ Sequence launched!\n\n${sequenceProspect.name} is now on "${campaign.name}"\n\nFirst touch: ${firstStep.name} on ${firstTaskDate.toLocaleDateString()}\n\nReplies will go to: ${senderInfo?.name || selectedSender}`);
    } catch (e) {
      console.error("Error launching sequence", e);
      alert("Failed to launch sequence. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  // Legacy function - now opens the modal
  const addToSequence = (prospect) => {
    openSequenceLauncher(prospect);
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    sequence_active: 'bg-purple-100 text-purple-700 border border-purple-200',
    contacted: 'bg-amber-100 text-amber-700',
    qualified: 'bg-purple-100 text-purple-700',
    proposal: 'bg-cyan-100 text-cyan-700',
    won: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-slate-100 text-slate-500',
  };

  /**
   * PIPELINE KANBAN BOARD
   * 
   * This provides a visual drag-and-drop view of your sales pipeline.
   * 
   * HOW TO USE:
   * 1. Click the "Kanban" view toggle button (grid icon) in the Saved tab
   * 2. Drag prospect cards between columns to change their status
   * 3. Cards are automatically saved to Firestore when moved
   * 
   * PIPELINE STAGES (in order):
   * - New Lead: Fresh prospects not yet contacted
   * - In Sequence: Currently in an automated outreach sequence  
   * - Contacted: Manual outreach has been made
   * - Qualified: Confirmed as a good fit / interested
   * - Proposal Sent: Formal proposal or quote has been sent
   * - Closed Won: Deal closed successfully! 🎉
   * - Closed Lost: Deal did not close
   */
  const PIPELINE_STAGES = [
    { id: 'new', label: 'New Lead', color: 'blue', description: 'Fresh prospects' },
    { id: 'sequence_active', label: 'In Sequence', color: 'purple', description: 'Active outreach' },
    { id: 'contacted', label: 'Contacted', color: 'amber', description: 'Awaiting response' },
    { id: 'qualified', label: 'Qualified', color: 'indigo', description: 'Good fit confirmed' },
    { id: 'proposal', label: 'Proposal Sent', color: 'cyan', description: 'Quote delivered' },
    { id: 'won', label: 'Closed Won', color: 'emerald', description: 'Deal closed! 🎉' },
    { id: 'lost', label: 'Closed Lost', color: 'slate', description: 'Did not close' },
  ];

  // Handle drag start for Kanban
  const handleDragStart = (e, prospect) => {
    setDraggedProspect(prospect);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to show the dragging state
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedProspect(null);
  };

  // Handle drag over (allow drop)
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop - update prospect status
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedProspect) return;
    
    // Check ownership
    const auth = getAuth();
    if (draggedProspect.ownerId && draggedProspect.ownerId !== auth.currentUser?.uid) {
      alert(`Cannot move: This prospect belongs to ${draggedProspect.ownerName}`);
      return;
    }
    
    // Optimistically update UI
    setProspects(prev => prev.map(p => 
      p.id === draggedProspect.id ? { ...p, status: newStatus } : p
    ));
    
    // Update in Firestore
    try {
      await updateDoc(doc(db, 'corporate_prospects', draggedProspect.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating prospect status:', error);
      // Revert on error
      loadProspects();
    }
    
    setDraggedProspect(null);
  };

  // Calculate pipeline value for a stage
  const getStagePipelineValue = (stageId) => {
    // For now, we don't have deal values. This can be extended to show $ amounts.
    return prospects.filter(p => p.status === stageId).length;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy">Prospects</h1>
          <p className="text-slate-500 mt-1">Sales Navigator replacement — find and track leads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStrategyGuide(true)}
            className="text-corporate-teal hover:text-corporate-teal/80 text-sm flex items-center gap-1 font-medium bg-teal-50 px-3 py-1.5 rounded-full"
          >
            <BookOpen size={16} />
            Strategy Guide
          </button>
          <button
            onClick={() => setShowApiSetup(true)}
            className={`text-sm flex items-center gap-2 px-3 py-1.5 rounded-full transition ${
              apolloKey 
                ? apolloCreditsUsed >= apolloCreditsLimit 
                  ? 'bg-red-50 text-red-600' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            ⚙️ {apolloKey ? `Credits: ${apolloCreditsUsed}/${apolloCreditsLimit}` : 'Setup API'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={18} />
            Add Manually
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'search' 
              ? 'bg-white text-corporate-navy shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles size={16} className="inline mr-2" />
          Find Prospects
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeTab === 'saved' 
              ? 'bg-white text-corporate-navy shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Saved ({prospects.length})
        </button>
      </div>

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <div>
          {/* Mode Toggle & Presets */}
          <div className="flex flex-col gap-4 mb-6">
             <div className="bg-slate-100 p-1 rounded-lg w-fit flex">
                <button
                    onClick={() => setSearchMode('people')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${searchMode === 'people' ? 'bg-white shadow-sm text-corporate-navy' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <User size={16} className="inline mr-2" />
                    People
                </button>
                <button
                    onClick={() => setSearchMode('companies')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${searchMode === 'companies' ? 'bg-white shadow-sm text-corporate-navy' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Building2 size={16} className="inline mr-2" />
                    Companies
                </button>
             </div>

            <div className="flex items-center gap-2">
                 <span className="text-sm text-slate-500">Quick Filters:</span>
                 {PRESETS.map((preset) => (
                    <button
                    key={preset.label}
                    onClick={() => {
                        setSearchMode('people'); // Presets are currently people focused
                        applyPreset(preset);
                    }}
                    className="bg-white border border-slate-200 hover:border-corporate-teal hover:text-corporate-teal text-slate-600 text-xs px-3 py-2 rounded-full transition flex items-center gap-1"
                    >
                    <Target size={12} />
                    {preset.label}
                    </button>
                ))}
                 {/* Special Company Preset */}
                 <button
                    onClick={() => {
                        setSearchMode('companies');
                        setSearchCriteria({ keywords: 'SaaS', industries: 'Technology', companySize: '51-200' });
                    }}
                    className="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs px-3 py-2 rounded-full transition flex items-center gap-1"
                 >
                    <Sparkles size={12} />
                    High Growth SaaS
                 </button>
            </div>
          </div>

          {/* Search Criteria Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-corporate-navy flex items-center gap-2">
                <Target size={18} />
                {searchMode === 'people' ? 'Define Ideal Person' : 'Define Target Accounts'}
              </h2>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm text-corporate-teal hover:text-corporate-teal/80 flex items-center gap-1"
              >
                <Filter size={14} />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                <ChevronDown size={14} className={`transform transition ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {/* BASIC FILTERS */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {searchMode === 'people' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Titles</label>
                <input
                  type="text"
                  value={searchCriteria.titles}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, titles: e.target.value })}
                  placeholder="VP Sales, Director of HR, CEO..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
                <p className="text-xs text-slate-400 mt-1">Comma-separated</p>
              </div>
              ) : (
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keywords / Tech Stack</label>
                <input
                  type="text"
                  value={searchCriteria.keywords}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, keywords: e.target.value })}
                  placeholder="SaaS, Salesforce, HubSpot..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
                <p className="text-xs text-slate-400 mt-1">Technologies used or business type</p>
              </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Companies</label>
                <input
                  type="text"
                  value={searchCriteria.companies}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, companies: e.target.value })}
                  placeholder={searchMode === 'people' ? "Google, Microsoft..." : "Specific company name..."}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
                 {searchMode === 'companies' && <p className="text-xs text-slate-400 mt-1">Leave blank to search all</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={searchCriteria.locations}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, locations: e.target.value })}
                  placeholder="United States, California, New York..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Size</label>
                <select
                  value={searchCriteria.companySize}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, companySize: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                >
                  <option value="">Any size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Industries</label>
                <input
                  type="text"
                  value={searchCriteria.industries}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, industries: e.target.value })}
                  placeholder="Technology, Healthcare, Finance..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {INDUSTRY_OPTIONS.slice(0, 8).map(ind => (
                    <button
                      key={ind}
                      onClick={() => {
                        const current = searchCriteria.industries ? searchCriteria.industries.split(',').map(i => i.trim()) : [];
                        if (current.includes(ind)) {
                          setSearchCriteria({ ...searchCriteria, industries: current.filter(i => i !== ind).join(', ') });
                        } else {
                          setSearchCriteria({ ...searchCriteria, industries: [...current, ind].join(', ') });
                        }
                      }}
                      className={`text-xs px-2 py-1 rounded-full transition ${
                        searchCriteria.industries?.includes(ind)
                          ? 'bg-corporate-teal text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* PEOPLE-SPECIFIC FILTERS: Seniority & Department */}
            {searchMode === 'people' && (
              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Seniority Level</label>
                  <div className="flex flex-wrap gap-2">
                    {SENIORITY_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          const current = searchCriteria.seniorities || [];
                          if (current.includes(option.value)) {
                            setSearchCriteria({ ...searchCriteria, seniorities: current.filter(s => s !== option.value) });
                          } else {
                            setSearchCriteria({ ...searchCriteria, seniorities: [...current, option.value] });
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full transition border ${
                          searchCriteria.seniorities?.includes(option.value)
                            ? 'bg-corporate-teal text-white border-corporate-teal'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-corporate-teal'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department / Function</label>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          const current = searchCriteria.departments || [];
                          if (current.includes(option.value)) {
                            setSearchCriteria({ ...searchCriteria, departments: current.filter(d => d !== option.value) });
                          } else {
                            setSearchCriteria({ ...searchCriteria, departments: [...current, option.value] });
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full transition border ${
                          searchCriteria.departments?.includes(option.value)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* ADVANCED FILTERS (Collapsible) */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-slate-200 mt-4">
                <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-corporate-teal" />
                  Advanced Filters
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Revenue Range */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Revenue Range</label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={searchCriteria.revenueMin}
                        onChange={(e) => setSearchCriteria({ ...searchCriteria, revenueMin: e.target.value })}
                        className="flex-1 px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                      >
                        <option value="">Min</option>
                        {REVENUE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className="text-slate-400">to</span>
                      <select
                        value={searchCriteria.revenueMax}
                        onChange={(e) => setSearchCriteria({ ...searchCriteria, revenueMax: e.target.value })}
                        className="flex-1 px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                      >
                        <option value="">Max</option>
                        {REVENUE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Funding Stage */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Funding Stage</label>
                    <div className="flex flex-wrap gap-1">
                      {FUNDING_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            const current = searchCriteria.fundingStages || [];
                            if (current.includes(option.value)) {
                              setSearchCriteria({ ...searchCriteria, fundingStages: current.filter(f => f !== option.value) });
                            } else {
                              setSearchCriteria({ ...searchCriteria, fundingStages: [...current, option.value] });
                            }
                          }}
                          className={`text-xs px-2 py-1 rounded transition ${
                            searchCriteria.fundingStages?.includes(option.value)
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Email Status (People mode only) */}
                  {searchMode === 'people' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Status</label>
                      <select
                        value={searchCriteria.emailStatus}
                        onChange={(e) => setSearchCriteria({ ...searchCriteria, emailStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                      >
                        <option value="any">Any (show all)</option>
                        <option value="verified">✓ Verified emails only</option>
                        <option value="likely">Verified + Likely</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Technologies (Company mode) */}
                  {searchMode === 'companies' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Technologies Used</label>
                      <input
                        type="text"
                        value={searchCriteria.technologies}
                        onChange={(e) => setSearchCriteria({ ...searchCriteria, technologies: e.target.value })}
                        placeholder="Salesforce, HubSpot, AWS..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                      />
                    </div>
                  )}
                  
                  {/* Exclude Titles (People mode) */}
                  {searchMode === 'people' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Exclude Titles</label>
                      <input
                        type="text"
                        value={searchCriteria.excludeTitles}
                        onChange={(e) => setSearchCriteria({ ...searchCriteria, excludeTitles: e.target.value })}
                        placeholder="Intern, Assistant, Contractor..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                      />
                    </div>
                  )}
                  
                  {/* Company HQ Location */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company HQ Location</label>
                    <input
                      type="text"
                      value={searchCriteria.companyHeadquarters}
                      onChange={(e) => setSearchCriteria({ ...searchCriteria, companyHeadquarters: e.target.value })}
                      placeholder="San Francisco, New York..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                    />
                    <p className="text-xs text-slate-400 mt-1">HQ only (not remote workers)</p>
                  </div>
                </div>
                
                {/* Active Filters Summary */}
                {(searchCriteria.seniorities?.length > 0 || searchCriteria.departments?.length > 0 || searchCriteria.fundingStages?.length > 0 || searchCriteria.revenueMin || searchCriteria.revenueMax) && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Active Filters:</span>
                      <button
                        onClick={() => setSearchCriteria({
                          ...searchCriteria,
                          seniorities: [],
                          departments: [],
                          fundingStages: [],
                          revenueMin: '',
                          revenueMax: '',
                          emailStatus: 'any',
                          excludeTitles: '',
                          technologies: '',
                          companyHeadquarters: '',
                        })}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear Advanced
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {searchCriteria.seniorities?.map(s => (
                        <span key={s} className="text-xs bg-corporate-teal/10 text-corporate-teal px-2 py-0.5 rounded">
                          {SENIORITY_OPTIONS.find(o => o.value === s)?.label}
                        </span>
                      ))}
                      {searchCriteria.departments?.map(d => (
                        <span key={d} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
                          {DEPARTMENT_OPTIONS.find(o => o.value === d)?.label}
                        </span>
                      ))}
                      {searchCriteria.fundingStages?.map(f => (
                        <span key={f} className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                          {FUNDING_OPTIONS.find(o => o.value === f)?.label}
                        </span>
                      ))}
                      {(searchCriteria.revenueMin || searchCriteria.revenueMax) && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded">
                          Revenue: {REVENUE_OPTIONS.find(o => o.value === searchCriteria.revenueMin)?.label || '$0'} - {REVENUE_OPTIONS.find(o => o.value === searchCriteria.revenueMax)?.label || 'Any'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Search Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => searchApollo()}
                  disabled={searching}
                  className="bg-corporate-teal hover:bg-corporate-teal/90 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {searching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      Find Prospects
                    </>
                  )}
                </button>
                
                {/* Active filter count badge */}
                {(() => {
                  const filterCount = [
                    searchCriteria.titles,
                    searchCriteria.companies,
                    searchCriteria.locations,
                    searchCriteria.industries,
                    searchCriteria.companySize,
                    searchCriteria.keywords,
                    searchCriteria.seniorities?.length > 0,
                    searchCriteria.departments?.length > 0,
                    searchCriteria.fundingStages?.length > 0,
                    searchCriteria.revenueMin || searchCriteria.revenueMax,
                    searchCriteria.emailStatus !== 'any',
                    searchCriteria.excludeTitles,
                    searchCriteria.technologies,
                    searchCriteria.companyHeadquarters,
                  ].filter(Boolean).length;
                  
                  return filterCount > 0 ? (
                    <span className="text-sm text-slate-500">
                      {filterCount} filter{filterCount !== 1 ? 's' : ''} active
                    </span>
                  ) : null;
                })()}
              </div>
              
              <button
                onClick={() => setSearchCriteria({
                  titles: '',
                  companies: '',
                  industries: '',
                  locations: '',
                  companySize: '',
                  keywords: '',
                  seniorities: [],
                  departments: [],
                  revenueMin: '',
                  revenueMax: '',
                  fundingStages: [],
                  technologies: '',
                  emailStatus: 'any',
                  excludeTitles: '',
                  yearsInPosition: '',
                  companyHeadquarters: '',
                })}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X size={14} />
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-yellow-50 text-xs font-mono overflow-auto max-h-40 border-b border-yellow-100 hidden">
                 <strong>DEBUG: First Result Raw Data</strong>
                 <pre>{JSON.stringify(searchResults[0].original, null, 2)}</pre>
              </div>

              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-medium text-corporate-navy">
                  Found {searchResults.length} prospects matching your criteria
                </h3>
                <button 
                  onClick={handleSaveAll}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1 text-xs rounded shadow-sm flex items-center gap-1"
                >
                  <UserPlus size={12} />
                  Save All
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {searchResults.map((result) => (
                  <div key={result.id} className="p-4 hover:bg-slate-50 flex items-center gap-4">
                    
                    {/* Render Company Card */}
                    {result.type === 'company' && (
                        <>
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden p-1 shadow-sm">
                            {result.logo ? (
                            <img src={result.logo} alt="" className="w-full h-full object-contain" />
                            ) : (
                            <Building2 size={20} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-corporate-navy text-lg">{result.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                {result.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={12} /> {result.location}
                                </span>
                                )}
                                {result.industry && (
                                <span className="flex items-center gap-1">
                                    <Target size={12} /> {result.industry}
                                </span>
                                )}
                                {result.companySize && (
                                <span className="flex items-center gap-1">
                                    <Users size={12} /> {result.companySize} employees
                                </span>
                                )}
                            </div>
                            {result.description && (
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 max-w-2xl">{result.description}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                                {result.linkedin && (
                                    <a href={result.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-700 tooltip" title="LinkedIn">
                                    <Linkedin size={14} />
                                    </a>
                                )}
                                {result.website && (
                                    <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-700 tooltip" title="Website">
                                    <Globe size={14} />
                                    </a>
                                )}
                                <a href={`https://www.google.com/search?q=${encodeURIComponent(result.name + ' funding news')}&tbm=nws`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-700 flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 rounded-full hover:bg-slate-200">
                                   <TrendingUp size={10} /> News
                                </a>
                                <a href={`https://builtwith.com/${result.website ? new URL(result.website).hostname : result.name}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-700 flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 rounded-full hover:bg-slate-200">
                                   <FileText size={10} /> Tech Stack
                                </a>
                            </div>
                        </div>
                        <div>
                            <button
                                onClick={() => findDecisionMakers(result)}
                                className="bg-white border-2 border-corporate-teal text-corporate-teal hover:bg-corporate-teal hover:text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
                            >
                                <Search size={14} />
                                Find Decision Makers
                            </button>
                        </div>
                        </>
                    )}

                    {/* Render Person Card (Default/Existing) */}
                    {(result.type === 'person' || !result.type) && (
                    <>
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                      {result.photo ? (
                        <img src={result.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-corporate-navy">{result.name}</h4>
                        {result.linkedin && (
                          <a href={result.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <Linkedin size={14} />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{result.title} at {result.company}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        {result.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {result.location}
                          </span>
                        )}
                        {result.industry && (
                          <span className="flex items-center gap-1">
                            <Building2 size={12} /> {result.industry}
                          </span>
                        )}
                        {result.companySize && (
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {result.companySize} employees
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.email && !result.email.includes("(Locked)") ? (
                         <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                           <Mail size={10} /> {result.email}
                         </span>
                      ) : (result.email || result.phone) ? (
                         <button
                            onClick={() => revealContact(result)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-amber-200"
                            title="Uses 1 Credit"
                         >
                            <Lock size={10} /> Unlock Info
                         </button>
                      ) : null}
                      <button
                        onClick={() => saveProspect(result)}
                        className="bg-corporate-teal hover:bg-corporate-teal/90 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition"
                      >
                        <UserPlus size={14} />
                        Save
                      </button>
                    </div>
                    </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && !searching && (
            <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-corporate-navy mb-2">Find Your Next Customers</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Enter criteria above to search for prospects. We use Apollo.io's database of 275M+ contacts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SAVED TAB */}
      {activeTab === 'saved' && (
        <div>
          {/* Filter Search & View Toggle */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter saved prospects..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal"
              />
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-corporate-navy' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List size={16} /> List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'kanban' ? 'bg-white shadow-sm text-corporate-navy' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Kanban Pipeline View"
              >
                <LayoutGrid size={16} /> Pipeline
              </button>
            </div>
            
            <button
               onClick={handleExportCSV}
               className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2"
            >
               <Download size={16} />
               Export CSV
            </button>
          </div>

          {/* Stats Row - Shows in both views */}
          <div className="grid grid-cols-7 gap-4 mb-6">
            {[
                { id: 'new', label: 'New' },
                { id: 'sequence_active', label: 'In Sequence' },
                { id: 'contacted', label: 'Contacted' },
                { id: 'qualified', label: 'Qualified' },
                { id: 'proposal', label: 'Proposal' },
                { id: 'won', label: 'Won' },
                { id: 'lost', label: 'Lost' }
            ].map(stat => (
              <div key={stat.id} className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                <p className="text-2xl font-bold text-corporate-navy">
                  {prospects.filter(p => p.status === stat.id).length}
                </p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {PIPELINE_STAGES.map(stage => {
                  const stageProspects = filteredProspects.filter(p => p.status === stage.id);
                  const colorMap = {
                    blue: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
                    purple: { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
                    amber: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
                    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
                    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
                    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
                    slate: { bg: 'bg-slate-50', border: 'border-slate-200', header: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
                  };
                  const colors = colorMap[stage.color];
                  
                  return (
                    <div 
                      key={stage.id}
                      className={`w-72 flex-shrink-0 rounded-xl border ${colors.border} ${colors.bg} flex flex-col max-h-[70vh]`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage.id)}
                    >
                      {/* Column Header */}
                      <div className={`p-3 rounded-t-xl ${colors.header} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                          <span className="font-bold text-sm">{stage.label}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50">
                          {stageProspects.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 px-3 py-1 border-b border-slate-200/50">{stage.description}</p>
                      
                      {/* Cards Container */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {stageProspects.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                            Drag prospects here
                          </div>
                        ) : (
                          stageProspects.map(prospect => (
                            <div
                              key={prospect.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, prospect)}
                              onDragEnd={handleDragEnd}
                              className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-corporate-teal/10 rounded-full flex items-center justify-center text-corporate-teal">
                                    <User size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-medium text-sm text-corporate-navy truncate">{prospect.name}</h4>
                                    <p className="text-xs text-slate-500 truncate">{prospect.title}</p>
                                  </div>
                                </div>
                                <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition shrink-0" />
                              </div>
                              
                              <p className="text-xs text-slate-600 mb-2 truncate">{prospect.company}</p>
                              
                              <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  {prospect.email && <Mail size={10} />}
                                  {prospect.phone && <Phone size={10} />}
                                  {prospect.linkedin && <Linkedin size={10} />}
                                </div>
                                {prospect.ownerName && (
                                  <span className="text-slate-400 truncate max-w-[80px]">
                                    {prospect.ownerName.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                              
                              {/* Quick Actions on Hover */}
                              <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(prospect); }}
                                  className="flex-1 text-[10px] py-1 text-slate-500 hover:text-corporate-teal hover:bg-slate-50 rounded"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); addToSequence(prospect); }}
                                  className="flex-1 text-[10px] py-1 text-slate-500 hover:text-purple-600 hover:bg-slate-50 rounded"
                                >
                                  Sequence
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Kanban Instructions */}
              <div className="mt-4 text-center text-xs text-slate-400">
                💡 <strong>Tip:</strong> Drag and drop cards between columns to update prospect status
              </div>
            </div>
          )}

          {/* LIST VIEW (Original Table) */}
          {viewMode === 'list' && (
            <>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : prospects.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-corporate-navy mb-2">No prospects saved yet</h3>
              <p className="text-slate-500 mb-4">Use the "Find Prospects" tab to search for leads, or add manually.</p>
              <button
                onClick={() => setActiveTab('search')}
                className="bg-corporate-teal hover:bg-corporate-teal/90 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <Sparkles size={18} />
                Find Prospects
              </button>
            </div>
          ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProspects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-corporate-teal/10 rounded-full flex items-center justify-center">
                        <User size={14} className="text-corporate-teal" />
                      </div>
                      <span className="font-medium text-corporate-navy">{prospect.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{prospect.company}</td>
                  <td className="px-4 py-3 text-slate-600">{prospect.title}</td>
                  <td className="px-4 py-3">
                    {prospect.ownerId ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex w-fit items-center gap-1 ${prospect.ownerId === currentUser?.uid ? 'bg-teal-50 text-teal-700 font-medium' : 'bg-slate-100 text-slate-500'}`}>
                            {prospect.ownerName?.split(' ')[0] || 'Unknown'}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Global</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {prospect.email && (
                        <a href={`mailto:${prospect.email}`} className="text-slate-400 hover:text-corporate-teal">
                          <Mail size={14} />
                        </a>
                      )}
                      {prospect.phone && (
                        <a href={`tel:${prospect.phone}`} className="text-slate-400 hover:text-corporate-teal">
                          <Phone size={14} />
                        </a>
                      )}
                      {prospect.linkedin && (
                        <a href={prospect.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                          <Linkedin size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[prospect.status] || statusColors.new}`}>
                      {prospect.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                        onClick={() => addToSequence(prospect)}
                        className="p-1 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded mr-1 tooltip"
                        title="Add to Sequence"
                    >
                        <Send size={14} />
                    </button>
                    <button 
                        onClick={() => handleEdit(prospect)} 
                        disabled={prospect.ownerId && prospect.ownerId !== currentUser?.uid}
                        className={`p-1 rounded ${prospect.ownerId && prospect.ownerId !== currentUser?.uid ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-400'}`}
                    >
                      <Edit2 size={14} className={prospect.ownerId && prospect.ownerId !== currentUser?.uid ? "" : "text-slate-400"} />
                    </button>
                    <button 
                        onClick={() => handleDelete(prospect.id)} 
                        disabled={prospect.ownerId && prospect.ownerId !== currentUser?.uid}
                        className={`p-1 rounded ml-1 ${prospect.ownerId && prospect.ownerId !== currentUser?.uid ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                    >
                      <Trash2 size={14} className={prospect.ownerId && prospect.ownerId !== currentUser?.uid ? "" : "text-red-400"} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          )}
            </>
          )}
        </div>
      )}

      {/* API Setup Modal */}
      {showApiSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-corporate-navy">Apollo.io API Setup</h2>
              <button onClick={() => setShowApiSetup(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            {/* Credit Usage Display */}
            {apolloKey && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Monthly Credit Usage</span>
                  <span className={`text-sm font-bold ${apolloCreditsUsed >= apolloCreditsLimit ? 'text-red-600' : 'text-corporate-teal'}`}>
                    {apolloCreditsUsed} / {apolloCreditsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${apolloCreditsUsed >= apolloCreditsLimit ? 'bg-red-500' : 'bg-corporate-teal'}`}
                    style={{ width: `${Math.min((apolloCreditsUsed / apolloCreditsLimit) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Credits reset automatically at the start of each month. Your settings are saved to your account.
                </p>
              </div>
            )}

            <p className="text-slate-600 mb-4">
              To search for prospects, you need an Apollo.io API key. Apollo offers 200 free credits/month.
            </p>
            <ol className="text-sm text-slate-600 mb-4 space-y-2">
              <li>1. Sign up at <a href="https://www.apollo.io" target="_blank" rel="noopener noreferrer" className="text-corporate-teal hover:underline">apollo.io</a> (free)</li>
              <li>2. Go to Settings → Integrations → API</li>
              <li>3. Copy your API key and paste below</li>
            </ol>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={apolloKey}
                  onChange={(e) => setApolloKey(e.target.value)}
                  placeholder="Paste your Apollo API key..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Credit Limit</label>
                <input
                  type="number"
                  value={apolloCreditsLimit}
                  onChange={(e) => setApolloCreditsLimit(parseInt(e.target.value) || 200)}
                  placeholder="200"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
                <p className="text-xs text-slate-400 mt-1">Set to match your Apollo plan (free = 200, paid plans vary)</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApiSetup(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKey}
                disabled={!apolloKey}
                className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50"
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Strategy Guide Modal */}
      {showStrategyGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-0 w-full max-w-2xl overflow-hidden max-h-[90vh]">
            <div className="bg-corporate-navy p-6 flex justify-between items-start">
               <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <BookOpen size={24} className="text-corporate-teal" />
                     The "Mack Daddy" Prospecting Strategy
                  </h2>
                  <p className="text-corporate-teal/80 text-sm mt-1">How to fill your pipeline using LeaderReps Corporate</p>
               </div>
               <button onClick={() => setShowStrategyGuide(false)} className="text-white/50 hover:text-white">
                  <X size={24} />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
               <div className="prose prose-sm max-w-none text-slate-600">
                  <div className="flex items-start gap-4 mb-6">
                     <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                     <div>
                        <h3 className="text-corporate-navy font-bold text-base mb-1">Don't Hunt People first. Hunt Companies.</h3>
                        <p className="text-sm">Stop searching for "VP of Sales" across the world. Instead, find <strong>Companies</strong> that fit your sweet spot first. Look for growth signals like "Hiring", "Funding", or specific industries like "SaaS".</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                     <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                     <div>
                        <h3 className="text-corporate-navy font-bold text-base mb-1">The "Drill Down" Method</h3>
                        <p className="text-sm">Once you find a target company (e.g. "Acme Corp"), use the <strong>"Find Decision Makers"</strong> button on the company card. This automatically searches <em>just that company</em> for the key buyers (VP Sales, CRO, Head of Learning).</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                     <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                     <div>
                        <h3 className="text-corporate-navy font-bold text-base mb-1">Verify with News & Tech Stack</h3>
                        <p className="text-sm">Use the <strong><TrendingUp size={12} className="inline"/> News</strong> link to see if they just raised money or launched a product. Use the <strong><FileText size={12} className="inline"/> Tech Stack</strong> link to see if they use Salesforce or HubSpot. Mention these in your outreach!</p>
                     </div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
                     <h4 className="font-bold text-yellow-800 text-sm mb-1">💡 Pro Tip: Bulk Export</h4>
                     <p className="text-xs text-yellow-700">Once you have a list of prospects saved, go to the <strong>Saved</strong> tab and click <strong>Export CSV</strong>. You can upload this directly into email tools like Instantly.ai or SmartLead.</p>
                  </div>
               </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
               <button 
                  onClick={() => setShowStrategyGuide(false)}
                  className="bg-corporate-navy hover:bg-corporate-navy/90 text-white px-6 py-2 rounded-lg"
               >
                  Let's Go Hunt
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== SEQUENCE LAUNCHER MODAL ========== */}
      {showSequenceLauncher && sequenceProspect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-corporate-navy to-corporate-navy/90">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Play size={20} />
                    Launch Outreach Sequence
                  </h2>
                  <p className="text-white/70 mt-1">
                    For: <span className="font-semibold text-white">{sequenceProspect.name}</span> at {sequenceProspect.company}
                  </p>
                </div>
                <button
                  onClick={() => setShowSequenceLauncher(false)}
                  className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Select Campaign */}
              <div className="mb-8">
                <h3 className="font-semibold text-corporate-navy mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-corporate-teal text-white text-xs flex items-center justify-center">1</span>
                  Choose Sequence Path
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.values(CAMPAIGNS).map(campaign => (
                    <button
                      key={campaign.id}
                      onClick={() => { setSelectedCampaign(campaign.id); setPreviewStep(0); }}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        selectedCampaign === campaign.id
                          ? 'border-corporate-teal bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-corporate-navy">{campaign.name}</h4>
                          <p className="text-sm text-slate-500 mt-1">{campaign.description}</p>
                        </div>
                        {selectedCampaign === campaign.id && (
                          <CheckCircle size={20} className="text-corporate-teal flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {campaign.steps.filter(s => s.type === 'email').length} emails
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {campaign.steps.filter(s => s.type === 'call').length} calls
                        </span>
                        <span className="flex items-center gap-1">
                          <Linkedin size={12} /> {campaign.steps.filter(s => s.type === 'linkedin').length} LinkedIn
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {campaign.steps[campaign.steps.length - 1]?.day || 0} days
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Sender (Reply-To) */}
              {selectedCampaign && (
                <div className="mb-8">
                  <h3 className="font-semibold text-corporate-navy mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-corporate-teal text-white text-xs flex items-center justify-center">2</span>
                    Who Should Replies Go To?
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    Emails will be sent from the system, but replies will go directly to this person's inbox.
                  </p>
                  <select
                    value={selectedSender}
                    onChange={(e) => setSelectedSender(e.target.value)}
                    className="w-full max-w-md px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal bg-white text-corporate-navy"
                  >
                    <option value="">-- Select who receives replies --</option>
                    {TEAM_SENDERS.map(sender => (
                      <option key={sender.email} value={sender.email}>
                        {sender.name} ({sender.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 3: Set Start Date */}
              {selectedCampaign && selectedSender && (
                <div className="mb-8">
                  <h3 className="font-semibold text-corporate-navy mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-corporate-teal text-white text-xs flex items-center justify-center">3</span>
                    Set Start Date
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="date"
                        value={sequenceStartDate}
                        onChange={(e) => setSequenceStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                      />
                    </div>
                    <button
                      onClick={() => setSequenceStartDate(new Date().toISOString().split('T')[0])}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition"
                    >
                      Start Today
                    </button>
                    <button
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setSequenceStartDate(tomorrow.toISOString().split('T')[0]);
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        setSequenceStartDate(nextWeek.toISOString().split('T')[0]);
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition"
                    >
                      Next Week
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Preview Sequence Timeline */}
              {selectedCampaign && selectedSender && sequenceStartDate && (
                <div className="mb-8">
                  <h3 className="font-semibold text-corporate-navy mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-corporate-teal text-white text-xs flex items-center justify-center">4</span>
                    Preview Sequence
                    <span className="text-sm font-normal text-slate-500 ml-2">(Click steps to preview content)</span>
                  </h3>
                  
                  {/* Timeline */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {CAMPAIGNS[selectedCampaign].steps.map((step, idx) => {
                        const stepDate = getStepDate(step.day, sequenceStartDate);
                        const isActive = previewStep === idx;
                        const typeColors = {
                          email: 'bg-blue-500',
                          call: 'bg-green-500',
                          linkedin: 'bg-indigo-500',
                          video: 'bg-pink-500',
                        };
                        const typeIcons = {
                          email: <Mail size={14} />,
                          call: <Phone size={14} />,
                          linkedin: <Linkedin size={14} />,
                          video: <Eye size={14} />,
                        };
                        
                        return (
                          <React.Fragment key={idx}>
                            <button
                              onClick={() => setPreviewStep(idx)}
                              className={`flex-shrink-0 p-3 rounded-lg border-2 transition min-w-[140px] ${
                                isActive 
                                  ? 'border-corporate-teal bg-white shadow-md' 
                                  : 'border-transparent bg-white hover:border-slate-200'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full ${typeColors[step.type]} text-white flex items-center justify-center mx-auto mb-2`}>
                                {typeIcons[step.type]}
                              </div>
                              <div className="text-xs font-medium text-corporate-navy text-center">{step.name}</div>
                              <div className="text-xs text-slate-400 text-center mt-1">
                                {stepDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-xs text-slate-400 text-center">
                                Day {step.day}
                              </div>
                            </button>
                            {idx < CAMPAIGNS[selectedCampaign].steps.length - 1 && (
                              <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Preview Content */}
                  {CAMPAIGNS[selectedCampaign].steps[previewStep] && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                            CAMPAIGNS[selectedCampaign].steps[previewStep].type === 'email' ? 'bg-blue-500' :
                            CAMPAIGNS[selectedCampaign].steps[previewStep].type === 'call' ? 'bg-green-500' :
                            CAMPAIGNS[selectedCampaign].steps[previewStep].type === 'linkedin' ? 'bg-indigo-500' :
                            'bg-pink-500'
                          }`}>
                            {CAMPAIGNS[selectedCampaign].steps[previewStep].type.toUpperCase()}
                          </span>
                          <span className="font-medium text-corporate-navy">
                            {CAMPAIGNS[selectedCampaign].steps[previewStep].name}
                          </span>
                        </div>
                        <span className="text-sm text-slate-500">
                          {getStepDate(CAMPAIGNS[selectedCampaign].steps[previewStep].day, sequenceStartDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="p-4">
                        {/* Email Preview */}
                        {CAMPAIGNS[selectedCampaign].steps[previewStep].type === 'email' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">To</label>
                              <div className="text-sm text-corporate-navy">{sequenceProspect.email || <span className="text-red-500">⚠️ No email on file</span>}</div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Subject</label>
                              <div className="text-sm text-corporate-navy font-medium">
                                {fillMergeFields(CAMPAIGNS[selectedCampaign].steps[previewStep].subject, sequenceProspect, sequenceStartDate)}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Body</label>
                              <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg mt-1 border">
                                {fillMergeFields(CAMPAIGNS[selectedCampaign].steps[previewStep].template, sequenceProspect, sequenceStartDate)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* LinkedIn Preview */}
                        {CAMPAIGNS[selectedCampaign].steps[previewStep].type === 'linkedin' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">LinkedIn Profile</label>
                              <div className="text-sm text-corporate-navy">{sequenceProspect.linkedin || <span className="text-amber-500">⚠️ No LinkedIn URL - will need manual lookup</span>}</div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Message</label>
                              <div className="text-sm text-slate-700 whitespace-pre-wrap bg-blue-50 p-3 rounded-lg mt-1 border border-blue-100">
                                {fillMergeFields(CAMPAIGNS[selectedCampaign].steps[previewStep].template, sequenceProspect, sequenceStartDate)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Call Preview */}
                        {CAMPAIGNS[selectedCampaign].steps[previewStep].type === 'call' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Phone Number</label>
                              <div className="text-sm text-corporate-navy">{sequenceProspect.phone || <span className="text-amber-500">⚠️ No phone on file</span>}</div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Call Script</label>
                              <div className="text-sm text-slate-700 whitespace-pre-wrap bg-green-50 p-3 rounded-lg mt-1 border border-green-100">
                                {fillMergeFields(CAMPAIGNS[selectedCampaign].steps[previewStep].script || CAMPAIGNS[selectedCampaign].steps[previewStep].template, sequenceProspect, sequenceStartDate)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Video Preview */}
                        {CAMPAIGNS[selectedCampaign].steps[previewStep].type === 'video' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-slate-500 uppercase">Video Instructions</label>
                              <div className="text-sm text-slate-700 whitespace-pre-wrap bg-pink-50 p-3 rounded-lg mt-1 border border-pink-100">
                                {fillMergeFields(CAMPAIGNS[selectedCampaign].steps[previewStep].template, sequenceProspect, sequenceStartDate)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Psychology Note */}
                        {CAMPAIGNS[selectedCampaign].steps[previewStep].psychology && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Sparkles size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-semibold text-amber-700 uppercase">Why This Works</div>
                                <div className="text-sm text-amber-800 mt-1">
                                  {CAMPAIGNS[selectedCampaign].steps[previewStep].psychology}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Info Warning */}
              {selectedCampaign && (!sequenceProspect.email || !sequenceProspect.name) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800">Missing Required Information</h4>
                      <ul className="mt-2 space-y-1 text-sm text-red-700">
                        {!sequenceProspect.email && <li>• No email address on file for this prospect</li>}
                        {!sequenceProspect.name && <li>• No name on file for this prospect</li>}
                      </ul>
                      <p className="mt-2 text-sm text-red-600">Please update the prospect before launching a sequence.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Confirmation */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              {selectedCampaign && selectedSender && sequenceStartDate && (
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={launchConfirmed}
                      onChange={(e) => setLaunchConfirmed(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                    />
                    <span className="text-sm text-slate-700">
                      I have reviewed the sequence and confirm I want to start outreach to <strong>{sequenceProspect.name}</strong> using the <strong>"{CAMPAIGNS[selectedCampaign]?.name}"</strong> sequence starting <strong>{new Date(sequenceStartDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>. Replies will go to <strong>{TEAM_SENDERS.find(s => s.email === selectedSender)?.name || selectedSender}</strong>.
                    </span>
                  </label>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowSequenceLauncher(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={launchSequence}
                  disabled={!selectedCampaign || !selectedSender || !sequenceStartDate || !launchConfirmed || launching || !sequenceProspect.email}
                  className="px-6 py-3 bg-corporate-teal hover:bg-corporate-teal/90 text-white rounded-lg font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {launching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Launch Sequence
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-corporate-navy mb-4">
              {editingProspect ? 'Edit Prospect' : 'Add New Prospect'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90"
                >
                  {editingProspect ? 'Save Changes' : 'Add Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prospects;
