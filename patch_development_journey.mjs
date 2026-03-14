import fs from 'fs';

const filePath = 'src/components/widgets/DevelopmentJourneyWidget.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCheck = `        // Check for conditioning-rep items - use loopClosedRepTypes
        if (a.handlerType === 'conditioning-rep' && a.repTypeId) {
          const isCompleted = loopClosedRepTypes.includes(a.repTypeId);
          return { ...a, isCompleted };
        }`;

const newCheck = `        // Check for conditioning-rep items - use loopClosedRepTypes
        if (a.handlerType === 'conditioning-rep' && a.repTypeId) {
          const isCompleted = loopClosedRepTypes.includes(a.repTypeId);
          return { ...a, isCompleted };
        }
        
        // Check for conditioning-tutorial
        if (a.handlerType === 'conditioning-tutorial' || (a.label || '').toLowerCase().includes('conditioning tutorial')) {
          const isCompleted = user?.conditioningTutorial?.completed === true || user?.prepStatus?.conditioningTutorial === true;
          return { ...a, isCompleted };
        }`;

if (content.includes(oldCheck)) {
  content = content.replace(oldCheck, newCheck);
  fs.writeFileSync(filePath, content);
  console.log('Successfully patched DevelopmentJourneyWidget.jsx (milestones)');
} else {
  console.error('Could not find string in DevelopmentJourneyWidget.jsx');
}

// Don't forget the main post segment
const postOldCheck = `      const mainPostActionsWithStatus = mainPostActions.map(a => {
        const progress = getItemProgress(a.id);
        const isCompleted = progress.status === 'completed' || completedItems.has(a.id);
        return { ...a, isCompleted };
      });`;

const postNewCheck = `      const mainPostActionsWithStatus = mainPostActions.map(a => {
        const progress = getItemProgress(a.id);
        
        // Check for conditioning-tutorial
        if (a.handlerType === 'conditioning-tutorial' || (a.label || '').toLowerCase().includes('conditioning tutorial')) {
          const isCompleted = user?.conditioningTutorial?.completed === true || user?.prepStatus?.conditioningTutorial === true;
          return { ...a, isCompleted };
        }
        
        const isCompleted = progress.status === 'completed' || completedItems.has(a.id);
        return { ...a, isCompleted };
      });`;

if (content.includes(postOldCheck)) {
  content = content.replace(postOldCheck, postNewCheck);
  fs.writeFileSync(filePath, content);
  console.log('Successfully patched DevelopmentJourneyWidget.jsx (post phase)');
}

