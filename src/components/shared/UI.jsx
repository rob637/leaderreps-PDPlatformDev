import React, { useState } from 'react';
import { Home, Zap, HeartPulse, BookOpen, Users, Settings, Briefcase, TrendingUp } from 'lucide-react';
import { useAppServices } from '../../App'; // Import App Context
import { IconMap } from '../../data/Constants'; // Import all icons

// --- Tooltip Component ---
export const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-10 w-64 p-3 -mt-2 -ml-32 text-xs text-white bg-[#002E47] rounded-lg shadow-lg bottom-full left-1/2 transform translate-x-1/2">
                    {content}
                    {/* Triangle pointer */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#002E47]"></div>
                </div>
            )}
        </div>
    );
};

// --- Button Component ---
export const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white";

    if (variant === 'primary') {
        baseStyle += " bg-[#47A88D] hover:bg-[#349881] focus:ring-[#47A88D]/50";
    } else if (variant === 'secondary') {
        baseStyle += " bg-[#E04E1B] hover:bg-red-700 focus:ring-[#E04E1B]/50";
    } else if (variant === 'outline') {
        baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[#47A88D] text-[#47A88D] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[#47A88D]/50 bg-[#FCFCFA]";
    }

    if (disabled) {
        baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none";
    }

    return (
        <button
            {...rest}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${className}`}
        >
            {children}
        </button>
    );
};

// --- Card Component ---
export const Card = ({ children, title, icon: IconKey, className = '', onClick }) => {
    const interactive = !!onClick;
    const Icon = IconKey ? IconMap[IconKey] : null;

    const handleKeyDown = (e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={handleKeyDown}
            className={`bg-[#FCFCFA] p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 ${interactive ? 'cursor-pointer hover:border-[#002E47] border-2 border-transparent' : ''} ${className}`}
            onClick={onClick}
        >
            {Icon && <Icon className="w-8 h-8 text-[#47A88D] mb-4" />}
            {title && <h2 className="text-xl font-bold text-[#002E47] mb-2">{title}</h2>}
            {children}
        </div>
    );
};

// --- NavItem Component ---
export const NavItem = ({ name, icon: Icon, currentScreen, onClick }) => {
    const isActive = currentScreen === name;
    const baseStyle = "w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-all duration-200";
    const activeStyle = "bg-[#47A88D]/20 text-[#47A88D] font-semibold shadow-inner";
    const inactiveStyle = "text-indigo-300 hover:bg-[#002E47]/70 hover:text-white"; 

    const displayName = name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
        <button
            type="button"
            className={`${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
            onClick={() => onClick(name)}
            aria-current={isActive ? 'page' : undefined}
        >
            <Icon className="w-5 h-5" />
            <span className="text-sm">{displayName}</span>
        </button>
    );
};

// --- NavSidebar Component ---
const NavSidebar = ({ currentScreen, setCurrentScreen, user }) => {
    const mainNav = [
        { name: 'dashboard', icon: Home, label: 'Dashboard' },
    ];
    const quickStartNav = [
        { name: 'quick-start-accelerator', icon: Zap, label: 'QuickStart Accelerator' },
    ];
    const toolNav = [
        { name: 'prof-dev-plan', icon: Briefcase, label: 'Prof Dev Plan' },
        { name: 'daily-practice', icon: Clock, label: 'Daily Practice & Scorecard' },
        { name: 'business-readings', icon: BookOpen, label: 'Leadership Readings' },
        { name: 'coaching-lab', icon: Mic, label: 'Coaching & Crucial Labs' },
        { name: 'planning-hub', icon: TrendingUp, label: 'Strategic Planning Hub' },
    ];
    const appNav = [
        { name: 'app-settings', icon: Settings, label: 'App Settings' },
    ];

    return (
        <div className="w-64 bg-[#002E47] text-white flex-shrink-0 p-6 flex flex-col h-full rounded-tr-3xl rounded-br-3xl shadow-2xl">
            <div className="flex items-center space-x-2 mb-10">
                <Zap className="w-7 h-7 text-[#47A88D]" />
                <h1 className="text-xl font-bold">LeaderReps</h1>
            </div>

            <nav className="flex-1 space-y-4">
                <div className='space-y-2'>
                    <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>Core Navigation</p>
                    {mainNav.map(item => (
                        <NavItem
                            key={item.name}
                            name={item.name}
                            icon={item.icon}
                            currentScreen={currentScreen}
                            onClick={setCurrentScreen}
                        />
                    ))}
                </div>
                
                <div className='pt-4 border-t border-indigo-700 space-y-2'>
                    <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>QuickStart</p>
                    {quickStartNav.map(item => (
                        <NavItem
                            key={item.name}
                            name={item.name}
                            icon={item.icon}
                            currentScreen={currentScreen}
                            onClick={setCurrentScreen}
                        />
                    ))}
                </div>

                <div className='pt-4 border-t border-indigo-700 space-y-2'>
                    <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>Tools & Labs</p>
                    {toolNav.map(item => (
                        <NavItem
                            key={item.name}
                            name={item.name}
                            icon={item.icon}
                            currentScreen={currentScreen}
                            onClick={setCurrentScreen}
                        />
                    ))}
                </div>

                <div className='pt-4 border-t border-indigo-700 space-y-2'>
                    <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>User/App</p>
                    {appNav.map(item => (
                        <NavItem
                            key={item.name}
                            name={item.name}
                            icon={item.icon}
                            currentScreen={currentScreen}
                            onClick={setCurrentScreen}
                        />
                    ))}
                </div>
            </nav>

            <div className="mt-8 pt-4 border-t border-indigo-700">
                <p className="text-sm font-semibold text-indigo-300">Logged in as:</p>
                <p className="text-sm text-white font-medium">{user?.name || 'Guest'}</p>
                <p className="text-xs text-indigo-400 mt-1 break-words">UID: {user?.userId || 'N/A'}</p>
            </div>
        </div>
    );
};

export default NavSidebar; // Exporting NavSidebar as default for AppContent
