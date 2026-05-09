import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  HelpCircle, Search, BookOpen, Users, Settings, Zap, Target, 
  ChevronRight, ArrowLeft, Mail, MessageCircle, Clock, 
  ThumbsUp, ThumbsDown, ExternalLink, Sparkles, Compass,
  Play, FileText, Shield, CreditCard, Bell, Smartphone,
  TrendingUp, Award, BarChart3, Calendar, CheckCircle2,
  Lightbulb, Heart, RefreshCw, ArrowRight, Star, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../../../providers/NavigationProvider.jsx';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';

// ============================================================================
// HELP CENTER DATA - Comprehensive knowledge base
// ============================================================================

import { HELP_ARTICLES, POPULAR_ARTICLE_IDS } from './helpCenterContent.js';

// Flatten articles for search
const ALL_ARTICLES = Object.values(HELP_ARTICLES).flatMap(category => 
  category.articles.map(article => ({
    ...article,
    category: category.category,
    categoryId: category.categoryId,
    categoryIcon: category.icon,
    categoryColor: category.color
  }))
);

// Featured articles for homepage
const FEATURED_ARTICLES = ALL_ARTICLES.filter(a => a.featured);

// Popular articles (could be dynamic based on analytics)
const POPULAR_ARTICLES = ALL_ARTICLES.filter(a => POPULAR_ARTICLE_IDS.includes(a.id));

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const colorClasses = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  teal: 'bg-corporate-teal/10 text-corporate-teal-ink'
};

const iconBgClasses = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/50',
  blue: 'bg-blue-100 dark:bg-blue-900/50',
  purple: 'bg-purple-100 dark:bg-purple-900/50',
  amber: 'bg-amber-100 dark:bg-amber-900/50',
  pink: 'bg-pink-100 dark:bg-pink-900/50',
  orange: 'bg-orange-100 dark:bg-orange-900/50',
  slate: 'bg-slate-200 dark:bg-slate-600',
  red: 'bg-red-100 dark:bg-red-900/50',
  teal: 'bg-corporate-teal/20'
};

