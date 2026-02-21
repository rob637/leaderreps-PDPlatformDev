import React from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useProspectsStore } from '../stores/prospectsStore';
import {
  Users,
  UserPlus,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Settings,
  Bell
} from 'lucide-react';

const CommandPalette = () => {
  const navigate = useNavigate();
  const { commandPaletteOpen, closeCommandPalette, openModal } = useUIStore();
  const { setViewMode } = useProspectsStore();

  const runCommand = (callback) => {
    closeCommandPalette();
    callback();
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCommandPalette}
      />
      
      {/* Dialog */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl">
        <Command 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-elevated overflow-hidden animate-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeCommandPalette();
          }}
        >
          <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400" />
            <Command.Input 
              placeholder="Type a command or search..."
              className="flex-1 py-4 text-base outline-none placeholder:text-slate-400 bg-transparent text-slate-900 dark:text-slate-100"
              autoFocus
            />
          </div>
          
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-slate-500 text-sm">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/prospects'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-slate-100"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Go to Prospects</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/apollo'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-slate-100"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Apollo Search</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/tasks'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-slate-100"
              >
                <Bell className="w-4 h-4 text-slate-500" />
                <span>Go to Tasks</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/settings'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-slate-100"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Go to Settings</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item 
                onSelect={() => runCommand(() => openModal('addProspect'))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-slate-100"
              >
                <UserPlus className="w-4 h-4 text-brand-teal" />
                <span>Add New Prospect</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Views">
              <Command.Item 
                onSelect={() => runCommand(() => { navigate('/prospects'); setViewMode('list'); })}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-slate-100"
              >
                <List className="w-4 h-4 text-slate-500" />
                <span>Prospects List View</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => { navigate('/prospects'); setViewMode('kanban'); })}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-slate-100"
              >
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <span>Prospects Pipeline View</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Type to search • ↑↓ to navigate • Enter to select</span>
            <span>Esc to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
