// src/components/screens/AppliedLeadership.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { getCourses } from '../../services/contentService.js';
import { ArrowLeft, BookOpen, ChevronRight, Loader, AlertTriangle, ShieldCheck, Zap, Briefcase, Lightbulb, CheckCircle, X, CornerRightUp, Users, Calendar, Clock } from 'lucide-react';

// --- Standardized UI Components ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#47A88D] text-white shadow-md hover:bg-[#3d917a] focus:ring-[#47A88D]/50",
    secondary: "bg-[#E04E1B] text-white shadow-md hover:bg-[#c44317] focus:ring-[#E04E1B]/50",
    outline: "bg-white text-[#47A88D] border-2 border-[#47A88D] shadow-sm hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    'nav-back': "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 focus:ring-slate-300/50 px-4 py-2 text-sm",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-4 text-lg",
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, className = '', onClick, accentColor = 'bg-[#002E47]' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  
  return (
    <Tag 
      onClick={onClick}
      className={`relative w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${interactive ? 'cursor-pointer hover:scale-[1.01]' : ''} ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />
      <div className="p-6">
        {(Icon || title) && (
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Icon className="w-5 h-5 text-[#002E47]" />
                    </div>
                )}
                {title && (
                    <h2 className="text-xl font-bold text-[#002E47]">{title}</h2>
                )}
            </div>
        )}
        {children}
      </div>
    </Tag>
  );
};

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="min-h-[300px] flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center">
      <Loader className="animate-spin h-12 w-12 mb-3 text-[#47A88D]" />
      <p className="font-semibold text-[#002E47]">{message}</p>
    </div>
  </div>
);

// --- Helper for dynamic colors ---
const getAccentColorClass = (tierIdOrColorKey) => {
    const key = String(tierIdOrColorKey).toUpperCase();
    if (key.includes('ORANGE') || key.includes('AMBER') || key.includes('RED')) return 'bg-[#E04E1B]';
    if (key.includes('TEAL') || key.includes('GREEN') || key.includes('PURPLE')) return 'bg-[#47A88D]';
    return 'bg-[#002E47]'; // Default Navy
};

const getAccentTextClass = (tierIdOrColorKey) => {
    const key = String(tierIdOrColorKey).toUpperCase();
    if (key.includes('ORANGE') || key.includes('AMBER') || key.includes('RED')) return 'text-[#E04E1B]';
    if (key.includes('TEAL') || key.includes('GREEN') || key.includes('PURPLE')) return 'text-[#47A88D]';
    return 'text-[#002E47]';
};

/* =========================================================
   PLACEHOLDER COMPONENTS (Styled Consistently)
========================================================= */

const AICoachingSimulator = ({ item, isCourse = false }) => (
  <Card title={`AI Rep Coach for ${item.title || item.name}`} icon={ShieldCheck} accentColor="bg-[#47A88D]" className="my-8">
    <p className="text-sm text-slate-600 mb-4">Practice applying '{item.title || item.name}' principles in simulated scenarios.</p>
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center text-purple-700 font-medium italic">
      {isCourse ? `Access the dedicated AI Coach for this course's modules.` : `AI Coaching Simulator coming soon...`}
    </div>
  </Card>
);

const ResourceDetailModal = ({ isVisible, onClose, resource, skill }) => {
    if (!isVisible || !resource || !skill) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 overflow-hidden">
                <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-[#002E47]">{resource.title}</h3>
                    <Button onClick={onClose} variant="ghost" size="sm" className="!p-1 text-slate-400 hover:text-red-600 absolute top-3 right-3">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-xs font-semibold uppercase mb-1 text-[#47A88D]">Skill: {skill.name}</p>
                <p className="text-sm text-slate-600 mb-4">{resource.summary || 'Details unavailable.'}</p>
                {resource.type && <p className="text-xs text-slate-500 mb-1">Type: {resource.type}</p>}
                 {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium group">
                        View Resource <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
                    </a>
                 )}
                <Button onClick={onClose} variant="outline" size="sm" className="mt-6 w-full">Close</Button>
            </div>
        </div>
    );
};

const CourseDetailView = ({ course, setCourseDetail }) => {
    const { IconMap, LEADERSHIP_TIERS, navigate } = useAppServices();
    const IconComponent = IconMap?.[course.icon] || ShieldCheck;
    const tierMeta = LEADERSHIP_TIERS?.[course.tier_id];
    const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase() || 'TEAL';
    const accentBgClass = getAccentColorClass(accentColorKey);
    const accentTextClass = getAccentTextClass(accentColorKey);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in">
            <Button onClick={() => setCourseDetail(null)} variant='nav-back' className='mb-6'>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course Library
            </Button>

            <Card accentColor={accentBgClass} className="mb-8">
                 <div className='flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6'>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${accentBgClass} bg-opacity-10`}>
                        {IconComponent && <IconComponent className={`w-8 h-8 ${accentTextClass}`} />}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#002E47]">{course.title}</h1>
                        <p className="text-lg text-slate-600 mt-2">{course.description}</p>
                        
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Duration</span>
                                <p className="font-semibold text-slate-700">{course.duration}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Format</span>
                                <p className="font-semibold text-slate-700">{course.format}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Level</span>
                                <p className="font-semibold text-slate-700">{course.level}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Price</span>
                                <p className={`font-semibold text-lg ${accentTextClass}`}>${course.price}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card title="Enrollment" icon={Users} accentColor="bg-[#47A88D]">
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Enrollment Progress</span>
                                <span className="text-sm font-semibold text-slate-700">{course.currentEnrollment}/{course.maxParticipants}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                    className="h-2 rounded-full bg-[#47A88D]" 
                                    style={{ width: `${(course.currentEnrollment / course.maxParticipants) * 100}%` }}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Start Date:</span>
                                <span className="font-medium text-slate-700">{new Date(course.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">End Date:</span>
                                <span className="font-medium text-slate-700">{new Date(course.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Enrollment Deadline:</span>
                                <span className="font-medium text-red-600">{new Date(course.enrollmentDeadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <Button 
                            variant="primary" 
                            className="w-full mt-4"
                            onClick={() => alert(`Enrollment for ${course.title} - Implementation coming soon!`)}
                        >
                            Enroll Now - ${course.price}
                        </Button>
                    </div>
                </Card>
                
                <Card title="Schedule & Instructor" icon={Calendar} accentColor="bg-[#002E47]">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-[#002E47]">Meeting Times:</h4>
                            <ul className="space-y-1">
                                {course.meetingTimes?.map((time, idx) => (
                                    <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {time}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-[#002E47]">Instructor:</h4>
                            <p className="font-medium text-slate-700">{course.instructor}</p>
                            <p className="text-sm text-slate-600">{course.instructorBio}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-[#002E47]">Prerequisites:</h4>
                            <ul className="space-y-1">
                                {course.prerequisites?.map((prereq, idx) => (
                                    <li key={idx} className="text-sm text-slate-600">• {prereq}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-[#002E47]">Learning Outcomes:</h4>
                            <ul className="space-y-1">
                                {course.learningOutcomes?.map((outcome, idx) => (
                                    <li key={idx} className="text-sm text-slate-600">✓ {outcome}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>

            <AICoachingSimulator item={course} isCourse={true} />

            <Card title="Course Modules" icon={Briefcase} accentColor="bg-[#002E47]" className='mt-8'>
                <div className="space-y-4">
                    {(course.modules || []).map((module, index) => (
                        <div key={module.id || index} className="p-4 rounded-xl border border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-colors">
                            <h3 className="text-lg font-bold flex items-center gap-3 text-[#002E47]">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-extrabold text-white ${accentBgClass}`}>{module.id || index + 1}</span>
                                {module.title}
                            </h3>
                            <details className="my-3 group">
                                <summary className="text-sm font-semibold cursor-pointer list-none flex items-center gap-2 text-[#47A88D]">
                                    <Lightbulb className="w-4 h-4 text-amber-500"/> Rationale: {module.focus}
                                    <span className="text-xs text-slate-400 group-open:rotate-90 transition-transform">▶</span>
                                </summary>
                                <blockquote className="mt-2 border-l-4 border-[#47A88D] pl-4 py-1 text-sm italic text-slate-600">
                                    {module.rationale}
                                </blockquote>
                            </details>

                            <div className='mt-3 pt-3 border-t border-slate-100'>
                                <p className="text-sm font-semibold mb-1 text-[#E04E1B]"><CheckCircle className='w-4 h-4 inline-block mr-1'/> Pre-Work Required:</p>
                                <ul className="list-disc pl-5 text-slate-700 space-y-0.5 text-sm">
                                    {(module.preWork || []).map((item, idx) => (
                                        <li key={idx} className='text-xs'>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            {course.id === 'quickstart_accelerator' && module.id === 2 && (
                                <Button onClick={() => navigate('quick-start-accelerator')} variant="secondary" size="sm" className='mt-4'>
                                    <Zap className="w-4 h-4" /> Go to LIS Auditor Tool
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const SkillDetailView = ({ skill, setSelectedSkill, resourceLibrary, getTierName }) => {
    const [isResourceModalVisible, setIsResourceModalVisible] = useState(false);
    const [currentResource, setCurrentResource] = useState(null);

    const localHandleOpenResource = (resource) => {
        setCurrentResource(resource);
        setIsResourceModalVisible(true);
    };

    const localHandleCloseResource = () => {
        setIsResourceModalVisible(false);
        setTimeout(() => setCurrentResource(null), 300);
    };

    const resources = resourceLibrary?.[skill.skill_id] || [];
    const { IconMap, LEADERSHIP_TIERS } = useAppServices();
    const IconComponent = IconMap?.[skill.icon] || BookOpen;
    const tierMeta = LEADERSHIP_TIERS?.[skill.tier_id];
    const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase();
    const accentBgClass = getAccentColorClass(accentColorKey);
    const accentTextClass = getAccentTextClass(accentColorKey);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in">
            <Button onClick={() => setSelectedSkill(null)} variant='nav-back' className='mb-6'>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course Library
            </Button>

            <Card accentColor={accentBgClass} className="mb-8">
                 <div className='flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6'>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${accentBgClass} bg-opacity-10`}>
                        {IconComponent && <IconComponent className={`w-8 h-8 ${accentTextClass}`} />}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#002E47]">{skill.name}</h1>
                        <p className="text-lg text-slate-600 mt-2">{skill.summary}</p>
                        <p className={`text-xs font-semibold mt-3 px-3 py-1 rounded-full inline-block ${accentBgClass} bg-opacity-10 ${accentTextClass}`}>
                           {getTierName(skill.tier_id)}
                        </p>
                    </div>
                </div>
            </Card>

            <AICoachingSimulator item={skill} isCourse={false} />

            <Card title="Curated Deep Dive Resources" icon={BookOpen} accentColor="bg-[#002E47]" className='mt-8'>
                {resources.length === 0 && (
                    <p className="text-slate-500 italic text-sm text-center py-4">
                        No specific resources linked to this skill yet.
                    </p>
                )}
                <div className="space-y-3">
                    {resources.map((resource, index) => (
                        <button
                            key={resource.resource_id || index}
                            onClick={() => localHandleOpenResource(resource)}
                            className="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition flex justify-between items-center group focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
                        >
                            <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate text-[#002E47]">{resource.title}</p>
                                <p className="text-xs text-slate-500">{resource.type || 'Resource'}</p>
                            </div>
                            <ChevronRight className='w-5 h-5 text-slate-400 flex-shrink-0 ml-2 group-hover:text-[#47A88D] transition-colors'/>
                        </button>
                    ))}
                </div>
            </Card>

            <ResourceDetailModal
                isVisible={isResourceModalVisible}
                onClose={localHandleCloseResource}
                resource={currentResource}
                skill={skill}
            />
        </div>
    );
};

export default function AppliedLeadershipScreen() {
    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    
    const {
        SKILL_CATALOG,
        COURSE_LIBRARY,
        RESOURCE_LIBRARY,
        LEADERSHIP_TIERS,
        IconMap,
        navigate,
        isLoading: isAppLoading,
        error: appError,
        db,
        user,
    } = useAppServices();

    const [selectedSkill, setSelectedSkill] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [cmsCourses, setCmsCourses] = useState([]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [selectedSkill, selectedCourse]);

    useEffect(() => {
        if (!db || isAppLoading) return;
        
        const loadCourses = async () => {
            try {
                const userTier = user?.membershipData?.tier || 'premium';
                const courses = await getCourses(db, userTier);
                setCmsCourses(courses || []);
            } catch (error) {
                console.error('[AppliedLeadership] Error loading CMS courses:', error);
                setCmsCourses([]);
            }
        };
        
        loadCourses();
    }, [db, user, isAppLoading]);

    const safeCourses = useMemo(() => {
        if (isAppLoading) return [];
        
        if (cmsCourses && cmsCourses.length > 0) {
            return cmsCourses.map(course => ({
                id: course.id,
                title: course.title || 'Untitled',
                description: course.description || '',
                category: course.category || 'Leadership',
                tier: course.tier || 'professional',
                instructor: course.metadata?.instructor || '',
                duration: course.metadata?.duration || '',
                level: course.metadata?.level || '',
                modules: [],
                isActive: course.isActive !== false,
            }));
        }
        return [];
    }, [cmsCourses, isAppLoading]);

    const handleSelectSkill = useCallback((skill) => {
        setSelectedCourse(null);
        setSelectedSkill(skill);
    }, []);

    const handleSelectCourse = useCallback((course) => {
        setSelectedSkill(null);
        setSelectedCourse(course);
    }, []);

    const handleOpenResource = useCallback((resource) => {
        setSelectedResource(resource);
        setIsModalVisible(true);
    }, []);

    const handleCloseResource = useCallback(() => {
        setIsModalVisible(false);
        setTimeout(() => setSelectedResource(null), 300);
    }, []);

    const getTierName = useCallback((tierId) => {
        return LEADERSHIP_TIERS?.[tierId]?.name || `Tier ${tierId}`;
    }, [LEADERSHIP_TIERS]);

    const renderLibraryHome = () => (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-fade-in">
            <Button onClick={() => navigate('library')} variant="nav-back" size="sm" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
            </Button>
            
            <div className='flex items-center gap-4 border-b border-slate-200 pb-4 mb-8'>
                <ShieldCheck className='w-10 h-10 text-[#002E47]'/>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#002E47]">Course Library</h1>
            </div>
            <p className="text-lg text-slate-600 mb-10 max-w-3xl">
                Explore leadership skills, access curated resources, practice with AI coaching, and build mastery through focused reps. <strong className="text-[#002E47]">Practice over theory.</strong>
            </p>

            {isAppLoading && <LoadingSpinner message="Loading course library..." />}
            {!isAppLoading && appError && (
                 <div className="text-red-600 italic text-center py-10 bg-red-50 p-4 rounded-xl border border-red-200 max-w-2xl mx-auto flex items-center justify-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-red-500"/>
                     <span>Error loading library: {appError.message}. Please try again later.</span>
                 </div>
            )}

            {safeCourses.length > 0 && (
                <section className='mb-12'>
                    <h2 className='text-2xl font-bold mb-6 border-l-4 border-[#E04E1B] pl-3 flex items-center gap-2 text-[#002E47]'>
                        <Zap className='w-6 h-6 text-[#E04E1B]'/> Programs & Courses
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {safeCourses.map((course) => {
                            const IconComponent = IconMap?.[course.icon] || Briefcase;
                            const accentColorKey = (course.tier_id ? LEADERSHIP_TIERS?.[course.tier_id]?.color?.split('-')[0].toUpperCase() : null) || 'ORANGE';
                            const accentBgClass = getAccentColorClass(accentColorKey);
                            const accentTextClass = getAccentTextClass(accentColorKey);
                            const moduleCount = course.modules?.length || 0;

                            return (
                                <button
                                    key={course.id}
                                    onClick={() => handleSelectCourse(course)}
                                    className="text-left block w-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E04E1B] rounded-2xl"
                                >
                                    <div className={`p-6 rounded-2xl border border-slate-200 shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl h-full flex flex-col bg-white`}>
                                        <div className='flex items-center space-x-3 mb-4'>
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${accentBgClass} bg-opacity-10`}>
                                                {IconComponent && <IconComponent className={`w-6 h-6 ${accentTextClass}`} />}
                                            </div>
                                            <h2 className="text-lg font-extrabold flex-1 text-[#002E47] leading-tight">{course.title}</h2>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-4 flex-grow line-clamp-3">{course.description}</p>
                                        
                                        <div className="space-y-2 mb-4 border-t border-slate-100 pt-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Duration:</span>
                                                <span className="font-medium text-slate-700">{course.duration}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Format:</span>
                                                <span className="font-medium text-slate-700">{course.format}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Starts:</span>
                                                <span className="font-medium text-slate-700">{new Date(course.startDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">Enrollment:</span>
                                                <span className="font-medium text-slate-700">{course.currentEnrollment}/{course.maxParticipants}</span>
                                            </div>
                                        </div>
                                        
                                        <div className='mt-auto pt-3 border-t border-slate-100'>
                                            <div className='flex justify-between items-center'>
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-semibold uppercase ${accentTextClass}`}>
                                                        {moduleCount} Module{moduleCount !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className='text-sm font-bold text-[#002E47]'>
                                                        ${course.price}
                                                    </span>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 ${accentTextClass}`}/>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {!isAppLoading && !appError && safeCourses.length === 0 && (
                 <div className="text-slate-500 italic text-center py-10 bg-slate-100 p-4 rounded-xl border border-slate-200 max-w-2xl mx-auto flex items-center justify-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-orange-500"/>
                     <span>The Course Library appears to be empty. Please contact an administrator.</span>
                 </div>
            )}
        </div>
    );

    return (
        <div className='min-h-screen bg-slate-50'>
            {selectedCourse ? (
                <CourseDetailView course={selectedCourse} setCourseDetail={setSelectedCourse} />
            ) : selectedSkill ? (
                 <SkillDetailView
                    skill={selectedSkill}
                    setSelectedSkill={setSelectedSkill}
                    resourceLibrary={RESOURCE_LIBRARY}
                    getTierName={getTierName}
                    handleOpenResource={handleOpenResource}
                 />
            ) : (
                renderLibraryHome()
            )}

            <ResourceDetailModal
                isVisible={isModalVisible}
                onClose={handleCloseResource}
                resource={selectedResource}
                skill={selectedSkill || {}}
            />
        </div>
    );
}
