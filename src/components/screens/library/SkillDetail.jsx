import { ContentListItem } from '../../ui/ContentListItem.jsx';

const SkillDetail = (props) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [skill, setSkill] = useState(null);
  const [relatedContent, setRelatedContent] = useState({
    programs: [],
    workouts: [],
    readReps: [],
    tools: [],
    videos: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  
  // Handle both direct props (from spread) and navParams prop (legacy/wrapper)
  const skillId = props.id || props.navParams?.id;

  useEffect(() => {
    const fetchSkillData = async () => {
      if (!skillId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Skill Details
        const skillRef = doc(db, UNIFIED_COLLECTION, skillId);
        const skillSnap = await getDoc(skillRef);
        
        if (skillSnap.exists()) {
          setSkill({ id: skillSnap.id, ...skillSnap.data() });
          
          // 2. Fetch Related Content
          const contentRef = collection(db, UNIFIED_COLLECTION);
          const q = query(
            contentRef, 
            where('skills', 'array-contains', skillId),
            where('status', '==', 'PUBLISHED')
          );
          
          const contentSnap = await getDocs(q);
          const allContent = contentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Group by type
          setRelatedContent({
            programs: allContent.filter(c => c.type === 'PROGRAM'),
            workouts: allContent.filter(c => c.type === 'WORKOUT'),
            readReps: allContent.filter(c => c.type === 'READ_REP'),
            tools: allContent.filter(c => c.type === 'TOOL'),
            videos: allContent.filter(c => c.type === 'VIDEO'),
            documents: allContent.filter(c => c.type === 'DOCUMENT')
          });
        }
      } catch (error) {
        console.error("Error fetching skill details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillData();
  }, [db, skillId]);

  if (loading) {
    return (
      <PageLayout title="Loading Skill..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!skill) {
    return (
      <PageLayout title="Skill Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600">The requested skill could not be found.</p>
          <Button onClick={() => navigate('skills-index')} className="mt-4">
            Back to Skills
          </Button>
        </div>
      </PageLayout>
    );
  }

  const ContentSection = ({ title, items, icon: Icon, route, color, bgColor }) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-corporate-navy mb-4 flex items-center gap-2">
          <Icon className="w-5 h-5 text-corporate-teal" />
          {title}
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs ml-2">
            {items.length}
          </span>
        </h3>
        
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const isUnlocked = isContentUnlocked(item);
            
            return (
              <ContentListItem 
                key={item.id}
                {...item}
                icon={Icon}
                isUnlocked={isUnlocked}
                color={color}
                bgColor={bgColor}
                onClick={() => {
                  if (isUnlocked) {
                    navigate(route, { id: item.id, title: item.title });
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <PageLayout 
      title={skill.name} 
      subtitle={skill.description}
      icon={Zap}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Skills', path: 'skills-index' },
        { label: skill.name, path: null }
      ]}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Skill Header Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl border border-indigo-100 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-1">About this Skill</h2>
              <p className="text-indigo-800/80 text-sm leading-relaxed">
                {skill.longDescription || skill.description || "Mastering this skill is essential for effective leadership."}
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-2">
          <ContentSection 
            title="Programs" 
            items={relatedContent.programs} 
            icon={PlayCircle} 
            route="program-detail"
            color="text-corporate-navy"
            bgColor="bg-corporate-navy/10"
          />
          
          <ContentSection 
            title="Workouts" 
            items={relatedContent.workouts} 
            icon={Video} 
            route="workout-detail"
            color="text-corporate-teal"
            bgColor="bg-corporate-teal/10"
          />
          
          <ContentSection 
            title="Read & Reps" 
            items={relatedContent.readReps} 
            icon={BookOpen} 
            route="read-rep-detail"
            color="text-corporate-navy"
            bgColor="bg-corporate-navy/10"
          />
          
          <ContentSection 
            title="Videos" 
            items={relatedContent.videos} 
            icon={Film} 
            route="video-detail"
            color="text-corporate-orange"
            bgColor="bg-corporate-orange/10"
          />

          <ContentSection 
            title="Tools" 
            items={relatedContent.tools} 
            icon={FileText} 
            route="tool-detail"
            color="text-corporate-teal"
            bgColor="bg-corporate-teal/10"
          />

          <ContentSection 
            title="Documents" 
            items={relatedContent.documents} 
            icon={FileText} 
            route="document-detail"
            color="text-slate-600"
            bgColor="bg-slate-100"
          />
          
          {/* Empty State */}
          {Object.values(relatedContent).every(arr => arr.length === 0) && (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Content Yet</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                We haven't tagged any content with this skill yet. Check back soon as we update our library.
              </p>
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  );
};

export default SkillDetail;