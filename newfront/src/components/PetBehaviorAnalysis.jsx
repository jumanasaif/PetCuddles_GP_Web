// components/PetBehaviorAnalysis.js
import React, { useState, useEffect } from 'react';
import { FaPaw, FaClipboardList, FaVideo, FaLightbulb, FaExclamationTriangle, 
         FaSpinner, FaNotesMedical, FaFileMedical, FaCheck } from 'react-icons/fa';
import { GiHealthNormal, GiDogBowl } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useParams } from 'react-router-dom';



const PetBehaviorAnalysis = () => {
  const { petId } = useParams();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [newLog, setNewLog] = useState({
    behavior_pattern_id: '',
    custom_behavior: '',
    frequency: 'once',
    intensity: 1,
    triggers: [],
    notes: '',
    video_evidence: ''
  });
const [surveyData, setSurveyData] = useState({
  logId: null,
  solutions: [],
  customSolution: '',
  customHelped: null,
  customEffectiveness: 50,
  customNotes: ''
});
  const [currentLog, setCurrentLog] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const [petError, setPetError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [matchingBehaviors, setMatchingBehaviors] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchSource, setMatchSource] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [solutions, setSolutions] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all'
  });


  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/pets/user-pets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPets(response.data.pets);
        setPetError(null);
        
        // If petId is in URL, set it as selected
        if (petId) {
          const pet = response.data.pets.find(p => p._id === petId);
          if (pet) {
            setSelectedPet(pet);
          }
        }
      } catch (err) {
        setPetError(err.response?.data?.message || 'Failed to load pets');
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, [petId]);

  // Fetch behavior data when pet is selected
  useEffect(() => {
    if (!selectedPet) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [patternsRes, logsRes] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/behavioral-analysis/patterns/${selectedPet.species}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `http://localhost:5000/api/behavioral-analysis/pet/${selectedPet._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ]);
        
        setPatterns(patternsRes.data);
        setLogs(logsRes.data);
        
        // Extract unique categories
        const allCategories = patternsRes.data.flatMap(p => p.categories);
        setCategories(['all', ...new Set(allCategories)]);
        
        // Get analysis
        const analysisRes = await axios.get(
          `http://localhost:5000/api/behavioral-analysis/analysis/${selectedPet._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalysis(analysisRes.data);
        
      } catch (error) {
        console.error('Error fetching behavior data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPet]);

  const matchCustomBehavior = async (description) => {
    if (!description || !selectedPet) return;
    
    setIsMatching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/behavioral-analysis/match-behavior',
        {
          description: description,
          species: selectedPet.species
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMatchingBehaviors(response.data.matches);
      setMatchSource(response.data.source);
    } catch (error) {
      console.error('Error matching behavior:', error);
      setMatchingBehaviors([]);
    } finally {
      setIsMatching(false);
    }
  };

const handleLogSubmit = async (e) => {
  e.preventDefault();
  try {
    if (!selectedPet?._id) {
      throw new Error('Please select a pet first');
    }
    if (!newLog.custom_behavior && !newLog.behavior_pattern_id) {
      throw new Error('Please select a behavior pattern or describe a custom behavior');
    }

    const token = localStorage.getItem('token');
    const requestData = {
      pet_id: selectedPet._id,
      frequency: newLog.frequency,
      intensity: parseInt(newLog.intensity),
      triggers: newLog.triggers,
      notes: newLog.notes,
      video_evidence: newLog.video_evidence || undefined
    };

    // Handle behavior pattern vs custom behavior
    if (newLog.behavior_pattern_id) {
      requestData.behavior_pattern_id = newLog.behavior_pattern_id;
      
      // Get the behavior pattern details including its solutions
      const patternResponse = await axios.get(
        `http://localhost:5000/api/behavioral-analysis/patterns/${selectedPet.species}/${requestData.behavior_pattern_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const pattern = patternResponse.data;
      
      // Prepare solutions_tried array with suggested solutions marked as not tried yet
      requestData.solutions_tried = pattern.solutions.map(solution => ({
        solution: solution.solution,
        is_suggested: true,
        tried: false,
        helped_resolve: null,
        effectiveness: solution.effectiveness * 100, // Convert to percentage
        notes: '',
        steps_followed: solution.steps || [] // Save the steps here
      }));
    } else {
      requestData.custom_behavior = newLog.custom_behavior;
      // If it's a custom behavior, try to match it first
      if (matchingBehaviors.length > 0) {
        requestData.behavior_pattern_id = matchingBehaviors[0]._id;
        requestData.custom_behavior = undefined;
        
        // Get the matched behavior pattern details
        const patternResponse = await axios.get(
          `http://localhost:5000/api/behavioral-analysis/patterns/${selectedPet.species}/${requestData.behavior_pattern_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const pattern = patternResponse.data;
        
        // Prepare solutions_tried array
        requestData.solutions_tried = pattern.solutions.map(solution => ({
          solution: solution.solution,
          is_suggested: true,
          tried: false,
          helped_resolve: null,
          effectiveness: solution.effectiveness * 100,
          notes: '',
          steps_followed: solution.steps || [] // Save the steps here
        }));
      } else {
        // For completely custom behaviors without matches
        requestData.solutions_tried = [{
          solution: 'Monitor behavior and consult a professional',
          is_suggested: false,
          tried: false,
          helped_resolve: null,
          effectiveness: 50,
          notes: '',
          steps_followed: ['Document behavior patterns', 'Consult a veterinarian'] // Default steps
        }];
      }
    }

    const response = await axios.post(
      'http://localhost:5000/api/behavioral-analysis/log',
      requestData,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Reset form
    setNewLog({
      behavior_pattern_id: '',
      custom_behavior: '',
      frequency: 'once',
      intensity: 1,
      triggers: [],
      notes: '',
      video_evidence: ''
    });
    
    // Update logs list and set current log
    setCurrentLog(response.data.log);
    setLogs([response.data.log, ...logs]);
      // Show solutions if available
    if (response.data.suggestions?.length > 0) {
      setSolutions(response.data.suggestions);
      setShowSolutionModal(true);
    }
    // Don't show solutions modal automatically
    // Just save the solutions with the log
  } catch (error) {
    console.error('Error logging behavior:', error);
    alert(error.response?.data?.message || error.message || 'Failed to log behavior');
  }
};

  const handleSaveSolution = async (logId, solution) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `http://localhost:5000/api/behavioral-analysis/log/${logId}/solution`,
      { solution },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setLogs(logs.map(log => 
      log._id === logId ? response.data.updatedLog : log
    ));
  } catch (error) {
    console.error('Error saving solution:', error);
    alert('Failed to save solution');
  }
};

  const handleAskQuestion = async () => {
    if (!currentQuestion || !selectedPattern) return;
    
    setAiLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/behavioral-analysis/ask', {
        question: currentQuestion,
        patternId: selectedPattern._id
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setAiAnswer(response.data.answer);
    } catch (error) {
      console.error("Failed to get answer:", error);
      alert("Failed to get AI response");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToHealthRecords = async () => {
    if (!selectedPattern || !selectedPet) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/pets/${selectedPet._id}/health-records`,
        {
          type: 'behavior_analysis',
          title: `Behavior Pattern - ${selectedPattern.name}`,
          description: selectedPattern.description.substring(0, 100),
          notes: `Pattern identified with potential solutions`,
          data: {
            type: 'behavior_pattern',
            name: selectedPattern.name,
            description: selectedPattern.description,
            causes: selectedPattern.causes,
            solutions: selectedPattern.solutions,
            medical_flags: selectedPattern.medical_flags
          }
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      alert('Added to health records successfully!');
    } catch (error) {
      console.error('Error adding to health records:', error);
      alert(`Failed to add to health records: ${error.response?.data?.error || error.message}`);
    }
  };

  const updateLogStatus = async (logId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:5000/api/behavioral-analysis/log/${logId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLogs(logs.map(log => 
        log._id === logId ? response.data.updatedLog : log
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredLogs = logs.filter(log => {
    return (
      (filters.status === 'all' || log.status === filters.status) &&
      (filters.severity === 'all' || 
       (filters.severity === 'high' && log.intensity >= 4) ||
       (filters.severity === 'medium' && log.intensity === 3) ||
       (filters.severity === 'low' && log.intensity <= 2))
    );
  });

  const ProgressDashboard = ({ logs }) => {
    const resolvedCount = logs.filter(l => l.status === 'resolved').length;
    const activeCount = logs.filter(l => l.status === 'active').length;
    const escalatedCount = logs.filter(l => l.status === 'escalated').length;
    
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-800">Resolved</h4>
          <p className="text-2xl font-bold mt-1">{resolvedCount}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800">Active</h4>
          <p className="text-2xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="text-sm font-medium text-red-800">Escalated</h4>
          <p className="text-2xl font-bold mt-1">{escalatedCount}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800">Success Rate</h4>
          <p className="text-2xl font-bold mt-1">
            {logs.length ? Math.round((resolvedCount/logs.length)*100) : 0}%
          </p>
        </div>
      </div>
    );
  };

const handleOpenSurvey = (log) => {
  const getPatternDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/behavioral-analysis/patterns/${selectedPet.species}/${log.behavior_pattern_id._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const pattern = response.data;
      
      setSurveyData({
        logId: log._id,
        solutions: pattern.solutions.map(sol => {
          const triedSolution = log.solutions_tried?.find(t => t.solution === sol.solution);
          return {
            solution: sol.solution,
            is_suggested: true,
            tried: triedSolution ? triedSolution.tried : false,
            helped_resolve: triedSolution?.helped_resolve || null,
            effectiveness: triedSolution?.effectiveness || 50,
            notes: triedSolution?.notes || '',
            steps: sol.steps || [] // Include the steps from the pattern
          };
        }),
        customSolution: '',
        customHelped: null,
        customEffectiveness: 50,
        customNotes: ''
      });
    } catch (error) {
      console.error('Error fetching pattern details:', error);
      // Fallback to just using the log data if pattern can't be fetched
      setSurveyData({
        logId: log._id,
        solutions: log.solutions_tried?.map(t => ({
          solution: t.solution,
          is_suggested: t.is_suggested,
          tried: t.tried,
          helped_resolve: t.helped_resolve,
          effectiveness: t.effectiveness,
          notes: t.notes,
          steps: t.steps_followed || []
        })) || [],
        customSolution: '',
        customHelped: null,
        customEffectiveness: 50,
        customNotes: ''
      });
    }
  };
  
  if (log.behavior_pattern_id) {
    getPatternDetails();
  } else {
    // For custom behaviors without a pattern
    setSurveyData({
      logId: log._id,
      solutions: log.solutions_tried?.map(t => ({
        solution: t.solution,
        is_suggested: t.is_suggested,
        tried: t.tried,
        helped_resolve: t.helped_resolve,
        effectiveness: t.effectiveness,
        notes: t.notes,
        steps: t.steps_followed || []
      })) || [],
      customSolution: '',
      customHelped: null,
      customEffectiveness: 50,
      customNotes: ''
    });
  }
};

const handleSolutionChange = (index, field, value) => {
  const updatedSolutions = [...surveyData.solutions];
  updatedSolutions[index][field] = value;
  setSurveyData({...surveyData, solutions: updatedSolutions});
};

const handleAddCustomSolution = () => {
  if (!surveyData.customSolution) return;
  
  const newSolution = {
    solution: surveyData.customSolution,
    is_suggested: false,
    helped_resolve: surveyData.customHelped,
    effectiveness: surveyData.customEffectiveness,
    notes: surveyData.customNotes
  };
  
  setSurveyData({
    ...surveyData,
    solutions: [...surveyData.solutions, newSolution],
    customSolution: '',
    customHelped: null,
    customEffectiveness: 50,
    customNotes: ''
  });
};

const handleSubmitSurvey = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `http://localhost:5000/api/behavioral-analysis/log/${surveyData.logId}/solution-survey`,
      {
        solutions: surveyData.solutions.filter(sol => sol.tried),
        customSolutions: surveyData.solutions.filter(sol => !sol.is_suggested)
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Update local logs state with the complete response including tried solutions
    setLogs(logs.map(log => 
      log._id === surveyData.logId ? {
        ...response.data.log,
        // Ensure all tried solutions are included, both suggested and custom
        solutions_tried: [
          ...response.data.log.solutions_tried,
          ...surveyData.solutions
            .filter(sol => !sol.is_suggested && sol.tried)
            .map(sol => ({
              solution: sol.solution,
              is_suggested: false,
              tried: true,
              helped_resolve: sol.helped_resolve,
              effectiveness: sol.effectiveness,
              notes: sol.notes,
              steps_followed: sol.steps || []
            }))
        ]
      } : log
    ));
    
    // Close survey
    setSurveyData({
      logId: null,
      solutions: [],
      customSolution: '',
      customHelped: null,
      customEffectiveness: 50,
      customNotes: ''
    });
  } catch (error) {
    console.error('Error submitting survey:', error);
    alert('Failed to submit survey');
  }
};

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila" style={{marginTop:"80px"}}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center bg-[#325747] text-[#F6F4E8] px-6 py-3 rounded-full mb-4"
          >
            <FaPaw className="text-2xl mr-2" />
            <h1 className="text-3xl font-bold">Pet Behavior Analysis</h1>
          </motion.div>
          <p className="text-[#325747] max-w-2xl mx-auto">
            Track and understand your pet's behaviors with detailed analysis and recommendations
          </p>
        </div>

        {/* Pet Selection */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto"
        >
          <div className="flex items-center mb-4">
            <FaPaw className="text-[#E59560] text-xl mr-2" />
            <h2 className="text-xl font-semibold text-[#325747]">Select Your Pet</h2>
          </div>
          
          <div className="relative">
            <select
              value={selectedPet?._id || ''}
              onChange={(e) => {
                const pet = pets.find(p => p._id === e.target.value);
                setSelectedPet(pet);
              }}
              className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560] transition-all appearance-none bg-white"
              disabled={loadingPets}
            >
              <option value="">-- Select a Pet --</option>
              {pets.map(pet => (
                <option key={pet._id} value={pet._id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 text-[#325747]">
              <FaPaw />
            </div>
          </div>
          
          <AnimatePresence>
            {petError && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-sm mt-2"
              >
                {petError}
              </motion.p>
            )}
            {!loadingPets && pets.length === 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#325747] text-sm mt-2"
              >
                No pets found. Please add a pet first.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {selectedPet && (
          <>
            {/* Progress Dashboard */}
            <ProgressDashboard logs={logs} />

            {/* Main Content */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Behavior Logging Section */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-[#325747] text-[#F6F4E8] p-4 flex items-center">
                  <FaClipboardList className="mr-2" />
                  <h3 className="font-semibold">Log New Behavior</h3>
                </div>
                
                <div className="p-6">
                  <form onSubmit={handleLogSubmit}>
                    <div className="form-group mb-4">
                      <label className="block text-[#325747] font-medium mb-2">
                        Select Behavior Pattern:
                      </label>
                      <select 
                        value={newLog.behavior_pattern_id}
                        onChange={(e) => setNewLog({...newLog, behavior_pattern_id: e.target.value})}
                        className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560]"
                      >
                        <option value="">-- Select a behavior --</option>
                        {patterns.map(pattern => (
                          <option key={pattern._id} value={pattern._id}>
                            {pattern.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {!newLog.behavior_pattern_id && (
                      <div className="form-group mb-4">
                        <label className="block text-[#325747] font-medium mb-2">
                          Or describe custom behavior:
                        </label>
                        <input 
                          type="text" 
                          value={newLog.custom_behavior}
                          onChange={(e) => {
                            setNewLog({...newLog, custom_behavior: e.target.value});
                            if (e.target.value.length > 3) {
                              matchCustomBehavior(e.target.value);
                            } else {
                              setMatchingBehaviors([]);
                            }
                          }}
                          placeholder="Describe the behavior (e.g., 'my dog barks when I leave')"
                          className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560]"
                        />
                        
                        {/* Show matching behaviors */}
                        {isMatching && (
                          <div className="mt-2 text-sm text-[#325747]">
                            <FaSpinner className="animate-spin inline mr-2" />
                            Matching to known behaviors...
                          </div>
                        )}
                        
                        {matchingBehaviors.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-[#325747] mb-2">
                              {matchSource === 'database' ? 'Direct matches found:' : 'AI-suggested similar behaviors:'}
                            </p>
                            <div className="space-y-2">
                              {matchingBehaviors.map(pattern => (
                                <motion.div
                                  key={pattern._id}
                                  whileHover={{ scale: 1.02 }}
                                  className="bg-[#F6F4E8] p-2 rounded-lg border border-[#BACEC1] cursor-pointer"
                                  onClick={() => {
                                    setNewLog({
                                      ...newLog,
                                      behavior_pattern_id: pattern._id,
                                      custom_behavior: ''
                                    });
                                    setMatchingBehaviors([]);
                                    setSelectedPattern(pattern);
                                  }}
                                >
                                  <div className="font-medium text-[#325747]">{pattern.name}</div>
                                  <div className="text-sm text-[#325747]">
                                    {pattern.description.substring(0, 80)}...
                                  </div>
                                  {pattern.categories.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {pattern.categories.map(cat => (
                                        <span key={cat} className="text-xs bg-[#BACEC1] text-[#325747] px-2 py-1 rounded-full">
                                          {cat}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {newLog.custom_behavior && matchingBehaviors.length === 0 && !isMatching && (
                          <div className="mt-2 text-sm text-[#325747]">
                            No matches found. This will be logged as a custom behavior.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="form-group">
                        <label className="block text-[#325747] font-medium mb-2">Frequency:</label>
                        <select
                          value={newLog.frequency}
                          onChange={(e) => setNewLog({...newLog, frequency: e.target.value})}
                          className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560]"
                        >
                          <option value="once">Once</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="constantly">Constantly</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-[#325747] font-medium mb-2">Intensity (1-5):</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={newLog.intensity}
                          onChange={(e) => setNewLog({...newLog, intensity: e.target.value})}
                          className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560]"
                        />
                      </div>
                    </div>

                    <div className="form-group mb-4">
                      <label className="block text-[#325747] font-medium mb-2">
                        Triggers (comma separated):
                      </label>
                      <input
                        type="text"
                        value={newLog.triggers.join(', ')}
                        onChange={(e) => setNewLog({
                          ...newLog,
                          triggers: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        })}
                        placeholder="Loud noises, strangers, other pets"
                        className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560]"
                      />
                    </div>

                    <div className="form-group mb-4">
                      <label className="block text-[#325747] font-medium mb-2">Notes:</label>
                      <textarea
                        value={newLog.notes}
                        onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                        placeholder="Any note or context for this behavior?"
                        rows="3"
                        className="w-full p-3 border-2 border-[#BACEC1] rounded-lg focus:outline-none focus:border-[#E59560]"
                      />
                    </div>
                    
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-[#E59560] hover:bg-[#d4834a] text-white py-3 rounded-lg font-semibold flex items-center justify-center"
                    >
                      <FaClipboardList className="mr-2" />
                      Log Behavior
                    </motion.button>
                  </form>
                </div>
              </motion.div>

              {/* Behavior Analysis Summary */}
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-[#325747] text-[#F6F4E8] p-4 flex items-center">
                  <FaLightbulb className="mr-2" />
                  <h3 className="font-semibold">Behavior Insights</h3>
                </div>
                
                <div className="p-6 h-full">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <FaSpinner className="animate-spin text-2xl text-[#325747]" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {analysis?.urgent?.length > 0 && (
                        <div className="bg-[#f8e3d6] p-4 rounded-lg">
                          <h4 className="font-bold text-[#325747] flex items-center">
                            <FaExclamationTriangle className="text-red-500 mr-2" />
                            Urgent Behaviors
                          </h4>
                          <p className="text-sm text-[#325747] mb-2">
                            These behaviors may indicate serious health issues:
                          </p>
                          <ul className="space-y-2">
                            {analysis.urgent.map(log => (
                              <li key={log._id} className="text-[#325747]">
                                {log.behavior_pattern_id?.name || log.custom_behavior}
                                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                  Vet Recommended
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {analysis?.concerning?.length > 0 && (
                        <div className="bg-[#f0f7eb] p-4 rounded-lg">
                          <h4 className="font-bold text-[#325747]">Concerning Behaviors</h4>
                          <p className="text-sm text-[#325747] mb-2">
                            These behaviors may need attention:
                          </p>
                          <ul className="space-y-2">
                            {analysis.concerning.map(log => (
                              <li key={log._id} className="text-[#325747]">
                                {log.behavior_pattern_id?.name || log.custom_behavior}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="bg-[#BACEC1] p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-[#325747]">
                            Common {selectedPet.species} Behaviors
                          </h4>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-sm p-1 border border-[#325747] rounded"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {patterns
                            .filter(p => selectedCategory === 'all' || p.categories.includes(selectedCategory))
                            .slice(0, 6)
                            .map(pattern => (
                              <motion.div 
                                key={pattern._id} 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white p-3 rounded-lg shadow cursor-pointer"
                                onClick={() => setSelectedPattern(pattern)}
                              >
                                <h5 className="font-semibold text-[#325747]">{pattern.name}</h5>
                                <p className="text-sm text-[#325747]">
                                  {pattern.description.substring(0, 60)}...
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {pattern.categories.slice(0, 2).map(cat => (
                                    <span key={cat} className="text-xs bg-[#BACEC1] text-[#325747] px-2 py-1 rounded-full">
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Behavior Log History */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg mt-8 overflow-hidden"
            >
              <div className="bg-[#325747] text-[#F6F4E8] p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <FaNotesMedical className="mr-2" />
                  <h3 className="font-semibold">Behavior Log History</h3>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="text-sm p-1 border text-[#325747]  border-[#BACEC1] rounded"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                  </select>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters({...filters, severity: e.target.value})}
                    className="text-sm p-1 border text-[#325747] border-[#BACEC1] rounded"
                  >
                    <option value="all">All Severities</option>
                    <option value="low">Low (1-2)</option>
                    <option value="medium">Medium (3)</option>
                    <option value="high">High (4-5)</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6">
                {filteredLogs.length === 0 ? (
                  <p className="text-[#325747] text-center py-4">
                    No behavior logs match your filters.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b-2 border-[#BACEC1]">
                          <th className="pb-2 text-[#325747]">Date</th>
                          <th className="pb-2 text-[#325747]">Behavior</th>
                          <th className="pb-2 text-[#325747]">Triggers</th>
                          <th className="pb-2 text-[#325747]">Frequency</th>
                          <th className="pb-2 text-[#325747]">Intensity</th>
                          <th className="pb-2 text-[#325747]">Solutions</th>
                          <th className="pb-2 text-[#325747]">Status</th>
                          <th className="pb-2 text-[#325747]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map(log => (
                          <motion.tr 
                            key={log._id} 
                            whileHover={{ backgroundColor: '#F6F4E8' }}
                            className="border-b border-[#BACEC1]"
                          >
                            <td className="py-3 text-[#325747]">
                              {new Date(log.date_observed).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-[#325747]">
                              {log.behavior_pattern_id?.name || log.custom_behavior}
                            </td>
                            <td className="py-3 text-[#325747]">
                              {log.triggers?.join(', ') || 'None'}
                            </td>
                            <td className="py-3 text-[#325747] capitalize">
                              {log.frequency}
                            </td>
                            <td className="py-3 text-[#325747]">
                              <div className="flex items-center">
                                {Array.from({length: 5}).map((_, i) => (
                                  <FaPaw 
                                    key={i} 
                                    className={`${i < log.intensity ? 'text-[#E59560]' : 'text-gray-300'} mx-0.5`} 
                                    size={12}
                                  />
                                ))}
                              </div>
                            </td>
             <td className="py-3 text-[#325747]">
  <button 
    onClick={() => handleOpenSurvey(log)}
    className={`px-2 py-1 rounded text-xs ${
      log.solutions_tried?.length > 0 ? 
        'bg-green-100 text-green-800' : 
        'bg-gray-100 text-gray-800'
    }`}
  >
    {log.solutions_tried?.length > 0 ? 
      `${log.solutions_tried.length} solution(s)` : 
      'Add solutions'}
  </button>
</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                log.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                log.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex space-x-2">
                                {log.status !== 'resolved' && (
                                  <button 
                                    onClick={() => updateLogStatus(log._id, 'resolved')}
                                    className="text-green-600 hover:text-green-800"
                                    title="Mark as resolved"
                                  >
                                    <FaCheck />
                                  </button>
                                )}
                                {log.status !== 'escalated' && (
                                  <button 
                                    onClick={() => updateLogStatus(log._id, 'escalated')}
                                    className="text-red-600 hover:text-red-800"
                                    title="Escalate to vet"
                                  >
                                    <FaExclamationTriangle />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Pattern Detail Modal */}
        <AnimatePresence>
          {selectedPattern && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedPattern(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-[#325747] text-[#F6F4E8] p-4 flex justify-between items-center sticky top-0 z-10">
                  <h3 className="text-xl font-semibold">{selectedPattern.name}</h3>
                  <button 
                    className="text-2xl hover:text-[#E59560]"
                    onClick={() => setSelectedPattern(null)}
                  >
                    &times;
                  </button>
                </div>
                
                <div className="p-6">
                  <p className="text-[#325747] mb-6">{selectedPattern.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-[#325747] mb-3 border-b border-[#BACEC1] pb-2">
                        Possible Causes
                      </h4>
                      <ul className="space-y-2">
                        {selectedPattern.causes.map((cause, i) => (
                          <li key={i} className="text-[#325747] flex items-start">
                            <span className="inline-block w-2 h-2 bg-[#E59560] rounded-full mt-2 mr-2"></span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-[#325747] mb-3 border-b border-[#BACEC1] pb-2">
                        Recommended Solutions
                      </h4>
                      <ul className="space-y-4">
                        {selectedPattern.solutions.map((solution, i) => (
                          <li key={i} className="text-[#325747]">
                            <div className="font-semibold">{solution.solution}</div>
                            <div className="text-sm text-[#E59560] mb-1">
                              {Math.round(solution.effectiveness * 100)}% effective
                            </div>
                            {solution.steps && (
                              <ol className="list-decimal pl-5 text-sm space-y-1">
                                {solution.steps.map((step, j) => (
                                  <li key={j}>{step}</li>
                                ))}
                              </ol>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {selectedPattern.medical_flags?.needs_vet && (
                    <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
                      <h4 className="font-bold text-red-800 flex items-center">
                        <FaExclamationTriangle className="mr-2" />
                        Medical Warning
                      </h4>
                      <p className="text-red-700 mt-1">
                        This behavior may indicate a medical issue. Consult your vet if:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-red-700">
                        {selectedPattern.medical_flags.red_flags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Q&A*/}
                  {/* Q&A Section */}
<div className="mt-6">
  <div className="flex items-center gap-2 mb-2">
    <input
      type="text"
      value={currentQuestion}
      onChange={(e) => setCurrentQuestion(e.target.value)}
      placeholder="Ask about this behavior..."
      className="flex-1 p-2 border-2 border-[#BACEC1] rounded-lg"
      onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
    />
    <button 
      onClick={handleAskQuestion}
      disabled={aiLoading}
      className="bg-[#325747] text-white px-4 py-2 rounded-lg flex items-center gap-2"
    >
      {aiLoading ? <FaSpinner className="animate-spin" /> : "Ask"}
    </button>
  </div>
  
  {aiAnswer && (
    <div className="mt-3 p-3 bg-[#F6F4E8] rounded-lg">
      <p className="text-[#325747]">{aiAnswer}</p>
      <p className="text-xs mt-2 text-gray-500">
        AI-generated advice. Consult your vet for medical decisions.
      </p>
    </div>
  )}
</div>

<div className="mt-6 flex justify-between">
  <button
    onClick={handleAddToHealthRecords}
    className="bg-[#325747] text-white py-2 px-4 rounded-lg flex items-center gap-2"
  >
    <FaFileMedical />
    Add to Health Records
  </button>
  
  {selectedPattern.medical_flags?.needs_vet && (
    <button
      onClick={() => window.location.href = '/vet/appointments'}
      className="bg-[#E59560] text-white py-2 px-4 rounded-lg flex items-center gap-2"
    >
      <FaClipboardList />
      Book Vet Appointment
    </button>
  )}
</div>
</div>
</motion.div>
</motion.div>
)}
</AnimatePresence>
<AnimatePresence>
  {showSolutionModal && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={() => setShowSolutionModal(false)}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#325747] text-[#F6F4E8] p-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-xl font-semibold">Behavior Solutions</h3>
          <button 
            className="text-2xl hover:text-[#E59560]"
            onClick={() => setShowSolutionModal(false)}
          >
            &times;
          </button>
        </div>
        
        <div className="p-6">
          {/* Suggested Solutions Section */}
          <div className="mb-8">
            <h4 className="font-bold text-[#325747] border-b border-[#BACEC1] pb-2 mb-4">
              Suggested Solutions
            </h4>
            <div className="space-y-6">
             {solutions.map((sol, i) => {
  const triedInfo = currentLog?.solutions_tried?.find(t => t.solution === sol.solution);
  return (
    <div key={i} className="border border-[#E59560] rounded-lg p-4">
      
      
      {sol.source === 'user_submitted' && (
        <div className="mb-2 bg-yellow-50 p-2 rounded text-sm">
          <span className="font-medium">Pet Owner Solution:</span> 
          <span> This was tried by {sol.trialCount || 0} users with </span>
          <span>{Math.round((sol.effectiveness || 0.5) * 100)}% average effectiveness</span>
        </div>
      )}
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {sol.implementation && (
                          <p className="text-sm text-[#325747]">
                            <span className="font-medium">Difficulty:</span> {sol.implementation}
                          </p>
                        )}
                        <p className="text-sm text-[#325747]">
                          <span className="font-medium">Effectiveness:</span> 
                          {sol.source === 'user_submitted' 
                            ? `${Math.round(sol.averageEffectiveness * 100) || Math.round(sol.effectiveness * 100)}% (based on ${sol.trialCount || 1} user reports)` 
                            : `${Math.round(sol.effectiveness * 100)}%`}
                        </p>
                      </div>
                      
                      {sol.steps && sol.steps.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-[#325747] mb-1">Steps:</h6>
                          <ol className="list-decimal pl-5 text-sm space-y-1">
                            {sol.steps.map((step, j) => (
                              <li key={j} className="text-[#325747]">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                    
               
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Additional Solutions Section */}
          {currentLog?.solutions_tried?.filter(s => !s.is_suggested).length > 0 && (
            <div className="mb-8">
              <h4 className="font-bold text-[#325747] border-b border-[#BACEC1] pb-2 mb-4">
                Additional Solutions Tried
              </h4>
              <div className="space-y-4">
                {currentLog.solutions_tried
                  .filter(s => !s.is_suggested)
                  .map((solution, i) => (
                    <div key={i} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-medium">{solution.solution}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          solution.helped_resolve ? 
                            'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                        }`}>
                          {solution.helped_resolve ? 'Helped' : 'Did not help'} ({solution.effectiveness}%)
                        </span>
                      </div>
                      {solution.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Notes:</span> {solution.notes}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
           
            
            <button 
              onClick={() => setShowSolutionModal(false)}
              className="bg-[#325747] text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* Solution Survey Modal */}
{surveyData.logId && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
      <h3 className="text-2xl font-bold mb-4 text-[#325747]" style={{marginLeft:"150px"}}>Behavior Solution Survey</h3>
      
      <div className="space-y-6">
        {/* Suggested Solutions */}
        <div>
          <h4 className="font-semibold mb-3 text-[#E59560]">Suggested Solutions</h4>
          {surveyData.solutions.filter(s => s.is_suggested).map((solution, index) => (
            <div key={index} className="mb-4 p-3 border rounded-lg">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={solution.tried}
                  onChange={(e) => handleSolutionChange(index, 'tried', e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">{solution.solution}</span>
                {solution.source === 'user_submitted' && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Pet Owner Solution
                  </span>
                )}
              </div>
              
              {solution.tried && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block mb-1">Did this help resolve the behavior?</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`helped-${index}`}
                          checked={solution.helped_resolve === true}
                          onChange={() => handleSolutionChange(index, 'helped_resolve', true)}
                          className="mr-2 "
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`helped-${index}`}
                          checked={solution.helped_resolve === false}
                          onChange={() => handleSolutionChange(index, 'helped_resolve', false)}
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-1">
                      Effectiveness: {solution.effectiveness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={solution.effectiveness}
                      onChange={(e) => handleSolutionChange(index, 'effectiveness', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">Notes:</label>
                    <textarea
                      value={solution.notes}
                      onChange={(e) => handleSolutionChange(index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded"
                      rows="2"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Custom Solutions */}
        <div>
          <h4 className="font-semibold mb-3 text-[#E59560]">Additional Solutions You Tried</h4>
          {surveyData.solutions.filter(s => !s.is_suggested).map((solution, index) => (
            <div key={index} className="mb-4 p-3 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{solution.solution}</span>
                <button 
                  onClick={() => {
                    const updated = [...surveyData.solutions];
                    updated.splice(index, 1);
                    setSurveyData({...surveyData, solutions: updated});
                  }}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
              
              <div className="ml-4 space-y-3">
                <div>
                  <label className="block mb-1">Did this help resolve the behavior?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`custom-helped-${index}`}
                        checked={solution.helped_resolve === true}
                        onChange={() => handleSolutionChange(index, 'helped_resolve', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`custom-helped-${index}`}
                        checked={solution.helped_resolve === false}
                        onChange={() => handleSolutionChange(index, 'helped_resolve', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-1">
                    Effectiveness: {solution.effectiveness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={solution.effectiveness}
                    onChange={(e) => handleSolutionChange(index, 'effectiveness', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block mb-1">Notes:</label>
                  <textarea
                    value={solution.notes}
                    onChange={(e) => handleSolutionChange(index, 'notes', e.target.value)}
                    className="w-full p-2 border rounded"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="border-t pt-4 mt-4">
            <h5 className="font-medium mb-2">Add Another Solution You Tried</h5>
            <textarea
              value={surveyData.customSolution}
              onChange={(e) => setSurveyData({...surveyData, customSolution: e.target.value})}
              placeholder="Describe the solution you tried"
              className="w-full p-2 border rounded mb-2"
              rows="2"
            />
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block mb-1">Did it help?</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="custom-helped"
                      checked={surveyData.customHelped === true}
                      onChange={() => setSurveyData({...surveyData, customHelped: true})}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="custom-helped"
                      checked={surveyData.customHelped === false}
                      onChange={() => setSurveyData({...surveyData, customHelped: false})}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block mb-1">Effectiveness: {surveyData.customEffectiveness}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={surveyData.customEffectiveness}
                  onChange={(e) => setSurveyData({...surveyData, customEffectiveness: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
            
            <textarea
              value={surveyData.customNotes}
              onChange={(e) => setSurveyData({...surveyData, customNotes: e.target.value})}
              placeholder="Any notes about this solution"
              className="w-full p-2 border rounded mb-2"
              rows="2"
            />
            
            <button
              onClick={handleAddCustomSolution}
              className="bg-[#E59560] text-white px-4 py-2 rounded"
            >
              Add This Solution
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => setSurveyData({
            logId: null,
            solutions: [],
            customSolution: '',
            customHelped: null,
            customEffectiveness: 50,
            customNotes: ''
          })}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitSurvey}
          className="bg-[#E59560] text-white px-4 py-2 rounded"
          disabled={!surveyData.solutions.some(s => s.tried)}
        >
          Submit Survey
        </button>
      </div>
    </div>
  </div>
)}

      </motion.div>


    </div>
  );
};

export default PetBehaviorAnalysis;
