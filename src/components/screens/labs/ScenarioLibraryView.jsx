// src/components/screens/labs/ScenarioLibraryView.jsx
// REFACTORED: Scenario selection and management

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Zap, CornerRightUp } from 'lucide-react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { Button, Card, COLORS } from './shared/LabComponents.jsx';
import DynamicScenarioGenerator from './DynamicScenarioGenerator.jsx';

const ScenarioLibraryView = ({ setCoachingLabView, setSelectedScenario }) => {
    const [isDynamicGeneratorVisible, setIsDynamicGeneratorVisible] = useState(false);
    
    // Load scenarios from database via useAppServices
    const { SCENARIO_CATALOG } = useAppServices();
    const scenarios = useMemo(() => SCENARIO_CATALOG?.items || [], [SCENARIO_CATALOG]);
    
    return (
        <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8">
            <h1 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-[#0B3B5B] mb-4">Scenario Library: Practice Conversations</h1>
            <p className="text-lg text-gray-600 mb-6">Select a high-stakes scenario to practice your preparation process. Each scenario includes a unique persona for the AI simulator.</p>
            
            <Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching
            </Button>
            
            <Card 
                title="Dynamic Scenario Generator" 
                icon={Zap} 
                className="mb-6 bg-[#0B3B5B]/10 border-l-4 border-[#E04E1B] rounded-3xl" 
                onClick={() => setIsDynamicGeneratorVisible(true)}
            >
                <p className="text-gray-700 text-sm">Create a custom, adaptive scenario by choosing a core conflict and adding a unique **modifier** (e.g., personality, circumstance, or context).</p>
                <div className="mt-4 text-[#E04E1B] font-semibold flex items-center">
                    Launch Generator <CornerRightUp className='w-4 h-4 ml-1'/>
                </div>
            </Card>
            
            <h2 className='text-xl font-bold text-[#0B3B5B] mb-4 border-b pb-1'>Pre-Seeded Scenarios</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6">
                {scenarios.map(scenario => (
                    <Card 
                        key={scenario.id} 
                        title={scenario.title} 
                        className="border-l-4 border-[#219E8B] rounded-3xl" 
                        onClick={() => {
                            setSelectedScenario(scenario);
                            setCoachingLabView('scenario-prep');
                        }}
                    >
                        <p className="text-sm text-gray-700 mb-3">{scenario.description}</p>
                        <div className="text-xs font-semibold text-[#0B3B5B] bg-[#0B3B5B]/10 px-3 py-1 rounded-full inline-block">
                            Persona: {scenario.persona}
                        </div>
                        <div className="mt-4 text-[#219E8B] font-semibold flex items-center">
                            Start Preparation &rarr;
                        </div>
                    </Card>
                ))}
            </div>
            
            {isDynamicGeneratorVisible && (
                <DynamicScenarioGenerator 
                    setCoachingLabView={setCoachingLabView} 
                    setSelectedScenario={setSelectedScenario} 
                    setIsDynamicGeneratorVisible={setIsDynamicGeneratorVisible} 
                />
            )}
        </div>
    );
};

export default ScenarioLibraryView;