import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProspectsStore, PIPELINE_STAGES } from '../../stores/prospectsStore';
import { TEAM_MEMBERS, getStageInfo } from '../../config/team';
import { Building2, User, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';

// Individual prospect card for Kanban
const ProspectCard = ({ prospect, isDragging = false }) => {
  const { setSelectedProspect } = useProspectsStore();
  const ownerMember = TEAM_MEMBERS.find(
    m => m.email.toLowerCase() === (prospect.owner || prospect.ownerEmail)?.toLowerCase()
  );

  return (
    <div
      onClick={() => !isDragging && setSelectedProspect(prospect)}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-pointer hover:shadow-card transition ${
        isDragging ? 'shadow-elevated opacity-90' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
          {prospect.firstName ? `${prospect.firstName} ${prospect.lastName || ''}`.trim() : prospect.name || 'Unnamed'}
        </p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {prospect.linkedin && (
            <a
              href={prospect.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-0.5 rounded hover:bg-[#0077b5]/10 text-[#0077b5] transition"
              title="View LinkedIn Profile"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {ownerMember && (
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: ownerMember.color }}
              title={ownerMember.name}
            >
              {ownerMember.initials}
            </div>
          )}
        </div>
      </div>
      
      {prospect.company && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{prospect.company}</span>
        </div>
      )}
      
      {prospect.title && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <User className="w-3 h-3" />
          <span className="truncate">{prospect.title}</span>
        </div>
      )}
      
      {prospect.value && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-brand-teal">
            ${prospect.value.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

// Sortable wrapper for drag-and-drop
const SortableProspectCard = ({ prospect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProspectCard prospect={prospect} isDragging={isDragging} />
    </div>
  );
};

// Single Kanban column
const KanbanColumn = ({ stage, prospects }) => {
  const stageInfo = getStageInfo(stage.id);

  return (
    <div className="flex-shrink-0 w-72 flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stageInfo.color }}
          />
          <span className="font-medium text-sm text-slate-900">{stage.label}</span>
          <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {prospects.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto bg-slate-100/50 rounded-lg p-2 space-y-2">
        <SortableContext
          items={prospects.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {prospects.map((prospect) => (
            <SortableProspectCard key={prospect.id} prospect={prospect} />
          ))}
        </SortableContext>
        
        {prospects.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400">
            No prospects
          </div>
        )}
      </div>
    </div>
  );
};

const ProspectsKanban = ({ prospects }) => {
  const { updateProspectStage } = useProspectsStore();
  const [activeId, setActiveId] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Group prospects by stage
  const prospectsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = prospects.filter(p => p.stage === stage.id);
    return acc;
  }, {});

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeProspect = prospects.find(p => p.id === active.id);
    if (!activeProspect) return;

    // Find the target stage based on where it was dropped
    // The over.id could be another prospect or the column itself
    let targetStage = null;
    
    // Check if dropped over another prospect
    const overProspect = prospects.find(p => p.id === over.id);
    if (overProspect) {
      targetStage = overProspect.stage;
    } else {
      // Dropped over empty column area - determine stage from over.id
      targetStage = over.id;
    }

    // If stage changed, update it
    if (targetStage && targetStage !== activeProspect.stage) {
      try {
        await updateProspectStage(activeProspect.id, targetStage);
        const stageInfo = getStageInfo(targetStage);
        toast.success(`Moved to ${stageInfo.label}`);
      } catch (error) {
        toast.error('Failed to update stage');
      }
    }
  };

  const activeProspect = activeId ? prospects.find(p => p.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            prospects={prospectsByStage[stage.id] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProspect && <ProspectCard prospect={activeProspect} isDragging />}
      </DragOverlay>
    </DndContext>
  );
};

export default ProspectsKanban;