// Highlight search matches in text
const HighlightText = ({ text, query }) => {
  const safeText = text == null ? '' : String(text);
  if (!query || !query.trim()) return <>{safeText}</>;
  if (!safeText) return null;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = safeText.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// Category icon component
const CategoryIcon = ({ icon: Icon, color = 'teal', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  const safeColor = colorClasses[color] ? color : 'teal';
  return (
    <div className={`${sizeClasses[size]} ${iconBgClasses[safeColor]} rounded-xl flex items-center justify-center`}>
      <Icon className={`${iconSizes[size]} ${colorClasses[safeColor].split(' ').slice(1).join(' ')}`} />
    </div>
  );
};

// ============================================================================
// SEARCH COMPONENT
// ============================================================================

const SearchBar = ({ value, onChange, onClear, onFocus, onBlur, showResults, placeholder = "Search for help..." }) => {
  const inputRef = useRef(null);
  
  return (
    <div className="relative w-full">
      <div className={`relative flex items-center transition-all duration-200 ${
        showResults 
          ? 'bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl border border-slate-200 dark:border-slate-700 border-b-0' 
          : 'bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl'
      }`}>
        <Search className="absolute left-5 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full py-4 pl-14 pr-12 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 
            focus:outline-none text-lg rounded-2xl"
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

// Search Results dropdown
const SearchResults = ({ query, results, onSelect, onClose }) => {
  if (!results.length) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-b-2xl shadow-xl border border-slate-200 dark:border-slate-700 border-t-0 p-6 z-50">
        <div className="text-center py-4">
          <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No results found for "{query}"</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
            Try different keywords or browse categories below
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-b-2xl shadow-xl border border-slate-200 dark:border-slate-700 border-t-0 max-h-96 overflow-y-auto z-50">
      <div className="p-2">
        <div className="text-xs uppercase tracking-wider text-slate-400 px-3 py-2">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </div>
        {results.slice(0, 8).map(article => (
          <button
            key={article.id}
            onClick={() => onSelect(article)}
            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
          >
            <CategoryIcon icon={article.categoryIcon} color={article.categoryColor} size="sm" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 dark:text-white truncate">
                <HighlightText text={article.title} query={query} />
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                <HighlightText text={article.summary} query={query} />
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CATEGORY CARD COMPONENT
// ============================================================================

const CategoryCard = ({ category, onClick }) => {
  const Icon = category.icon;
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-left shadow-sm border border-slate-200 dark:border-slate-700 
        hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all group w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <CategoryIcon icon={Icon} color={category.color} size="lg" />
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 
          group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {category.category}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {category.description}
      </p>
      <div className="text-xs text-slate-400 dark:text-slate-500">
        {category.articles.length} article{category.articles.length !== 1 ? 's' : ''}
      </div>
    </motion.button>
  );
};

// ============================================================================
// ARTICLE CARD COMPONENT
// ============================================================================

const ArticleCard = ({ article, onClick, showCategory = false, searchQuery = '' }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 
        transition-colors text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
    >
      <div className="flex-shrink-0 mt-0.5">
        <CategoryIcon icon={article.categoryIcon || BookOpen} color={article.categoryColor || 'teal'} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-corporate-teal-ink transition-colors">
          <HighlightText text={article.title} query={searchQuery} />
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
          <HighlightText text={article.summary} query={searchQuery} />
        </p>
        {showCategory && (
          <span className="inline-block mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {article.category}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
        <Clock className="w-3.5 h-3.5" />
        {article.readTime} min
      </div>
    </motion.button>
  );
};

// ============================================================================
// ARTICLE VIEW COMPONENT
// ============================================================================

const ArticleView = ({ article, onBack, onArticleSelect }) => {
  const [feedback, setFeedback] = useState(null);
  
  // Get related articles
  const relatedArticles = article.relatedArticles 
    ? ALL_ARTICLES.filter(a => article.relatedArticles.includes(a.id))
    : [];
  
  // Simple markdown-like rendering for content
  const renderContent = (content) => {
    if (!content) return null;
    
    const lines = content.trim().split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-4 space-y-2">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };
    
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // H2 Headers
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={idx} className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
            {trimmed.replace('## ', '')}
          </h2>
        );
        return;
      }
      
      // H3 Headers
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">
            {trimmed.replace('### ', '')}
          </h3>
        );
        return;
      }
      
      // H4 Headers
      if (trimmed.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={idx} className="text-base font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-2">
            {trimmed.replace('#### ', '')}
          </h4>
        );
        return;
      }
      
      // List items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        const text = trimmed.replace(/^[-*] /, '');
        // Handle checkmarks
        if (text.startsWith('✅') || text.startsWith('⚙️') || text.startsWith('❌')) {
          listItems.push(
            <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
              <span className="flex-shrink-0">{text.charAt(0)}</span>
              <span>{renderInlineFormatting(text.slice(2))}</span>
            </li>
          );
        } else {
          listItems.push(
            <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-corporate-teal mt-2 flex-shrink-0" />
              <span>{renderInlineFormatting(text)}</span>
            </li>
          );
        }
        return;
      }
      
      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        inList = true;
        const num = trimmed.match(/^(\d+)\./)[1];
        const text = trimmed.replace(/^\d+\.\s/, '');
        listItems.push(
          <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center 
              text-xs font-medium text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5">
              {num}
            </span>
            <span>{renderInlineFormatting(text)}</span>
          </li>
        );
        return;
      }
      
      // Paragraphs
      if (trimmed.length > 0) {
        flushList();
        elements.push(
          <p key={idx} className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      } else {
        flushList();
      }
    });
    
    flushList();
    return elements;
  };
  
  // Handle inline formatting (bold, emoji indicators)
  const renderInlineFormatting = (text) => {
    if (text == null) return null;
    const safeText = String(text);
    // Handle bold text
    const parts = safeText.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-slate-900">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-corporate-teal-ink 
            transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Help Center</span>
        </button>
        
        {/* Article header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CategoryIcon icon={article.categoryIcon || BookOpen} color={article.categoryColor || 'teal'} />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {article.title}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            {article.summary}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.readTime} min read
            </span>
          </div>
        </div>
        
        {/* Article content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          {renderContent(article.content)}
        </article>
        
        {/* Feedback section */}
        <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            Was this article helpful?
          </h3>
          {feedback === null ? (
            <div className="flex gap-3">
              <button
                onClick={() => setFeedback('yes')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 
                  hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 
                  hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => setFeedback('no')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 
                  hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 
                  hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Thanks for your feedback!</span>
            </div>
          )}
        </div>
        
        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Related Articles
            </h3>
            <div className="space-y-2">
              {relatedArticles.map(related => (
                <ArticleCard
                  key={related.id}
                  article={related}
                  onClick={() => onArticleSelect(related)}
                  showCategory
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Contact support */}
        <div className="mt-8 p-6 bg-gradient-to-br from-corporate-navy to-slate-800 rounded-2xl text-white">
          <h3 className="font-semibold text-lg mb-2">Still need help?</h3>
          <p className="text-slate-300 mb-4">
            Our support team is ready to assist you.
          </p>
          <a
            href="mailto:team@leaderreps.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-corporate-teal rounded-xl font-medium 
              hover:bg-corporate-teal/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CATEGORY VIEW COMPONENT
// ============================================================================

const CategoryView = ({ category, onBack, onArticleSelect }) => {
  const Icon = category.icon;
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-slate-900">
      <div className="max-w-3xl mx-auto p-5 sm:p-8">
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-corporate-teal-ink 
            transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Help Center</span>
        </button>
        
        {/* Category header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <CategoryIcon icon={Icon} color={category.color} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {category.category}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {category.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Articles list */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {category.articles.map(article => (
            <ArticleCard
              key={article.id}
              article={{
                ...article,
                categoryIcon: Icon,
                categoryColor: category.color
              }}
              onClick={() => onArticleSelect(article)}
            />
          ))}
        </div>
        
        {/* Contact support */}
        <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <Lightbulb className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Can't find what you're looking for?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
            Contact our support team for personalized help.
          </p>
          <a
            href="mailto:team@leaderreps.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-corporate-teal text-white rounded-xl font-medium 
              hover:bg-corporate-teal/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HOME VIEW COMPONENT
// ============================================================================

const HomeView = ({ onCategorySelect, onArticleSelect, searchQuery, setSearchQuery, onAskRepUp }) => {
  const { navigate } = useNavigation();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
  
  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = ALL_ARTICLES.filter(article => 
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.content?.toLowerCase().includes(query)
    );
    
    // Sort by relevance (title matches first)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query);
      const bTitle = b.title.toLowerCase().includes(query);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });
    
    setSearchResults(results);
  }, [searchQuery]);
  
  const showResults = searchFocused && searchQuery.trim().length > 0;
  const categories = Object.values(HELP_ARTICLES);
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-slate-900">
      {/* Breadcrumb Header */}
      <div className="bg-[#FAFBFC] dark:bg-slate-900 px-5 sm:px-8 lg:px-10 pt-5 sm:pt-8 lg:pt-10">
        <div className="max-w-5xl mx-auto">
          <BreadcrumbNav 
            items={[
              { label: 'Dashboard', path: 'dashboard' },
              { label: 'Help Center', path: null }
            ]} 
            navigate={navigate}
          />
        </div>
      </div>
      
      {/* Page Header - consistent with other pages */}
      <div className="px-5 sm:px-8 lg:px-10 pt-6 pb-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center gap-3 justify-center mb-2">
            <HelpCircle className="w-7 h-7 text-corporate-teal" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-corporate-navy dark:text-white tracking-tight">
              Help Center
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base mb-6">
            Search our knowledge base or browse categories below
          </p>
          
          {/* Search */}
          <div
            ref={searchRef}
            className="relative max-w-2xl mx-auto"
          >
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {}}
              showResults={showResults}
            />
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <SearchResults
                    query={searchQuery}
                    results={searchResults}
                    onSelect={(article) => {
                      onArticleSelect(article);
                      setSearchFocused(false);
                    }}
                    onClose={() => setSearchFocused(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-5 pt-4">
        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Popular Articles</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {POPULAR_ARTICLES.map(article => (
              <button
                key={article.id}
                onClick={() => onArticleSelect(article)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 
                  transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-corporate-teal-ink transition-colors truncate">
                  {article.title}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
        
        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Compass className="w-5 h-5 text-corporate-teal" />
            Browse by Category
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() => onCategorySelect(category)}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 
            rounded-2xl p-8 mb-12 border border-slate-200 dark:border-slate-700"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Need more help?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Our team is available to answer your questions
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a
              href="mailto:team@leaderreps.com"
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 
                dark:border-slate-700 hover:border-corporate-teal dark:hover:border-corporate-teal 
                transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-corporate-teal/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-corporate-teal" />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white group-hover:text-corporate-teal-ink transition-colors">
                  Email Support
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  team@leaderreps.com
                </div>
              </div>
            </a>
            
            <button
              onClick={onAskRepUp}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 
                dark:border-slate-700 hover:border-corporate-teal dark:hover:border-corporate-teal 
                transition-all group w-full text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white group-hover:text-corporate-teal-ink transition-colors">
                  Ask RepUp
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  AI coaching assistant
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN HELP CENTER COMPONENT
// ============================================================================

const HelpCenter = () => {
  const { navigate } = useNavigation();
  const [view, setView] = useState('home'); // 'home' | 'category' | 'article'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAskRepUp = useCallback(() => {
    navigate('rep-coach', { mode: 'help' });
  }, [navigate]);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    setView('category');
    window.scrollTo(0, 0);
  }, []);

  const handleArticleSelect = useCallback((article) => {
    // Ensure article has full data
    const fullArticle = ALL_ARTICLES.find(a => a.id === article.id) || article;
    setSelectedArticle(fullArticle);
    setView('article');
    setSearchQuery('');
    window.scrollTo(0, 0);
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'article' && selectedCategory) {
      setView('category');
    } else {
      setView('home');
      setSelectedCategory(null);
      setSelectedArticle(null);
    }
    window.scrollTo(0, 0);
  }, [view, selectedCategory]);

  return (
    <AnimatePresence mode="wait">
      {view === 'home' && (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <HomeView
            onCategorySelect={handleCategorySelect}
            onArticleSelect={handleArticleSelect}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAskRepUp={handleAskRepUp}
          />
        </motion.div>
      )}
      
      {view === 'category' && selectedCategory && (
        <motion.div
          key="category"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CategoryView
            category={selectedCategory}
            onBack={handleBack}
            onArticleSelect={(article) => {
              handleArticleSelect({
                ...article,
                categoryIcon: selectedCategory.icon,
                categoryColor: selectedCategory.color,
                category: selectedCategory.category
              });
            }}
          />
        </motion.div>
      )}
      
      {view === 'article' && selectedArticle && (
        <motion.div
          key="article"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ArticleView
            article={selectedArticle}
            onBack={handleBack}
            onArticleSelect={handleArticleSelect}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HelpCenter;
