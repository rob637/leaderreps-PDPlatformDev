const fs = require('fs');
let code = fs.readFileSync('src/components/conditioning/CloseRRModal.jsx', 'utf8');
const insertion = `
  // Use the full Evidence Capture Wizard for Set Clear Expectations and Reinforcing Feedback reps
  if (rep?.repType === 'set_clear_expectations' || rep?.repType === 'deliver_reinforcing_feedback') {
    // If evidence already captured, go straight to Plan Follow-up (Complete the Loop)
    // to avoid looping back through evidence capture screens
    const mode = rep?.evidence ? 'plan' : 'evidence';
    return (
      <EvidenceCaptureWizard 
        rep={rep}
        initialMode={mode}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );
  }
`;
code = code.replace('  // Get dynamic evidence prompt based on outcome', insertion + '\n  // Get dynamic evidence prompt based on outcome');
fs.writeFileSync('src/components/conditioning/CloseRRModal.jsx', code);
