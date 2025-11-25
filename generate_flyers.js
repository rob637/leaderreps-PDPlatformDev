import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// --- CONFIGURATION ---
const OUTPUT_FILE = 'pre_generated_book_catalog.json';
const API_KEY = process.env.GEMINI_API_KEY; // Requires GEMINI_API_KEY environment variable
const MODEL_NAME = 'gemini-2.5-flash';

// --- COMPLEXITY MAP ---
  Low:    { label: 'Novice',       hex: '#10B981', icon: 'CheckCircle' },
  Medium: { label: 'Intermediate', hex: '#F59E0B', icon: 'AlertTriangle' },
  High:   { label: 'Expert',       hex: '#E04E1B',   icon: 'Target' },
};

// --- MOCK DATA (Your provided book catalog) ---
// NOTE: This JSON must be copied directly from your READING_CATALOG_SERVICE items object
const BOOK_CATALOG_MOCK = {
    'Innovation & Change': [
        { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'Build-measure-learn with continuous innovation.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn, Iteration, Pivot or Persevere, Validated Learning, Innovation Accounting' },
        { id: 'i_c_2', title: 'Innovator\'s Dilemma', author: 'Clayton Christensen', theme: 'Why great companies fail by being too good at what they do.', complexity: 'High', duration: 270, focus: 'Disruptive Innovation, Sustaining Technology, Value Networks, Resource Dependence, Small Markets' },
        { id: 'i_c_3', title: 'Crossing the Chasm', author: 'Geoffrey A. Moore', theme: 'Marketing high-tech products to mainstream customers.', complexity: 'Medium', duration: 230, focus: 'Technology Adoption Lifecycle, Chasm Strategy, Bowling Pin, Early Adopters, Mainstream Market' },
        { id: 'i_c_4', title: 'Zero to One', author: 'Peter Thiel', theme: 'The secret to building a better future is to create new things, not copy existing ones.', complexity: 'Medium', duration: 200, focus: 'Monopolies, Vertical Progress, Last Mover Advantage, Secret, Peter Thiel\'s Seven Questions' },
    ],
    'People & Culture': [
        { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'Courageous leadership by embracing vulnerability and trust.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability, Rumbling with Vulnerability, Armored Leadership, Empathy' },
        { id: 'p_c_2', title: 'Turn the Ship Around!', author: 'L. David Marquet', theme: 'Creating a leader-leader organization over a leader-follower one.', complexity: 'Medium', duration: 190, focus: 'Intent-Based Leadership, Decentralization, Ownership, Competence, Clarity, Control' },
        { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'Challenging directly while caring personally.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching, Guidance, Caring Personally, Challenging Directly, Get Stuff Done Wheel' },
        { id: 'p_c_4', title: 'The Culture Code', author: 'Daniel Coyle', theme: 'Building highly successful groups through belonging, safety, and shared purpose.', complexity: 'Low', duration: 230, focus: 'Group Cohesion, Vulnerability Loops, Shared Identity, Safety, Vulnerability, Purpose' },
        { id: 'p_c_5', title: 'Start with Why', author: 'Simon Sinek', theme: 'Great leaders inspire action by communicating from the inside out (The Golden Circle).', complexity: 'Low', duration: 180, focus: 'Purpose, Vision, The Golden Circle, Mass Influence, Trust, Why/How/What' },
        { id: 'p_c_6', title: 'Team of Teams', author: 'General Stanley McChrystal', theme: 'How a decentralized command structure can beat highly effective, organized threats.', complexity: 'High', duration: 250, focus: 'Shared Consciousness, Empowered Execution, Adaptability, Decentralization, Liaison Officers, Trust' },
    ],
    'Self-Awareness & Growth': [
        { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'Build good habits by tiny improvements.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline, Identity, Four Laws, Habit Stacking, Two-Minute Rule, Environment Design' },
        { id: 's_a_2', title: 'Mindset', author: 'Carol Dweck', theme: 'The difference between growth and fixed mindsets in success.', complexity: 'Medium', duration: 190, focus: 'Growth Mindset, Fixed Mindset, Effort vs. Talent, Praise for Effort, Neuroscience of Change' },
        { id: 's_a_3', title: 'Drive', author: 'Daniel H. Pink', theme: 'The new operating system for business based on intrinsic motivation (Autonomy, Mastery, Purpose).', complexity: 'Medium', duration: 170, focus: 'Intrinsic Motivation, Autonomy, Mastery, Purpose, Type I vs Type X Behavior, Flow State, Goldilocks Tasks' },
        { id: 's_a_4', title: 'Emotional Intelligence 2.0', author: 'Travis Bradberry', theme: 'Practical strategies for increasing self-awareness and self-management.', complexity: 'Low', duration: 160, focus: 'Self-Awareness, Self-Management, Social Awareness, Relationship Management, EQ Assessment, Delaying Gratification' },
        { id: 's_a_5', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', theme: 'Dual-process model of the brain (System 1 and System 2) and cognitive biases.', complexity: 'High', duration: 280, focus: 'Cognitive Biases, System 1/System 2, Decision Making, Anchoring Effect, Loss Aversion, Prospect Theory' },
    ],
    'Strategy & Execution': [
        { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Why most small businesses fail and how to build a scalable system.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization, Standard Operating Procedures, Entrepreneurial Vision, Managerial Structure' },
        { id: 's_e_2', title: 'Good to Great', author: 'Jim Collins', theme: 'The factors that allow companies to make the leap from good results to sustained great ones.', complexity: 'High', duration: 240, focus: 'Level 5 Leadership, Hedgehog Concept, Culture of Discipline, Technology Accelerators, Flywheel Effect, Stockdale Paradox' },
        { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Achieving ambitious goals using OKRs.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning, Accountability, Transparency, Stretch Goals, Feedback Cycles' },
        { id: 's_e_4', title: 'The 7 Habits', author: 'Stephen Covey', theme: 'Principles for personal and professional effectiveness.', complexity: 'Low', duration: 220, focus: 'Proactivity, Prioritization, Synergy, Sharpen the Saw, Win/Win, Habit Stacking, Time Management Matrix' },
        { id: 's_e_5', title: 'Getting Things Done (GTD)', author: 'David Allen', theme: 'A stress-free system for organizing tasks and projects.', complexity: 'Medium', duration: 210, focus: 'Workflow Management, Capture, Organize, Engage, Next Actions, Two-Minute Rule, Weekly Review' },
        { id: 's_e_6', title: 'Deep Work', author: 'Cal Newport', theme: 'The value of focused, distraction-free concentration on cognitively demanding tasks.', complexity: 'Medium', duration: 190, focus: 'Focus, Productivity, Attention Management, Monastic Approach, High-Value Tasks, Metrics of Depth, Batch Processing' },
        { id: 's_e_7', title: 'The Goal', author: 'Eliyahu Goldratt', theme: 'The process of ongoing improvement using the Theory of Constraints.', complexity: 'High', duration: 260, focus: 'Theory of Constraints, Bottlenecks, Throughput, Drum-Buffer-Rope, Process Improvement, Optimization' },
    ]
};


// --- UTILITY FUNCTIONS (Copied from BusinessReadings.jsx) ---

const API_ERROR_HTML = (executive, book) => {
    const errorTitle = executive ? "EXECUTIVE BRIEFING UNAVAILABLE" : "FULL FLYER UNAVAILABLE";
    const baseContent = executive 
        ? `<p style="color:${'#E04E1B'}; font-size: 18px; margin-top: 15px; line-height: 1.6;">**CRITICAL API ERROR**: Content generation failed during pre-processing. Check API key and service status.</p>
           <h3 style="color:${'#002E47'}; font-weight:800; font-size: 20px; margin-top:20px;">Static Summary (for Reference)</h3>
           <p style="color:#374151; font-size: 16px; margin-top: 5px;">This briefing would have covered: ${book.theme}. Focus areas: ${book.focus.split(',').slice(0, 3).join(', ')}.</p>`
        : `<p style="color:${'#E04E1B'}; font-size: 18px; margin-top: 15px; line-height: 1.6;">**CRITICAL API ERROR**: Content generation failed during pre-processing. Check API key and service status.</p>
           <h3 style="color:${'#002E47'}; font-weight:800; font-size: 20px; margin-top:20px;">Root Cause Check</h3>
           <ul style="list-style:disc;margin-left:20px;color:#374151;font-size:16px;">
              <li>The API call failed during the generation script.</li>
              <li>Verify the **Gemini API Key** is correctly set in the environment.</li>
           </ul>`;
        
    return `<div style="padding: 16px;"><h2 style="color:${'#002E47'}; font-weight:900; font-size: 24px; border-bottom: 3px solid ${'#E04E1B'}; padding-bottom: 8px;">${errorTitle}</h2>${baseContent}</div>`;
};

/**
 * Isolated version of buildAIFlyerHTML using the GoogleGenAI SDK directly.
 */
async function generateFlyerHTML({ book, tier, executive, ai }) {
  
  const baseInstruction = executive
    ? `Write a robust EXECUTIVE BRIEF (150-200 words, split into 2 paragraphs). The brief must address the book's core insight, its relevance to the leader's specific tier, and two clear takeaway actions presented in a brief, bulleted list. Output clean, styled HTML using only h2, h3, p, ul, li, strong, em, and inline CSS for presentation. The two paragraphs should be separate <p> tags, followed by an H3 and a <ul> with 2 <li> items.`
    : `Create a comprehensive BOOK FLYER (300-350 words total). The content must include four specific sections: **1. Core Insight & Overview**, **2. Deep Dive (3 Critical Takeaways as a list)**, **3. Key Frameworks (with short descriptions)**, and **4. Immediate 4-Week Action Plan (4 bullet points)**. Ensure high detail and professional tone. Output ONLY clean, styled HTML using h2, h3, p, ul, li, strong, em, and inline CSS for presentation. DO NOT include any plain text outside the HTML tags.`;

  const systemPrompt =
    `You are the LeaderReps Researcher and Content Generator. Your goal is to produce a detailed, premium, high-value content piece based on the provided book and the user's Leadership Tier. You MUST adhere to all structural and word count requirements. Frameworks and actions must clearly reference the book’s named models and concepts. Use Google Search grounding to ensure accuracy.`;

  const userPrompt =
    `${baseInstruction}\n\nBook: ${book.title} by ${book.author}\n` +
    `Focus areas: ${(book.focus || '')}\nComplexity: ${book.complexity}\nTier: ${tier}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        // Using the Google Search Tool for grounding
        tools: [{ googleSearch: {} }] 
      }
    });
    
    let html = response.text || '';
    
    if (html && !html.toLowerCase().includes('error')) {
        // Apply inline styles to the AI-generated HTML for consistent branding
        html = html.replace(/<h2/g, `<h2 style="color:${'#E04E1B'};font-size:24px;border-bottom:2px solid ${'#E5E7EB'};padding-bottom:5px;margin-top:15px;"`);
        html = html.replace(/<h3/g, `<h3 style="color:${'#002E47'};font-size:20px;margin-top:10px;"`);
        html = html.replace(/<p/g, `<p style="color:#374151;font-size:16px;"`);
        html = html.replace(/<ul/g, `<ul style="list-style:disc;margin-left:20px;color:#374151;"`);
        html = html.replace(/<ol/g, `<ol style="list-style:decimal;margin-left:20px;color:#374151;"`);
        return html;
    }
    
    console.error(`AI Flyer Generation failed for ${book.title} (${executive ? 'Executive' : 'Full'}). Response was empty or error.`);
    return API_ERROR_HTML(executive, book);
  } catch (e) {
    console.error(`API exception for ${book.title} (${executive ? 'Executive' : 'Full'}).`, e.message);
    return API_ERROR_HTML(executive, book);
  }
}


/**
 * Main execution function to iterate, generate, and save the catalog.
 */
async function generateAndSaveCatalog() {
    console.log(`Starting content generation for ${Object.keys(BOOK_CATALOG_MOCK).length} categories...`);

    if (!API_KEY) {
        console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set.");
        console.error("Please set the key and try again.");
        return;
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const updatedCatalog = {};
    let bookCount = 0;

    for (const [tier, books] of Object.entries(BOOK_CATALOG_MOCK)) {
        updatedCatalog[tier] = [];

        for (const book of books) {
            bookCount++;
            console.log(`\n[${bookCount}] Generating content for: ${book.title} (${tier})`);

            // 1. Generate Full Flyer
            const fullFlyerHTML = await generateFlyerHTML({ 
                book, 
                tier, 
                executive: false, 
                ai 
            });

            // 2. Generate Executive Brief
            const executiveBriefHTML = await generateFlyerHTML({ 
                book, 
                tier, 
                executive: true, 
                ai 
            });

            // 3. Persist new properties
            updatedCatalog[tier].push({
                ...book,
                fullFlyerHTML,
                executiveBriefHTML
            });
            console.log(`-> Content successfully saved to catalog for ${book.title}.`);
        }
    }

    // Write the complete updated catalog to a JSON file
    try {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedCatalog, null, 2), 'utf-8');
        console.log(`\n\n✅ SUCCESS! All ${bookCount} books processed.`);
        console.log(`The updated catalog has been saved to: ${OUTPUT_FILE}`);
        console.log(`Use the content of this file to update your READING_CATALOG_SERVICE.`);
    } catch (error) {
        console.error("ERROR: Failed to write output file.", error.message);
    }
}

generateAndSaveCatalog();