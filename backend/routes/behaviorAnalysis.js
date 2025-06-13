// routes/behaviorAnalysis.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const BehaviorPattern = require('../models/BehaviorPattern');
const PetBehaviorLog = require('../models/PetBehaviorLog');
const User =  require('../models/User');
const OpenAI = require('openai');
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: "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",
 
});


// Get behavior patterns by species
router.get('/patterns/:species', authMiddleware, async (req, res) => {
  try {
    const patterns = await BehaviorPattern.find({ 
      species: req.params.species 
    }).sort({ name: 1 });
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single behavior pattern by species and ID
router.get('/patterns/:species/:id', authMiddleware, async (req, res) => {
  try {
    // Validate the ID parameter
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const pattern = await BehaviorPattern.findOne({ 
      species: req.params.species,
      _id: new mongoose.Types.ObjectId(req.params.id) // Explicitly create ObjectId
    });

    if (!pattern) {
      return res.status(404).json({ message: 'Behavior pattern not found' });
    }

    res.json(pattern);
  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({ message: error.message });
  }
});

// Log a new behavior observation
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { pet_id, behavior_pattern_id, solutions_tried } = req.body;
    
    if (!pet_id) throw new Error('Pet ID required');
    if (!behavior_pattern_id) throw new Error('Behavior pattern ID required');

    const pattern = await BehaviorPattern.findById(behavior_pattern_id);
    if (!pattern) throw new Error('Behavior pattern not found');

    const newLog = new PetBehaviorLog({
      pet_id,
      user_id: req.user.userId,
      behavior_pattern_id,
      custom_behavior: undefined,
      frequency: req.body.frequency || 'once',
      intensity: req.body.intensity || 1,
      triggers: req.body.triggers || [],
      notes: req.body.notes,
      solutions_tried: solutions_tried.map(sol => ({
        ...sol,
        steps_followed: sol.steps || [] // Ensure steps are saved
      })) || [],
      date_observed: new Date(),
      status: 'active'
    });

    await newLog.save();
    
    res.status(201).json({ 
      log: newLog,
      suggestions: pattern.solutions 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get behavior logs for a pet
router.get('/pet/:petId', authMiddleware, async (req, res) => {
  try {
    const logs = await PetBehaviorLog.find({ 
      pet_id: req.params.petId,
      user_id: req.user.userId 
    }).sort({ date_observed: -1 })
      .populate('behavior_pattern_id', 'name description');
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Add solution to log
router.patch('/log/:logId/solution', authMiddleware, async (req, res) => {
  try {
    const { solution } = req.body;
    const updatedLog = await PetBehaviorLog.findByIdAndUpdate(
      req.params.logId,
      { $push: { solutions_tried: {
        solution: solution.solution,
        date_tried: new Date(),
        effectiveness: solution.effectiveness || 0,
        implementation: solution.implementation || 'medium'
      }}},
      { new: true }
    ).populate('behavior_pattern_id', 'name description');
    
    res.json({ updatedLog });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Submit solution survey
router.post('/log/:logId/solution-survey', authMiddleware, async (req, res) => {
  try {
    const { solutions, customSolutions } = req.body;
    const userId = req.user.userId;
    
    const log = await PetBehaviorLog.findById(req.params.logId)
      .populate('behavior_pattern_id');
    if (!log) throw new Error('Log not found');

    // Prepare all tried solutions (both suggested and custom)
    const triedSolutions = [
      ...(solutions || []).filter(sol => sol.tried),
      ...(customSolutions || []).filter(sol => sol.tried)
    ];

    // Update log with all tried solutions
    log.solutions_tried = triedSolutions.map(sol => ({
      solution: sol.solution,
      is_suggested: sol.is_suggested || false,
      helped_resolve: sol.helped_resolve,
      effectiveness: sol.effectiveness,
      notes: sol.notes,
      steps_followed: sol.steps || [],
      source: sol.source || 'expert',
      solutionId: sol.solutionId,
      triedDate: new Date()
    }));

    // Update log status based on solutions
    const hasHelpfulSolution = triedSolutions.some(sol => sol.helped_resolve);
    log.status = hasHelpfulSolution ? 'resolved' : 
                 triedSolutions.length > 0 ? 'escalated' : 
                 log.status;

    await log.save();
    
    // Handle custom solutions that were helpful
    if (customSolutions && customSolutions.length > 0) {
      const helpfulCustomSolutions = customSolutions.filter(sol => sol.helped_resolve);
      
      if (helpfulCustomSolutions.length > 0 && log.behavior_pattern_id) {
        // Add helpful custom solutions to the behavior pattern
        for (const customSol of helpfulCustomSolutions) {
          const newSolution = {
            solution: customSol.solution,
            effectiveness: customSol.effectiveness / 100, // Convert to decimal
            implementation: 'medium',
            steps: customSol.steps || [],
            source: 'user_submitted',
            submitted_by: userId,
            submission_date: new Date(),
            trialCount: 1, // Initial count
            totalEffectiveness: customSol.effectiveness // Track total for averaging
          };
          
          await BehaviorPattern.findByIdAndUpdate(
            log.behavior_pattern_id._id,
            { $push: { solutions: newSolution } }
          );

          // Also save to user's profile
          await User.findByIdAndUpdate(
            userId,
            { $push: { submittedSolutions: {
              solution: customSol.solution,
              behaviorPatternId: log.behavior_pattern_id._id,
              dateSubmitted: new Date(),
              effectiveness: customSol.effectiveness / 100
            }}}
          );
        }
      }
    }

    // Update effectiveness for pet owner solutions
    for (const solution of triedSolutions) {
      if (solution.source === 'user_submitted' && solution.solutionId) {
        // Find the behavior pattern containing this solution
        const pattern = await BehaviorPattern.findOne({
          'solutions._id': solution.solutionId
        });
        
        if (pattern) {
          const userSolution = pattern.solutions.id(solution.solutionId);
          if (userSolution) {
            // Calculate new average effectiveness
            if (!userSolution.trialCount) userSolution.trialCount = 0;
            if (!userSolution.totalEffectiveness) userSolution.totalEffectiveness = 0;
            
            userSolution.trialCount += 1;
            userSolution.totalEffectiveness += solution.effectiveness;
            userSolution.effectiveness = userSolution.totalEffectiveness / userSolution.trialCount / 100;
            
            await pattern.save();
          }
        }
      }
    }
    
    res.json({ 
      success: true,
      log: log
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get behavior analysis summary for a pet
router.get('/analysis/:petId', authMiddleware, async (req, res) => {
  try {
    const logs = await PetBehaviorLog.find({ 
      pet_id: req.params.petId,
      user_id: req.user.userId,
      status: 'active'
    }).populate('behavior_pattern_id');
    
    // Categorize behaviors by urgency
    const analysis = {
      urgent: [],
      concerning: [],
      normal: []
    };
    
    logs.forEach(log => {
      if (log.behavior_pattern_id?.medical_flags?.needs_vet) {
        analysis.urgent.push(log);
      } else if (log.intensity > 3 || log.frequency === 'constantly') {
        analysis.concerning.push(log);
      } else {
        analysis.normal.push(log);
      }
    });
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// routes/behaviorAnalysis.js
router.post('/match-behavior', authMiddleware, async (req, res) => {
  try {
    const { description, species } = req.body;
    
    const allBehaviors = await BehaviorPattern.find({ species })
      .select('name description keywords solutions categories causes medical_flags');

    // Score behaviors based on match quality
    const scoredBehaviors = allBehaviors.map(behavior => {
      let score = 0;
      let matchType = 'none';

      // 1. Exact name match (highest priority)
      const namePattern = new RegExp(`\\b${behavior.name.replace(/_/g, '[-_\\s]')}\\b`, 'i');
      if (namePattern.test(description)) {
        score = 100;
        matchType = 'exact_name';
        return { behavior, score, matchType };
      }

      // 2. Keyword matching
      const allKeywords = [
        ...behavior.name.split('_').filter(w => w.length > 3),
        ...(behavior.keywords || []),
        ...behavior.description.split(/\W+/).filter(w => w.length > 4)
      ];
      const uniqueKeywords = [...new Set(allKeywords)];

      const keywordMatches = uniqueKeywords.filter(keyword => {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const keywordPattern = new RegExp(`\\b${escaped.replace(/\s+/g, '\\s+')}\\b`, 'i');
        return keywordPattern.test(description);
      });

      if (keywordMatches.length > 0) {
        // More keyword matches = higher score
        score = 50 + (keywordMatches.length * 5);
        matchType = 'keyword';
      }

      // 3. Semantic similarity
      const behaviorWords = behavior.description.toLowerCase().split(/\W+/);
      const descWords = description.toLowerCase().split(/\W+/);
      const commonWords = behaviorWords.filter(word => 
        word.length > 3 && descWords.includes(word)
      );

      if (commonWords.length >= 3) {
        // Higher than current score? Update
        const semanticScore = 30 + (commonWords.length * 3);
        if (semanticScore > score) {
          score = semanticScore;
          matchType = 'semantic';
        }
      }

      return { behavior, score, matchType };
    });

    // Filter out non-matches and sort by score
    const validMatches = scoredBehaviors.filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);

    if (validMatches.length > 0) {
      // Return only the top match
      const bestMatch = validMatches[0];
      return res.json({ 
        matches: [bestMatch.behavior], 
        source: 'database',
        matchType: bestMatch.matchType,
        confidence: bestMatch.score 
      });
    }

    // 4. Only if no matches found, create new
    const newPattern = await createNewBehaviorPattern(description, species);
    return res.json({ 
      matches: [newPattern], 
      source: 'ai-generated',
      matchType: 'new',
      confidence: 0 
    });
    
  } catch (error) {
    console.error('Error matching behavior:', error);
    res.status(500).json({ message: 'Error matching behavior', error: error.message });
  }
});

async function createNewBehaviorPattern(description, species) {
  const prompt = `You're a veterinary behavior expert. Analyze this pet behavior description:

  "${description}"

  Species: ${species}

  Before creating a new behavior pattern:

  1. Consider if this fits any common general behavior categories:
     - null_behavior (lethargy, no interaction)
     - hiding_behavior
     - scratching_behavior
     - excessive_vocalization
     - etc.

  2. Only create a specific new pattern if it's truly unique and doesn't fit existing categories.

  3. If it fits a general category, use that instead of creating something overly specific.

  Return a complete JSON object matching this schema if a new pattern is truly needed:
  {
    "species": ["${species}"],
    "name": "general_category_name", // Prefer general categories
    "description": "detailed description",
    "categories": ["category1", "category2"],
    "keywords": ["keyword1", "keyword2"],
    "causes": ["cause1", "cause2"],
    "solutions": [{
      "solution": "solution description",
      "effectiveness": 0.8,
      "implementation": "easy|medium|hard",
      "steps": ["step1", "step2"]
    }],
    "medical_flags": {
      "needs_vet": false,
      "urgency": null,
      "red_flags": [],
      "related_conditions": []
    },
    "prevention_tips": ["tip1", "tip2"]
  }

  If this behavior clearly fits an existing general category, return ONLY this:
  {"use_existing": "general_category_name"}`;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(aiResponse.choices[0].message.content);

    // If AI suggests using an existing category
    if (response.use_existing) {
      const existingPattern = await BehaviorPattern.findOne({
        species,
        name: response.use_existing
      });
      if (existingPattern) return existingPattern;
    }

    // Ensure all required fields are present
    const newPatternData = {
      species: response.species || [species],
      name: response.name || `custom_${Date.now()}`,
      description: response.description || description,
      categories: response.categories || ['custom'],
      keywords: response.keywords || [],
      causes: response.causes || ['Unknown'],
      solutions: response.solutions || [{
        solution: 'Consult a veterinarian or behaviorist',
        effectiveness: 0.5,
        implementation: 'medium',
        steps: ['Schedule a vet visit', 'Document behavior patterns']
      }],
      medical_flags: response.medical_flags || {
        needs_vet: false,
        urgency: null,
        red_flags: [],
        related_conditions: []
      },
      prevention_tips: response.prevention_tips || [],
      id: `${species.toUpperCase()}_${Date.now()}`,
      last_updated: new Date()
    };

    const newPattern = new BehaviorPattern(newPatternData);
    await newPattern.save();
    return newPattern;
  } catch (error) {
    console.error('Error creating new pattern:', error);
    // Fallback pattern if AI fails
    return new BehaviorPattern({
      species: [species],
      name: `custom_${Date.now()}`,
      description: description,
      categories: ['custom'],
      keywords: [],
      causes: ['Unknown'],
      solutions: [{
        solution: 'Consult a veterinarian or behaviorist',
        effectiveness: 0.5,
        implementation: 'medium',
        steps: ['Schedule a vet visit', 'Document behavior patterns']
      }],
      medical_flags: {
        needs_vet: false,
        urgency: null,
        red_flags: [],
        related_conditions: []
      },
      id: `${species.toUpperCase()}_${Date.now()}`,
      last_updated: new Date()
    });
  }
}

// Add to your backend (routes/behaviorAnalysis.js)
router.get('/trends/:petId', authMiddleware, async (req, res) => {
  const logs = await PetBehaviorLog.aggregate([
    { $match: { pet_id: mongoose.Types.ObjectId(req.params.petId) } },
    { $group: { 
      _id: "$behavior_pattern_id",
      count: { $sum: 1 },
      avgIntensity: { $avg: "$intensity" },
      lastOccurred: { $max: "$date_observed" }
    }},
    { $lookup: {
      from: "behaviorpatterns",
      localField: "_id",
      foreignField: "_id",
      as: "pattern"
    }},
    { $unwind: "$pattern" }
  ]);
  res.json(logs);
});

// Update log status
router.patch('/log/:logId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedLog = await PetBehaviorLog.findByIdAndUpdate(
      req.params.logId,
      { status },
      { new: true }
    ).populate('behavior_pattern_id', 'name description');
    
    res.json({ updatedLog });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// AI question endpoint
router.post('/ask', authMiddleware, async (req, res) => {
  try {
    const { question, patternId } = req.body;
    const pattern = await BehaviorPattern.findById(patternId);
    
    if (!pattern) {
      return res.status(404).json({ message: 'Behavior pattern not found' });
    }

    const prompt = `As a veterinary behavior expert, answer this question about ${pattern.name} behavior:
    Question: ${question}
    
    Context about this behavior:
    ${pattern.description}
    
    Possible causes:
    ${pattern.causes.join('\n')}
    
    Recommended solutions:
    ${pattern.solutions.map(s => s.solution).join('\n')}
    
    Provide a concise, professional answer. If medical advice is needed, recommend consulting a vet.`;
    
    const aiResponse = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });
    
    res.json({ answer: aiResponse.choices[0].message.content });
  } catch (error) {
    console.error('AI question error:', error);
    res.status(500).json({ message: 'Failed to get AI response' });
  }
});

module.exports = router;