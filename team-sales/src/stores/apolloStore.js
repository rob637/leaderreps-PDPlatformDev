import { create } from 'zustand';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, app } from '../lib/firebase';
import toast from 'react-hot-toast';

// Size mapping for Apollo API
const COMPANY_SIZE_MAP = {
  '1-10': ['1', '10'],
  '11-50': ['11', '50'],
  '51-200': ['51', '200'],
  '201-500': ['201', '500'],
  '501-1000': ['501', '1000'],
  '1000+': ['1001', '10000'],
};

// Seniority levels for Apollo
export const SENIORITY_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'founder', label: 'Founder' },
  { value: 'c_suite', label: 'C-Suite' },
  { value: 'partner', label: 'Partner' },
  { value: 'vp', label: 'VP' },
  { value: 'head', label: 'Head' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior' },
  { value: 'entry', label: 'Entry Level' },
];

// Department options for Apollo
export const DEPARTMENT_OPTIONS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'information_technology', label: 'IT' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'executive', label: 'Executive' },
  { value: 'legal', label: 'Legal' },
];

export const useApolloStore = create((set, get) => ({
  // API Key management
  apiKey: '',
  apiKeyLoaded: false,
  creditsUsed: 0,
  creditsLimit: 200,
  
  // Search state
  searchMode: 'people', // 'people' or 'companies'
  searchResults: [],
  searching: false,
  
  // Search criteria
  searchCriteria: {
    titles: '',
    companies: '',
    locations: '',
    industries: '',
    keywords: '',
    companySize: '',
    seniorities: [],
    departments: [],
    emailStatus: '', // 'verified', 'likely', ''
  },
  
  // Selected results for import
  selectedResults: [],
  
  // Actions
  setSearchMode: (mode) => set({ searchMode: mode, searchResults: [], selectedResults: [] }),
  
  setSearchCriteria: (criteria) => set((state) => ({
    searchCriteria: { ...state.searchCriteria, ...criteria }
  })),
  
  resetSearchCriteria: () => set({
    searchCriteria: {
      titles: '',
      companies: '',
      locations: '',
      industries: '',
      keywords: '',
      companySize: '',
      seniorities: [],
      departments: [],
      emailStatus: '',
    },
    searchResults: [],
    selectedResults: [],
  }),
  
  toggleResultSelection: (resultId) => set((state) => {
    const isSelected = state.selectedResults.includes(resultId);
    return {
      selectedResults: isSelected
        ? state.selectedResults.filter(id => id !== resultId)
        : [...state.selectedResults, resultId]
    };
  }),
  
  selectAllResults: () => set((state) => ({
    selectedResults: state.searchResults.map(r => r.id)
  })),
  
  clearSelection: () => set({ selectedResults: [] }),
  
  // Load API key from user's settings
  loadApiKey: async (userId) => {
    if (!userId) return;
    
    try {
      // First check user's own settings
      const userSettingsRef = doc(db, 'users', userId, 'settings', 'apollo');
      const userSettingsSnap = await getDoc(userSettingsRef);
      
      if (userSettingsSnap.exists()) {
        const data = userSettingsSnap.data();
        set({
          apiKey: data.apiKey || '',
          creditsUsed: data.creditsUsed || 0,
          creditsLimit: data.creditsLimit || 200,
          apiKeyLoaded: true,
        });
        return;
      }
      
      // Fallback: Check team shared settings
      const teamSettingsRef = doc(db, 'team_settings', 'apollo');
      const teamSettingsSnap = await getDoc(teamSettingsRef);
      
      if (teamSettingsSnap.exists()) {
        const data = teamSettingsSnap.data();
        set({
          apiKey: data.apiKey || '',
          creditsUsed: data.creditsUsed || 0,
          creditsLimit: data.creditsLimit || 200,
          apiKeyLoaded: true,
        });
        return;
      }
      
      set({ apiKeyLoaded: true });
    } catch (error) {
      console.error('Error loading Apollo settings:', error);
      set({ apiKeyLoaded: true });
    }
  },
  
  // Save API key to user settings
  saveApiKey: async (userId, newApiKey) => {
    if (!userId) return;
    
    try {
      const settingsRef = doc(db, 'users', userId, 'settings', 'apollo');
      await setDoc(settingsRef, {
        apiKey: newApiKey,
        creditsUsed: 0,
        creditsLimit: 200,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      set({ apiKey: newApiKey });
      toast.success('Apollo API key saved');
    } catch (error) {
      console.error('Error saving Apollo key:', error);
      toast.error('Failed to save API key');
    }
  },
  
  // Increment and persist credits used
  incrementCreditsUsed: async (userId, amount = 1) => {
    const newCreditsUsed = get().creditsUsed + amount;
    set({ creditsUsed: newCreditsUsed });
    
    // Persist to Firestore (fire and forget)
    if (userId) {
      try {
        const settingsRef = doc(db, 'users', userId, 'settings', 'apollo');
        await setDoc(settingsRef, { 
          creditsUsed: newCreditsUsed,
          lastUsedAt: new Date().toISOString() 
        }, { merge: true });
      } catch (error) {
        console.error('Error saving credits used:', error);
      }
    }
  },
  
  // Search Apollo
  search: async (userId) => {
    const { apiKey, searchMode, searchCriteria } = get();
    
    if (!apiKey) {
      toast.error('Please configure your Apollo API key first');
      return;
    }
    
    set({ searching: true, searchResults: [] });
    
    try {
      const functions = getFunctions(app, 'us-central1');
      const apolloSearch = httpsCallable(functions, 'apolloSearchProxy');
      
      // Build search params
      const searchParams = {
        page: 1,
        per_page: 25,
      };
      
      if (searchMode === 'people') {
        if (searchCriteria.titles) {
          searchParams.person_titles = searchCriteria.titles.split(',').map(t => t.trim());
        }
        if (searchCriteria.companies) {
          searchParams.organization_names = searchCriteria.companies.split(',').map(c => c.trim());
        }
        if (searchCriteria.locations) {
          searchParams.person_locations = searchCriteria.locations.split(',').map(l => l.trim());
        }
        if (searchCriteria.industries) {
          searchParams.organization_industry_tag_ids = searchCriteria.industries.split(',').map(i => i.trim());
        }
        if (searchCriteria.keywords) {
          searchParams.q_keywords = searchCriteria.keywords;
        }
        if (searchCriteria.seniorities?.length > 0) {
          searchParams.person_seniorities = searchCriteria.seniorities;
        }
        if (searchCriteria.departments?.length > 0) {
          searchParams.person_departments = searchCriteria.departments;
        }
        if (searchCriteria.emailStatus === 'verified') {
          searchParams.contact_email_status = ['verified'];
        } else if (searchCriteria.emailStatus === 'likely') {
          searchParams.contact_email_status = ['verified', 'likely_to_engage'];
        }
      } else {
        // Company search
        if (searchCriteria.companies) {
          searchParams.q_organization_name = searchCriteria.companies;
        }
        if (searchCriteria.locations) {
          searchParams.organization_locations = searchCriteria.locations.split(',').map(l => l.trim());
        }
        if (searchCriteria.industries) {
          searchParams.organization_industry_tag_ids = searchCriteria.industries.split(',').map(i => i.trim());
        }
        if (searchCriteria.keywords) {
          searchParams.q_organization_keyword_tags = searchCriteria.keywords.split(',').map(k => k.trim());
        }
      }
      
      // Company size (both modes)
      if (searchCriteria.companySize && COMPANY_SIZE_MAP[searchCriteria.companySize]) {
        searchParams.organization_num_employees_ranges = [COMPANY_SIZE_MAP[searchCriteria.companySize].join(',')];
      }
      
      const result = await apolloSearch({
        apiKey,
        searchParams,
        mode: searchMode === 'companies' ? 'organizations' : 'people',
      });
      
      const data = result.data;
      
      if (searchMode === 'companies' && data.organizations) {
        set({
          searchResults: data.organizations.map(org => ({
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
            original: org,
          })),
        });
      } else if (data.people) {
        // Debug: log first result to see Apollo's actual response structure
        if (data.people.length > 0) {
          console.log('Apollo sample response:', JSON.stringify(data.people[0], null, 2));
        }
        set({
          searchResults: data.people.map(person => {
            // Parse first/last name - Apollo may return them separately or combined
            let firstName = person.first_name || '';
            let lastName = person.last_name || '';
            
            // Fallback: parse from full name if first/last not provided
            if (!firstName && !lastName && person.name) {
              const nameParts = person.name.trim().split(/\s+/);
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }
            
            const fullName = person.name || `${firstName} ${lastName}`.trim() || 'Unknown';
            
            return {
              id: person.id,
              type: 'person',
              name: fullName,
              firstName,
              lastName,
              title: person.title || person.headline || '',
              company: person.organization?.name || person.organization_name || '',
              companyId: person.organization?.id,
              email: person.email || (person.has_email ? '(available)' : ''),
              phone: person.phone_numbers?.[0]?.sanitized_number || '',
              linkedin: person.linkedin_url || '',
              twitter: person.twitter_url || '',
              location: person.city ? `${person.city}, ${person.state}` : (person.country || ''),
              city: person.city || '',
              state: person.state || '',
              country: person.country || '',
              companySize: person.organization?.estimated_num_employees,
              industry: person.organization?.industry,
              website: person.organization?.website_url,
              companyLinkedin: person.organization?.linkedin_url || '',
              companyTwitter: person.organization?.twitter_url || '',
              seniority: person.seniority || '',
              departments: person.departments || [],
              hasEmail: person.has_email || false,
              photo: person.photo_url,
              original: person,
            };
          }),
        });
      } else {
        toast('No results found');
      }
      
      // Track credit usage and persist
      get().incrementCreditsUsed(userId, 1);
      
    } catch (error) {
      console.error('Apollo search error:', error);
      if (error.message?.includes('Invalid')) {
        toast.error('Invalid Apollo API key');
      } else if (error.code === 'permission-denied') {
        toast.error('Apollo access not authorized for your account');
      } else {
        toast.error('Search failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      set({ searching: false });
    }
  },
  
  // Enrich a single person (reveal email/phone)
  enrichPerson: async (personId, userId) => {
    const { apiKey } = get();
    
    if (!apiKey) {
      toast.error('Apollo API key not configured');
      return null;
    }
    
    try {
      const functions = getFunctions(app, 'us-central1');
      const apolloSearch = httpsCallable(functions, 'apolloSearchProxy');
      
      const result = await apolloSearch({
        apiKey,
        entityId: personId,
        mode: 'enrich',
      });
      
      const enrichedPerson = result.data?.person;
      
      if (enrichedPerson) {
        // Debug: log enriched response to see Apollo's full structure
        console.log('Apollo enriched response:', JSON.stringify(enrichedPerson, null, 2));
        
        // Parse first/last name from enriched data
        let firstName = enrichedPerson.first_name || '';
        let lastName = enrichedPerson.last_name || '';
        
        // Fallback: parse from full name if first/last not provided
        if (!firstName && !lastName && enrichedPerson.name) {
          const nameParts = enrichedPerson.name.trim().split(/\s+/);
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        const fullName = enrichedPerson.name || `${firstName} ${lastName}`.trim();
        
        // Update the search result with enriched data
        set((state) => ({
          searchResults: state.searchResults.map(r =>
            r.id === personId
              ? {
                  ...r,
                  name: fullName || r.name,
                  firstName: firstName || r.firstName,
                  lastName: lastName || r.lastName,
                  email: enrichedPerson.email || r.email,
                  phone: enrichedPerson.phone_numbers?.[0]?.sanitized_number || r.phone,
                  linkedin: enrichedPerson.linkedin_url || r.linkedin,
                  twitter: enrichedPerson.twitter_url || r.twitter,
                  title: enrichedPerson.title || enrichedPerson.headline || r.title,
                  seniority: enrichedPerson.seniority || r.seniority,
                  city: enrichedPerson.city || r.city,
                  state: enrichedPerson.state || r.state,
                  country: enrichedPerson.country || r.country,
                  location: enrichedPerson.city ? `${enrichedPerson.city}, ${enrichedPerson.state}` : r.location,
                  personalEmails: enrichedPerson.personal_emails || [],
                  enriched: true,
                }
              : r
          ),
        }));
        
        // Track credit usage and persist
        get().incrementCreditsUsed(userId, 1);
        
        toast.success('Contact enriched');
        return enrichedPerson;
      }
      
      toast.error('Could not enrich this contact');
      return null;
    } catch (error) {
      console.error('Enrichment error:', error);
      toast.error('Enrichment failed');
      return null;
    }
  },
}));
