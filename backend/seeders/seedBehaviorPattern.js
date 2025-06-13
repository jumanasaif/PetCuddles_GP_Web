const mongoose = require('mongoose');
const BehaviorPattern = require('../models/BehaviorPattern');

mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB')
  .then(() => {
    console.log('MongoDB connected...');
    seedBehaviorPattern();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

  const behaviorPatterns = [
  // ==================== CAT BEHAVIORS ====================

  // ==================== CONTENTMENT AND AFFECTION BEHAVIORS ====================
  {
    species: ['cat'],
    id: 'CAT_CONTENT_001',
    name: 'purring',
    description: 'A rhythmic vocalization indicating happiness and contentment, though can sometimes indicate stress or pain in certain contexts',
    categories: ['contentment', 'vocalization', 'stress_indicator'],
    keywords: ['purr', 'vibrating sound', 'happy cat', 'content', 'comfort', 'pain', 'stress', 'healing', 'self-soothing', 'vibration'],
    causes: [
      "Contentment and relaxation",
      "Bonding with owner",
      "Self-soothing during stress",
      "Healing response (purring frequencies promote bone healing)",
      "Pain or distress (context-dependent)"
    ],
    solutions: [
      {
        solution: "Respond appropriately based on context",
        effectiveness: 0.9,
        implementation: "easy",
        steps: [
          "Observe body language (relaxed = happy, tense = possible distress)",
          "Pet gently if cat seems content",
          "Provide space if signs of stress are present",
          "Consult vet if purring seems pain-related"
        ]
      }
    ],
    medical_flags: {
      needs_vet: false,
      urgency: null,
      red_flags: ["Purring combined with hiding", "Purring without visible contentment", "Purring during palpation of painful areas"],
      related_conditions: ["Chronic pain", "Stress-related disorders"]
    }
  },
  {
    species: ['cat'],
    id: 'CAT_CONTENT_002',
    name: 'kneading',
    description: 'Rhythmic pushing of paws against soft surfaces, often called "making biscuits"',
    categories: ['contentment', 'instinctual', 'affection'],
    keywords: ['biscuit making', 'paw pushing', 'nursing behavior', 'happy cat', 'comfort', 'blanket', 'lap', 'kitten behavior', 'scent marking'],
    causes: [
      "Remnant of kitten nursing behavior",
      "Scent marking from paw glands",
      "Creating comfortable resting area",
      "Showing contentment and relaxation",
      "Pre-sleep ritual"
    ],
    solutions: [
      {
        solution: "Provide appropriate surfaces for kneading",
        effectiveness: 0.95,
        implementation: "easy",
        steps: [
          "Offer soft blankets or pillows",
          "Trim nails regularly to prevent snagging",
          "Use protective lap cover if claws are uncomfortable",
          "Enjoy this sign of feline contentment"
        ]
      }
    ],
    medical_flags: {
      needs_vet: false,
      red_flags: ["Excessive kneading to the point of paw injury", "Avoiding weight on certain paws"],
      related_conditions: []
    }
  },
  {
    species: ['cat'],
    id: 'CAT_CONTENT_003',
    name: 'belly_exposure',
    description: 'Cat rolls over to expose belly, indicating trust but not always an invitation for belly rubs',
    categories: ['trust', 'body_language', 'social_behavior'],
    keywords: ['belly up', 'trust display', 'vulnerability', 'defensive position', 'trap', 'happy cat', 'relaxed', 'submission', 'play invitation'],
    causes: [
      "Showing trust in environment",
      "Thermoregulation (cooling down)",
      "Defensive posture (when threatened)",
      "Play invitation (context-dependent)",
      "Stretching comfortably"
    ],
    solutions: [
      {
        solution: "Interpret context correctly",
        effectiveness: 0.85,
        implementation: "medium",
        steps: [
          "Observe other body language signs",
          "Avoid automatic belly rubs (many cats dislike this)",
          "Offer gentle pets on head if cat seems relaxed",
          "Recognize defensive posture (hissing, ears back with belly exposure)"
        ]
      }
    ],
    medical_flags: {
      needs_vet: false,
      red_flags: ["Constant belly exposure with lethargy", "Guarding belly area"],
      related_conditions: []
    }
  },

  // ==================== FEAR AND ANXIETY BEHAVIORS ====================
  {
    species: ['cat'],
    id: 'CAT_FEAR_001',
    name: 'hiding',
    description: 'Cat seeks enclosed spaces or concealed areas to avoid interaction or perceived threats',
    categories: ['fear', 'stress', 'environmental_response'],
    keywords: ['under bed', 'in closet', 'hidden', 'avoidance', 'new environment', 'stress', 'anxiety', 'safe space', 'withdrawn', 'not coming out'],
    causes: [
      "New environment stress",
      "Loud noises (thunder, fireworks)",
      "Introduction of new pets/people",
      "Medical issues causing discomfort",
      "Past trauma or negative experiences"
    ],
    solutions: [
      {
        solution: "Create safe spaces and reduce stressors",
        effectiveness: 0.9,
        implementation: "medium",
        steps: [
          "Provide multiple hiding options (covered beds, boxes)",
          "Use Feliway or other calming pheromones",
          "Maintain consistent routines",
          "Allow cat to emerge at own pace",
          "Consult vet if hiding persists more than 48 hours"
        ]
      }
    ],
    medical_flags: {
      needs_vet: true,
      urgency: "within_week",
      red_flags: ["Hiding combined with not eating", "Hiding after known trauma", "Hiding with other behavior changes"],
      related_conditions: ["Anxiety disorders", "Hyperthyroidism", "Chronic pain"]
    }
  },
  {
    species: ['cat'],
    id: 'CAT_FEAR_002',
    name: 'tail_tucked',
    description: 'Tail held low or tucked between legs indicating fear or submission',
    categories: ['fear', 'body_language', 'stress'],
    keywords: ['tail between legs', 'low tail', 'scared', 'anxious', 'submissive', 'frightened', 'nervous', 'stressed', 'body language'],
    causes: [
      "Fear of other animals",
      "Loud or unfamiliar noises",
      "Negative past experiences",
      "Pain or discomfort",
      "General anxiety"
    ],
    solutions: [
      {
        solution: "Reduce stressors and build confidence",
        effectiveness: 0.8,
        implementation: "medium",
        steps: [
          "Identify and remove stress sources when possible",
          "Create vertical spaces for confidence building",
          "Use positive reinforcement training",
          "Consider pheromone diffusers",
          "Consult vet or behaviorist if persistent"
        ]
      }
    ],
    medical_flags: {
      needs_vet: false,
      red_flags: ["Constant tail tucking", "Combined with other fear behaviors"],
      related_conditions: ["Chronic stress", "Anxiety disorders"]
    }
  },

  // ==================== AGGRESSION BEHAVIORS ====================
  {
    species: ['cat'],
    id: 'CAT_AGGR_001',
    name: 'hissing_growling',
    description: 'Vocal warnings indicating cat feels threatened and may escalate to aggression',
    categories: ['aggression', 'warning', 'defensive'],
    keywords: ['hiss', 'growl', 'warning', 'back off', 'threatened', 'defensive', 'angry', 'fearful', 'aggressive posture', 'ears back'],
    causes: [
      "Feeling cornered or trapped",
      "Protection of territory",
      "Fear of other animals/people",
      "Pain-induced aggression",
      "Redirected aggression"
    ],
    solutions: [
      {
        solution: "Give space and remove threats",
        effectiveness: 0.95,
        implementation: "easy",
        steps: [
          "Stop approaching/interacting immediately",
          "Allow escape route for cat",
          "Identify and remove trigger if possible",
          "Use barriers if necessary for safety",
          "Consult behaviorist if frequent"
        ]
      }
    ],
    medical_flags: {
      needs_vet: true,
      urgency: "within_week",
      red_flags: ["Unexplained sudden aggression", "Aggression with no apparent trigger"],
      related_conditions: ["Pain-related aggression", "Neurological issues"]
    }
  },
  {
    species: ['cat'],
    id: 'CAT_AGGR_002',
    name: 'piloerection',
    description: 'Fur standing up (puffed up) to appear larger when threatened',
    categories: ['aggression', 'fear', 'body_language'],
    keywords: ['puffed up', 'fur standing', 'halloween cat', 'arched back', 'threat display', 'frightened', 'aggressive', 'bottlebrush tail', 'defensive'],
    causes: [
      "Encounter with other animals",
      "Sudden loud noises",
      "Territorial disputes",
      "Fear response",
      "Play aggression"
    ],
    solutions: [
      {
        solution: "De-escalate the situation",
        effectiveness: 0.85,
        implementation: "medium",
        steps: [
          "Remove triggering stimulus if possible",
          "Avoid direct eye contact",
          "Provide escape route for cat",
          "Use calming pheromones",
          "Implement gradual desensitization if recurring"
        ]
      }
    ],
    medical_flags: {
      needs_vet: false,
      red_flags: ["Constant piloerection", "Combined with other neurological symptoms"],
      related_conditions: []
    }
  },

  // ==================== OTHER BEHAVIORS ====================
  {
    species: ['cat'],
    id: 'CAT_OTHER_001',
    name: 'excessive_meowing',
    description: 'Increased vocalization beyond normal communication needs, often directed at humans',
    categories: ['vocalization', 'attention_seeking', 'medical'],
    keywords: ['yowling', 'crying', 'vocal', 'talkative', 'night meowing', 'senior cat', 'demanding', 'attention', 'hunger', 'disorientation'],
    causes: [
      "Attention seeking",
      "Hunger or anticipation of food",
      "Cognitive dysfunction in seniors",
      "Hyperthyroidism",
      "Hearing loss (cats vocalize louder)"
    ],
    solutions: [
      {
        solution: "Address underlying cause",
        effectiveness: 0.9,
        implementation: "medium",
        steps: [
          "Rule out medical causes with vet visit",
          "Establish consistent feeding schedule",
          "Provide environmental enrichment",
          "Ignore demand meowing (don't reward)",
          "Consider night lights for senior cats"
        ]
      }
    ],
    medical_flags: {
      needs_vet: true,
      urgency: "within_week",
      red_flags: ["Nighttime yowling in seniors", "Change in vocalization pattern", "Combined with weight loss"],
      related_conditions: ["Hyperthyroidism", "Cognitive dysfunction", "Hypertension"]
    }
  },
  {
    species: ['cat'],
    id: 'CAT_OTHER_002',
    name: 'inappropriate_elimination',
    description: 'Urinating or defecating outside the litter box, one of the most common behavior issues',
    categories: ['litter_box', 'stress', 'medical'],
    keywords: ['peeing outside box', 'pooping outside box', 'litter box avoidance', 'spraying', 'marking', 'house soiling', 'urine marking', 'fecal marking'],
    causes: [
      "Litter box cleanliness issues",
      "Litter type or box location preferences",
      "Urinary tract infection",
      "Stress or anxiety",
      "Territorial marking"
    ],
    solutions: [
      {
        solution: "Systematic litter box management",
        effectiveness: 0.85,
        implementation: "medium",
        steps: [
          "Rule out medical causes first",
          "Provide one box per cat plus one extra",
          "Clean boxes daily, full change weekly",
          "Try different litter types/locations",
          "Use enzymatic cleaners on soiled areas"
        ]
      }
    ],
    medical_flags: {
      needs_vet: true,
      urgency: "within_24h",
      red_flags: ["Straining to urinate", "Blood in urine", "Increased frequency"],
      related_conditions: ["Feline Lower Urinary Tract Disease", "Arthritis", "Kidney disease"]
    }
  },
  {
    species: ['cat'],
    id: 'CAT_OTHER_003',
    name: 'chattering',
    description: 'Rapid teeth-chattering or chirping sound when observing prey',
    categories: ['hunting', 'vocalization', 'frustration'],
    keywords: ['ekekek', 'chirping', 'bird watching', 'prey excitement', 'frustration', 'window watching', 'hunting instinct', 'teeth chattering'],
    causes: [
      "Frustrated hunting instinct",
      "Excitement at seeing prey",
      "Mimicking bird calls (controversial theory)",
      "Anticipatory behavior",
      "Play excitement"
    ],
    solutions: [
      {
        solution: "Provide appropriate hunting outlets",
        effectiveness: 0.8,
        implementation: "easy",
        steps: [
          "Provide interactive toys that mimic prey",
          "Schedule regular play sessions",
          "Consider outdoor enclosure ('catio')",
          "Use food puzzles to engage hunting instinct",
          "Accept as normal feline behavior"
        ]
      }
    ],
    medical_flags: {
      needs_vet: false,
      red_flags: ["Chattering without visible stimulus", "Combined with drooling or jaw pain"],
      related_conditions: []
    }
  },
  {
  species: ['cat'],
  id: 'CAT_SLEEP_001',
  name: 'night-time wakefulness',
  description: 'The cat frequently wakes its owner during the night, meowing, knocking things over, or walking on them while they sleep.',
  categories: ['sleep', 'attention-seeking', 'disruptive_behavior'],
  keywords: ['wakes me up', 'night activity', 'meowing at night', 'nocturnal', 'restless at night', 'disrupts sleep', 'early morning wake-up'],
  causes: [
    "Crepuscular nature (active at dawn/dusk)",
    "Lack of stimulation during the day",
    "Hunger or feeding routine",
    "Loneliness or attention-seeking",
    "Anxiety or disorientation (especially in older cats)"
  ],
  solutions: [
    {
      solution: "Adjust feeding and play schedule",
      effectiveness: 0.9,
      implementation: "medium",
      steps: [
        "Feed the cat just before bedtime",
        "Engage in active play sessions in the evening",
        "Ignore attention-seeking behavior during the night",
        "Consider an automatic feeder for early morning meals",
        "Provide nighttime enrichment like puzzle feeders or soft toys"
      ]
    }
  ],
  medical_flags: {
    needs_vet: false,
    red_flags: ["Sudden change in sleep pattern", "Excessive vocalization in older cats (possible cognitive decline)"],
    related_conditions: ["Cognitive Dysfunction Syndrome", "Hyperthyroidism (if meowing is excessive)"]
  }
},



  // ==================== DOG BEHAVIORS ====================
  {
    species: ['dog'],
    breed_specific: ["Terriers", "Herding breeds"],
    id: 'DOG_BARK_001',
    name: 'excessive_barking',
    description: 'Dog barks excessively at noises, people, or other animals',
    categories: ['alert', 'anxiety', 'boredom'],
    causes: [
      "Alerting to perceived threats",
      "Separation anxiety",
      "Lack of exercise",
      "Attention-seeking",
      "Territorial behavior"
    ],
    solutions: [
      {
        solution: "Increase daily exercise and mental stimulation",
        effectiveness: 0.9,
        implementation: "medium",
        steps: [
          "Add 30 minutes of walking per day",
          "Use puzzle toys for meals",
          "Practice obedience training 10 min/day"
        ],
        resources: [
          {
            type: "article",
            url: "https://example.com/dog-exercise-guide",
            title: "Exercise Requirements by Breed"
          }
        ]
      },
      {
        solution: "Desensitization to triggers",
        effectiveness: 0.85,
        implementation: "hard",
        steps: [
          "Record trigger sounds at low volume",
          "Play while giving high-value treats",
          "Gradually increase volume over weeks"
        ]
      }
    ],
    frequency_advice: [
      {
        level: "low",
        message: "Normal alert behavior - manage environment",
        actions: ["Close curtains", "Use white noise machine"],
        severity: 1
      },
      {
        level: "high",
        message: "May indicate distress - professional help recommended",
        actions: [
          "Consult certified trainer",
          "Rule out separation anxiety",
          "Consider anxiety medication if severe"
        ],
        severity: 3
      }
    ],
    medical_flags: {
      needs_vet: false,
      urgency: null,
      red_flags: [
        "Barking at nothing visible",
        "Accompanied by destructive chewing"
      ],
      related_conditions: ["Cognitive Dysfunction Syndrome (in seniors)"]
    },
    age_related: {
      is_common: false,
      typical_age_range: "Any age"
    },
    prevention_tips: [
      "Proper socialization as puppy",
      "Consistent training",
      "Meeting exercise needs"
    ],
    video_examples: [
      "https://example.com/videos/barking-training"
    ]
  },

  {
    species: ['dog'],
    breed_specific: ["Labrador Retriever", "Golden Retriever"],
    id: 'DOG_JUMP_002',
    name: 'jumping_on_people',
    description: 'Dog jumps up to greet people',
    categories: ['excitement', 'attention-seeking'],
    causes: [
      "Greeting behavior",
      "Seeking attention",
      "Improper training",
      "Excess energy"
    ],
    solutions: [
      {
        solution: "Turn and ignore when jumping occurs",
        effectiveness: 0.8,
        implementation: "easy",
        steps: [
          "Cross arms and turn back",
          "No eye contact or verbal response",
          "Reward only when all paws are floor"
        ]
      },
      {
        solution: "Teach alternative greeting behavior",
        effectiveness: 0.85,
        implementation: "medium",
        steps: [
          "Train 'sit' command thoroughly",
          "Require sit before greeting",
          "Practice with controlled visitors"
        ]
      }
    ],
    frequency_advice: [
      {
        level: "low",
        message: "Normal excited greeting - consistent training needed",
        actions: ["Practice daily with household members"],
        severity: 1
      },
      {
        level: "high",
        message: "May risk injury to children/elderly",
        actions: [
          "Implement strict management",
          "Consult trainer if persistent"
        ],
        severity: 2
      }
    ],
    medical_flags: {
      needs_vet: false,
      urgency: null,
      red_flags: [],
      related_conditions: []
    },
    age_related: {
      is_common: true,
      typical_age_range: "Puppies and young dogs"
    },
    prevention_tips: [
      "Teach polite greetings from puppyhood",
      "Reward calm behavior",
      "Manage greetings with leash if needed"
    ],
    video_examples: [
      "https://example.com/videos/jumping-solution"
    ]
  }
];

const emergencyBehaviors = [
  // Cat emergencies
    {
    species: ['cat'],
    id: 'CAT_EMER_001',
    name: 'acute_aggression',
    description: 'Sudden unprovoked aggressive behavior with no apparent trigger',
    categories: ['medical', 'emergency', 'aggression'],
    keywords: ['sudden aggression', 'unprovoked attack', 'personality change', 'confusion', 'disorientation', 'agitation', 'neurological', 'pain'],
    causes: [
      "Head trauma",
      "Toxicity exposure",
      "Neurological disorder",
      "Severe pain",
      "Metabolic imbalance"
    ],
    solutions: [
      {
        solution: "Immediate veterinary attention",
        effectiveness: 1.0,
        implementation: "easy",
        steps: [
          "Safely contain cat in carrier",
          "Avoid handling if aggressive",
          "Transport to emergency vet",
          "Note any possible toxin exposures"
        ]
      }
    ],
    medical_flags: {
      needs_vet: true,
      urgency: "immediate",
      red_flags: [
        "Sudden behavior change",
        "Pupils dilated",
        "Disorientation",
        "Unprovoked aggression"
      ],
      related_conditions: ["Head trauma", "Toxicity", "Hyperthyroidism", "Brain tumor"]
    },
    age_related: {
      is_common: false,
      typical_age_range: "Any age"
    },
    prevention_tips: [
      "Regular vet checkups",
      "Cat-proof home",
      "Monitor for subtle early signs"
    ],
    video_examples: []
  },
  

  // Dog emergencies
  {
    species: ['dog'],
    breed_specific: ["Great Dane", "German Shepherd", "Standard Poodle"],
    id: 'DOG_EMER_001',
    name: 'bloat',
    description: 'Unproductive vomiting with distended abdomen',
    categories: ['medical', 'emergency'],
    causes: [
      "Genetic predisposition",
      "Eating too quickly",
      "Exercise after eating"
    ],
    solutions: [
      {
        solution: "Emergency veterinary treatment",
        effectiveness: 1.0,
        implementation: "easy",
        steps: [
          "Transport to vet immediately",
          "Do not attempt home treatment",
          "Keep dog calm during transport"
        ]
      }
    ],
    frequency_advice: [
      {
        level: "high",
        message: "Life-threatening emergency - immediate action required",
        actions: ["Call emergency vet", "Prepare for possible surgery"],
        severity: 3
      }
    ],
    medical_flags: {
      needs_vet: true,
      urgency: "immediate",
      red_flags: [
        "Distended abdomen",
        "Unproductive vomiting",
        "Pacing and restlessness"
      ],
      related_conditions: ["Gastric Dilatation-Volvulus (GDV)"]
    },
    age_related: {
      is_common: true,
      typical_age_range: "Adult to senior dogs"
    },
    prevention_tips: [
      "Feed multiple small meals",
      "Avoid exercise after eating",
      "Consider prophylactic gastropexy for at-risk breeds"
    ],
    video_examples: []
  }
];

async function seedBehaviorPattern() {
  try {
    await BehaviorPattern.deleteMany({});
    
    // Insert regular behaviors
    await BehaviorPattern.insertMany(behaviorPatterns);
    
    // Insert emergency behaviors (already formatted to match schema)
    await BehaviorPattern.insertMany(emergencyBehaviors);
    
    console.log('Database seeded successfully with complete behavior patterns');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedBehaviorPattern();