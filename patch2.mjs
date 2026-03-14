import fs from 'fs';

const filePath = 'src/components/widgets/DevelopmentJourneyWidget.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCheck = `    if (handlerType === 'baseline-assessment' || labelLower.includes('baseline assessment') || labelLower.includes('skills baseline')) {
      return baselineAssessmentComplete;
    }`;

const newCheck = `    if (handlerType === 'baseline-assessment' || labelLower.includes('baseline assessment') || labelLower.includes('skills baseline')) {
      return baselineAssessmentComplete;
    }
    // Conditioning Tutorial
    if (handlerType === 'conditioning-tutorial' || labelLower.includes('conditioning tutorial')) {
      // Return true if action.isCompleted is already true, since we might have injected it from journeyData
      return action.isCompleted === true;
    }`;

content = content.replace(oldCheck, newCheck);
fs.writeFileSync(filePath, content);
console.log('patched');
