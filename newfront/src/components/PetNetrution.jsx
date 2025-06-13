import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaHistory, FaArrowUp, FaArrowDown } from 'react-icons/fa';import Header from "./header";
// Default weight ranges (fallback when breed data isn't available)
const DEFAULT_WEIGHTS = {
  dog: {
    small: { min: 2, max: 10, category: 'small dogs' },
    medium: { min: 10, max: 25, category: 'medium dogs' },
    large: { min: 25, max: 45, category: 'large dogs' },
    giant: { min: 45, max: 90, category: 'giant dogs' }
  },
  cat: {
    small: { min: 2, max: 4, category: 'small cats' },
    medium: { min: 4, max: 6, category: 'medium cats' },
    large: { min: 6, max: 10, category: 'large cats' }
  },
  rabbit: {
    small: { min: 0.7, max: 1.5, category: 'small rabbits' },
    medium: { min: 1.5, max: 3.0, category: 'medium rabbits' },
    large: { min: 3.0, max: 5.0, category: 'large rabbits' }
  },
  bird: {
    small: { min: 0.02, max: 0.05, category: 'small birds' },
    medium: { min: 0.05, max: 0.3, category: 'medium birds' },
    large: { min: 0.3, max: 1.5, category: 'large birds' }
  },
  sheep: {
    small: { min: 30, max: 50, category: 'small sheep' },
    medium: { min: 50, max: 80, category: 'medium sheep' },
    large: { min: 80, max: 120, category: 'large sheep' }
  },
  cow: {
    small: { min: 300, max: 500, category: 'small cows' },
    medium: { min: 400, max: 600, category: 'medium cows' },
    large: { min: 600, max: 900, category: 'large cows' }
  }
};

// Breed to weight mapping for all species
const BREED_WEIGHT_MAPPING = {
  dog: {
    'affenpinscher': { min: 3, max: 6, category: 'small' },
    'african': { min: 45, max: 70, category: 'large' },
    'airedale': { min: 18, max: 25, category: 'medium' },
    'akita': { min: 32, max: 45, category: 'large' },
    'appenzeller': { min: 22, max: 32, category: 'medium' },
    'australian shepherd': { min: 18, max: 30, category: 'medium' },
    'basenji': { min: 9, max: 11, category: 'small' },
    'beagle': { min: 9, max: 11, category: 'small' },
    'bluetick': { min: 18, max: 27, category: 'medium' },
    'borzoi': { min: 27, max: 45, category: 'large' },
    'bouvier': { min: 27, max: 45, category: 'large' },
    'boxer': { min: 25, max: 32, category: 'large' },
    'brabancon': { min: 3, max: 6, category: 'small' },
    'briard': { min: 25, max: 40, category: 'large' },
    'buhund': { min: 12, max: 18, category: 'small' },
    'bulldog': { min: 18, max: 25, category: 'medium' },
    'bullterrier': { min: 22, max: 32, category: 'medium' },
    'cattledog': { min: 16, max: 22, category: 'medium' },
    'chihuahua': { min: 1.5, max: 3, category: 'small' },
    'chow': { min: 20, max: 32, category: 'medium' },
    'clumber': { min: 25, max: 39, category: 'large' },
    'cockapoo': { min: 4, max: 11, category: 'small' },
    'collie': { min: 22, max: 32, category: 'medium' },
    'coonhound': { min: 20, max: 36, category: 'large' },
    'corgi': { min: 9, max: 14, category: 'small' },
    'cotondetulear': { min: 3.5, max: 6, category: 'small' },
    'dachshund': { min: 7, max: 14, category: 'small' },
    'dalmatian': { min: 20, max: 27, category: 'medium' },
    'dane': { min: 50, max: 86, category: 'giant' },
    'deerhound': { min: 34, max: 50, category: 'giant' },
    'dhole': { min: 12, max: 20, category: 'medium' },
    'dingo': { min: 13, max: 20, category: 'medium' },
    'doberman': { min: 30, max: 40, category: 'large' },
    'elkhound': { min: 18, max: 24, category: 'medium' },
    'entlebucher': { min: 18, max: 30, category: 'medium' },
    'eskimo': { min: 18, max: 27, category: 'medium' },
    'finnish lapphund': { min: 15, max: 24, category: 'medium' },
    'frise': { min: 3, max: 6, category: 'small' },
    'germanshepherd': { min: 22, max: 40, category: 'large' },
    'greyhound': { min: 27, max: 32, category: 'large' },
    'groenendael': { min: 20, max: 30, category: 'medium' },
    'havanese': { min: 3, max: 6, category: 'small' },
    'hound': { min: 20, max: 36, category: 'large' },
    'husky': { min: 16, max: 27, category: 'medium' },
    'keeshond': { min: 14, max: 18, category: 'small' },
    'kelpie': { min: 14, max: 20, category: 'medium' },
    'komondor': { min: 36, max: 45, category: 'large' },
    'kuvasz': { min: 32, max: 52, category: 'large' },
    'labrador': { min: 25, max: 36, category: 'large' },
    'leonberg': { min: 45, max: 77, category: 'giant' },
    'lhasa': { min: 5, max: 8, category: 'small' },
    'malamute': { min: 34, max: 39, category: 'large' },
    'malinois': { min: 25, max: 34, category: 'large' },
    'maltese': { min: 2, max: 4, category: 'small' },
    'mastiff': { min: 54, max: 100, category: 'giant' },
    'mexicanhairless': { min: 4, max: 8, category: 'small' },
    'mix': { min: 5, max: 45, category: 'medium' },
    'mountain': { min: 18, max: 23, category: 'medium' },
    'newfoundland': { min: 45, max: 68, category: 'giant' },
    'otterhound': { min: 30, max: 52, category: 'large' },
    'ovcharka': { min: 45, max: 70, category: 'giant' },
    'papillon': { min: 2, max: 5, category: 'small' },
    'pekinese': { min: 3, max: 6, category: 'small' },
    'pembroke': { min: 9, max: 14, category: 'small' },
    'pinscher': { min: 4, max: 6, category: 'small' },
    'pitbull': { min: 14, max: 27, category: 'medium' },
    'pointer': { min: 20, max: 34, category: 'large' },
    'pomeranian': { min: 1.5, max: 3, category: 'small' },
    'poodle': { min: 20, max: 32, category: 'large' },
    'pug': { min: 6, max: 8, category: 'small' },
    'puggle': { min: 7, max: 14, category: 'small' },
    'pyrenees': { min: 36, max: 54, category: 'large' },
    'redbone': { min: 20, max: 32, category: 'large' },
    'retriever': { min: 25, max: 36, category: 'large' },
    'ridgeback': { min: 32, max: 41, category: 'large' },
    'rottweiler': { min: 36, max: 54, category: 'large' },
    'saluki': { min: 18, max: 27, category: 'medium' },
    'samoyed': { min: 16, max: 30, category: 'medium' },
    'schipperke': { min: 4, max: 7, category: 'small' },
    'schnauzer': { min: 14, max: 20, category: 'medium' },
    'setter': { min: 20, max: 36, category: 'large' },
    'sheepdog': { min: 18, max: 30, category: 'medium' },
    'shiba': { min: 8, max: 10, category: 'small' },
    'shihtzu': { min: 4, max: 7, category: 'small' },
    'spaniel': { min: 13, max: 16, category: 'small' },
    'springer': { min: 20, max: 25, category: 'medium' },
    'stbernard': { min: 59, max: 82, category: 'giant' },
    'terrier': { min: 5, max: 16, category: 'small' },
    'vizsla': { min: 20, max: 30, category: 'medium' },
    'waterdog': { min: 14, max: 20, category: 'medium' },
    'weimaraner': { min: 25, max: 40, category: 'large' },
    'whippet': { min: 9, max: 18, category: 'small' },
    'wolfhound': { min: 40, max: 54, category: 'giant' }
  },
  cat: {
    'siamese': { min: 3.5, max: 5.5, category: 'medium' },
    'persian': { min: 3, max: 5.5, category: 'medium' },
    'maine coon': { min: 5, max: 8, category: 'large' },
    'ragdoll': { min: 4.5, max: 9, category: 'large' },
    'bengal': { min: 3.5, max: 7, category: 'medium' },
    'sphynx': { min: 3.5, max: 5.5, category: 'medium' },
    'british shorthair': { min: 4, max: 8, category: 'large' },
    'scottish fold': { min: 3, max: 6, category: 'medium' },
    'russian blue': { min: 3, max: 5.5, category: 'medium' },
    'abyssinian': { min: 3, max: 5, category: 'medium' },
    'burmese': { min: 3.5, max: 6.5, category: 'medium' },
    'siberian': { min: 4, max: 9, category: 'large' },
    'american shorthair': { min: 3.5, max: 7, category: 'medium' },
    'devon rex': { min: 2.5, max: 4.5, category: 'small' },
    'cornish rex': { min: 2.5, max: 4.5, category: 'small' },
    'norwegian forest': { min: 5, max: 9, category: 'large' },
    'oriental': { min: 3, max: 5, category: 'medium' },
    'himalayan': { min: 3.5, max: 6, category: 'medium' },
    'birman': { min: 3.5, max: 7, category: 'medium' },
    'balinese': { min: 3, max: 5.5, category: 'medium' }
  },
  rabbit: {
    'netherland dwarf': { min: 0.5, max: 1.1, category: 'small' },
    'holland lop': { min: 1.5, max: 2.5, category: 'small' },
    'mini rex': { min: 1.5, max: 2.5, category: 'small' },
    'lionhead': { min: 1.5, max: 2.5, category: 'small' },
    'flemish giant': { min: 5, max: 7, category: 'large' },
    'english lop': { min: 4.5, max: 6, category: 'large' },
    'french lop': { min: 4, max: 6, category: 'large' },
    'rex': { min: 3, max: 4.5, category: 'medium' },
    'angora': { min: 2.5, max: 4, category: 'medium' },
    'himalayan': { min: 1.5, max: 2.5, category: 'small' },
    'californian': { min: 3.5, max: 5, category: 'medium' },
    'chinchilla': { min: 2.5, max: 4, category: 'medium' },
    'dutch': { min: 1.5, max: 2.5, category: 'small' },
    'mini satin': { min: 2.5, max: 3.5, category: 'medium' },
    'polish': { min: 1, max: 1.5, category: 'small' },
    'beveren': { min: 3, max: 5, category: 'medium' },
    'silver fox': { min: 4, max: 6, category: 'large' },
    'tan': { min: 2, max: 3, category: 'small' },
    'thrianta': { min: 2, max: 3, category: 'small' },
    'american': { min: 4, max: 5.5, category: 'large' }
  },
  bird: {
    'budgerigar': { min: 0.03, max: 0.04, category: 'small' },
    'cockatiel': { min: 0.08, max: 0.12, category: 'medium' },
    'lovebird': { min: 0.04, max: 0.06, category: 'small' },
    'african grey': { min: 0.4, max: 0.65, category: 'large' },
    'macaw': { min: 0.9, max: 1.5, category: 'large' },
    'cockatoo': { min: 0.3, max: 0.9, category: 'large' },
    'amazon': { min: 0.3, max: 0.6, category: 'large' },
    'conure': { min: 0.06, max: 0.15, category: 'medium' },
    'eclectus': { min: 0.4, max: 0.6, category: 'large' },
    'finch': { min: 0.01, max: 0.02, category: 'small' },
    'canary': { min: 0.015, max: 0.025, category: 'small' },
    'parrotlet': { min: 0.03, max: 0.04, category: 'small' },
    'quaker': { min: 0.09, max: 0.12, category: 'medium' },
    'senegal': { min: 0.12, max: 0.17, category: 'medium' },
    'pionus': { min: 0.23, max: 0.29, category: 'medium' },
    'lorikeet': { min: 0.1, max: 0.15, category: 'medium' },
    'rosella': { min: 0.1, max: 0.15, category: 'medium' },
    'ringneck': { min: 0.12, max: 0.16, category: 'medium' },
    'caique': { min: 0.15, max: 0.17, category: 'medium' },
    'kakariki': { min: 0.08, max: 0.1, category: 'medium' }
  },
  sheep: {
    // Meat Breeds
    'suffolk': { min: 80, max: 120, category: 'large' },
    'dorset': { min: 70, max: 100, category: 'large' },
    'hampshire': { min: 75, max: 110, category: 'large' },
    'texel': { min: 70, max: 100, category: 'large' },
    'southdown': { min: 50, max: 80, category: 'medium' },
    
    // Wool Breeds
    'merino': { min: 45, max: 90, category: 'medium' },
    'rambouillet': { min: 50, max: 90, category: 'medium' },
    'lincoln': { min: 90, max: 140, category: 'large' },
    'romney': { min: 70, max: 110, category: 'large' },
    'corriedale': { min: 55, max: 90, category: 'medium' },
    
    // Dairy Breeds
    'east friesian': { min: 60, max: 90, category: 'medium' },
    'lacaune': { min: 55, max: 85, category: 'medium' },
    'awassi': { min: 50, max: 80, category: 'medium' },
    'sarda': { min: 45, max: 75, category: 'medium' },
    
    // Dual-Purpose
    'border leicester': { min: 70, max: 110, category: 'large' },
    'columbia': { min: 80, max: 120, category: 'large' },
    'polypay': { min: 60, max: 90, category: 'medium' },
    'targhee': { min: 65, max: 100, category: 'large' },
    
    // Heritage
    'shetland': { min: 35, max: 55, category: 'small' },
    'jacob': { min: 40, max: 65, category: 'small' },
    'karakul': { min: 45, max: 70, category: 'medium' },
    'icelandic': { min: 50, max: 80, category: 'medium' },
    
    // Hair Sheep
    'katahdin': { min: 50, max: 80, category: 'medium' },
    'dorper': { min: 60, max: 90, category: 'medium' },
    'st. croix': { min: 45, max: 75, category: 'medium' }
  },
  cow: {
    // Dairy Breeds
    'holstein': { min: 600, max: 900, category: 'large' },
    'jersey': { min: 400, max: 600, category: 'medium' },
    'brown swiss': { min: 500, max: 750, category: 'large' },
    'guernsey': { min: 450, max: 650, category: 'medium' },
    'ayrshire': { min: 450, max: 700, category: 'medium' },
    
    // Beef Breeds
    'angus': { min: 500, max: 800, category: 'large' },
    'hereford': { min: 550, max: 850, category: 'large' },
    'brahman': { min: 450, max: 750, category: 'medium' },
    'simmental': { min: 600, max: 900, category: 'large' },
    'limousin': { min: 550, max: 850, category: 'large' },
    'charolais': { min: 600, max: 900, category: 'large' },
    'shorthorn': { min: 500, max: 800, category: 'large' },
    
    // Dual-Purpose
    'red poll': { min: 450, max: 700, category: 'medium' },
    'dexter': { min: 300, max: 500, category: 'small' },
    'pinzgauer': { min: 500, max: 750, category: 'large' },
    'normande': { min: 500, max: 750, category: 'large' },
    
    // Heritage
    'highland': { min: 400, max: 600, category: 'medium' },
    'longhorn': { min: 450, max: 700, category: 'medium' },
    'belted galloway': { min: 450, max: 700, category: 'medium' },
    
    // Tropical
    'sahiwal': { min: 400, max: 600, category: 'medium' },
    'gyr': { min: 350, max: 550, category: 'medium' }
  }
};

// Scientific Recommendations by Life Stage
const WEIGHT_CHANGE_RECOMMENDATIONS = {
    puppy: { normal: 3, concerning: 5, critical: 7, frequency: 'weekly' },
    kitten: { normal: 3, concerning: 5, critical: 7, frequency: 'weekly' },
    adultDog: { normal: 2, concerning: 5, critical: 7, frequency: 'monthly' },
    adultCat: { normal: 2, concerning: 5, critical: 7, frequency: 'monthly' },
    rabbit: { normal: 5, concerning: 7, critical: 10, frequency: 'bi-weekly' },
    smallBird: { normal: 8, concerning: 12, critical: 15, frequency: 'weekly' },
    largeBird: { normal: 3, concerning: 7, critical: 10, frequency: 'weekly' },
    sheep: { normal: 4, concerning: 7, critical: 10, frequency: 'monthly' },
    cow: { normal: 4, concerning: 7, critical: 10, frequency: 'monthly' },
    youngSheep: { normal: 4, concerning: 7, critical: 10, frequency: 'weekly' },
    youngCow: { normal: 4, concerning: 7, critical: 10, frequency: 'weekly' }
  };

const PetNutritionCalculator = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [breedData, setBreedData] = useState(null);
  const [isLoadingBreed, setIsLoadingBreed] = useState(false);
  const [allBreeds, setAllBreeds] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [weightChangeAnalysis, setWeightChangeAnalysis] = useState(null);
  const [feedingSchedule, setFeedingSchedule] = useState([]);
const [remindersEnabled, setRemindersEnabled] = useState(true);
const [feedingHistory, setFeedingHistory] = useState([]);
const [showFeedingHistory, setShowFeedingHistory] = useState(false);
  const navigate = useNavigate();

   // Fetch user's pets with weight history
// Modify this useEffect
useEffect(() => {
  const fetchPets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pets/user-pets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check for automatic updates for each pet
      const updatedPets = await Promise.all(
        response.data.pets.map(async pet => {
          return await simulateAutomaticWeightUpdate(pet);
        })
      );
      
      setPets(updatedPets || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      alert('Failed to load pet data');
    }
  };
  
  fetchPets();
}, []);

   // Analyze weight changes when pet is selected or history changes
   useEffect(() => {
    if (selectedPet && selectedPet.weight_history && selectedPet.weight_history.length > 1) {
      analyzeWeightChanges();
    } else {
      setWeightChangeAnalysis(null);
    }
  }, [selectedPet]);

  // Fetch breed data when a pet is selected
  useEffect(() => {
    if (selectedPet && selectedPet.breed) {
      fetchBreedData(selectedPet.species.toLowerCase(), selectedPet.breed);
    } else {
      setBreedData(null);
    }
  }, [selectedPet]);

  const fetchBreedData = async (species, breed) => {
    if (!breed || breed.toLowerCase() === 'mixed') return null;
    
    setIsLoadingBreed(true);
    try {
      // Normalize breed name to match our mapping
      const normalizedBreed = breed.toLowerCase().replace(/\s+/g, ' ');
      
      // Check if we have weight data for this breed
      const weightData = BREED_WEIGHT_MAPPING[species]?.[normalizedBreed] || null;
      
      // For dogs, fetch images from Dog CEO API
      let breedImage = null;
      if (species === 'dog') {
        const apiBreedName = normalizedBreed.replace(/\s+/g, '/');
        const imageResponse = await axios.get(`https://dog.ceo/api/breed/${apiBreedName}/images/random`);
        breedImage = imageResponse.data.message;
      }
      
      setBreedData({
        ...weightData,
        breedImage
      });
      
      return weightData;
    } catch (error) {
      console.error('Error fetching breed data:', error);
      return null;
    } finally {
      setIsLoadingBreed(false);
    }
  };

  // Get ideal weight range based on species, breed, and age
  const getIdealWeightRange = (pet) => {
    const species = pet.species.toLowerCase();
    const weight = pet.weight;
    const age = calculateAge(pet.birth_date);
    
    // Use breed-specific data if available
    if (pet.breed) {
      const normalizedBreed = pet.breed.toLowerCase().trim();
      const breedData = BREED_WEIGHT_MAPPING[species]?.[normalizedBreed];
      
      if (breedData) {
        // Adjust for age if this is a young animal
        if (age && age.includes('month')) {
          const months = parseInt(age);
          const growthPercentage = Math.min(months / 12, 1);
          return {
            min: breedData.min * growthPercentage,
            max: breedData.max * growthPercentage,
            isEstimated: months < 12,
            category: breedData.category
          };
        }
        return breedData;
      }
    }
    
    // Fallback to default weights for when breed data isn't available
    switch(species) {
      case 'dog':
        if (weight < 10) return DEFAULT_WEIGHTS.dog.small;
        if (weight < 25) return DEFAULT_WEIGHTS.dog.medium;
        if (weight < 45) return DEFAULT_WEIGHTS.dog.large;
        return DEFAULT_WEIGHTS.dog.giant;
      
      case 'cat':
        if (weight < 4) return { ...DEFAULT_WEIGHTS.cat.small, category: 'small' };
        if (weight < 6) return { ...DEFAULT_WEIGHTS.cat.medium, category: 'medium' };
        return { ...DEFAULT_WEIGHTS.cat.large, category: 'large' };
      
      case 'rabbit':
        if (weight < 1.5) return { ...DEFAULT_WEIGHTS.rabbit.small, category: 'small' };
        if (weight < 3) return { ...DEFAULT_WEIGHTS.rabbit.medium, category: 'medium' };
        return { ...DEFAULT_WEIGHTS.rabbit.large, category: 'large' };
      
      case 'bird':
        if (weight < 0.05) return { ...DEFAULT_WEIGHTS.bird.small, category: 'small' };
        if (weight < 0.3) return { ...DEFAULT_WEIGHTS.bird.medium, category: 'medium' };
        return { ...DEFAULT_WEIGHTS.bird.large, category: 'large' };
      
      default:
        return { min: weight * 0.8, max: weight * 1.2, category: 'general' };
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    
    let years = today.getFullYear() - birthDateObj.getFullYear();
    let months = today.getMonth() - birthDateObj.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDateObj.getDate())) {
      years--;
      months += 12;
    }
    
    if (years < 1) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

 // calculate number of meals per day
 const getMealFrequency = (species, age, weight, sizeCategory) => {
    const speciesLower = species.toLowerCase();
    const isYoung = age && age.includes('month');
    const isPuppyKitten = isYoung && (speciesLower === 'dog' || speciesLower === 'cat');
  
    switch(speciesLower) {
      case 'dog':
        if (isPuppyKitten) {
          return sizeCategory === 'large' ? 3 : 4; // Large breed puppies: 3 meals, others: 4
        }
        return 2; // Adult dogs: 2 meals
  
      case 'cat':
        return isPuppyKitten ? 4 : 3; // Kittens: 4 meals, adults: 3
  
      case 'rabbit':
        return 2; // Morning and evening feedings
  
      case 'bird':
        return 2; // Morning and evening
  
      case 'sheep':
        return isYoung ? 3 : 1; // Lambs: 3 meals, adults: 1 main meal + grazing
  
      case 'cow':
        return isYoung ? 3 : 2; // Calves: 3 meals, adults: 2 meals
  
      default:
        return 2; // Fallback
    }
  };

  // Analyze weight changes based on scientific recommendations
  const analyzeWeightChanges = () => {
    if (!selectedPet || !selectedPet.weight_history || selectedPet.weight_history.length < 2) {
      return;
    }

    const history = [...selectedPet.weight_history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const petType = selectedPet.species.toLowerCase();
    const age = calculateAge(selectedPet.birth_date);
    const isYoung = age && age.includes('month');

    // Determine which recommendations to use
    let recommendations;
    if (petType === 'dog') {
      recommendations = isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.puppy : WEIGHT_CHANGE_RECOMMENDATIONS.adultDog;
    } else if (petType === 'cat') {
      recommendations = isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.kitten : WEIGHT_CHANGE_RECOMMENDATIONS.adultCat;
    } else if (petType === 'rabbit') {
      recommendations = WEIGHT_CHANGE_RECOMMENDATIONS.rabbit;
    } else if (petType === 'bird') {
      const isLargeBird = selectedPet.weight > 0.3; // Assuming large birds are >300g
      recommendations = isLargeBird ? WEIGHT_CHANGE_RECOMMENDATIONS.largeBird : WEIGHT_CHANGE_RECOMMENDATIONS.smallBird;
    } else if (petType === 'sheep') {
      recommendations = isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.youngSheep : WEIGHT_CHANGE_RECOMMENDATIONS.sheep;
    } else if (petType === 'cow') {
      recommendations = isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.youngCow : WEIGHT_CHANGE_RECOMMENDATIONS.cow;
    }

    // Calculate changes between records
    const changes = [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const current = history[i];
      const daysBetween = (new Date(current.date) - new Date(prev.date)) / (1000 * 60 * 60 * 24);
      
      // Calculate percentage change
      const change = ((current.weight - prev.weight) / prev.weight) * 100;
      const normalizedChange = (change / daysBetween) * (recommendations.frequency === 'weekly' ? 7 : 30);

      // Determine change status
      let status = 'normal';
      if (Math.abs(normalizedChange) > recommendations.critical) {
        status = 'critical';
      } else if (Math.abs(normalizedChange) > recommendations.concerning) {
        status = 'concerning';
      } else if (Math.abs(normalizedChange) > recommendations.normal) {
        status = 'normal';
      }

      changes.push({
        date: current.date,
        previousWeight: prev.weight,
        currentWeight: current.weight,
        change,
        normalizedChange,
        daysBetween,
        status
      });
    }

    setWeightChangeAnalysis({
      recommendations,
      changes
    });
  };

  // Add new weight record
  const addWeightRecord = async () => {
    if (!newWeight || isNaN(newWeight)) {
      alert('Please enter a valid weight');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/pets/${selectedPet._id}/weight`,
        { weight: parseFloat(newWeight), notes: weightNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the selected pet with new data
      setSelectedPet(response.data.pet);
      setNewWeight('');
      setWeightNotes('');
      alert('Weight record added successfully');
    } catch (error) {
      console.error('Error adding weight record:', error);
      alert('Failed to add weight record');
    }
  };


  // Helper to get recommendations for a pet
const getRecommendationsForPet = (pet) => {
  const petType = pet.species.toLowerCase();
  const age = calculateAge(pet.birth_date);
  const isYoung = age && age.includes('month');

  if (petType === 'dog') {
    return isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.puppy : WEIGHT_CHANGE_RECOMMENDATIONS.adultDog;
  } else if (petType === 'cat') {
    return isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.kitten : WEIGHT_CHANGE_RECOMMENDATIONS.adultCat;
  } else if (petType === 'rabbit') {
    return WEIGHT_CHANGE_RECOMMENDATIONS.rabbit;
  } else if (petType === 'bird') {
    const isLargeBird = pet.weight > 0.3;
    return isLargeBird ? WEIGHT_CHANGE_RECOMMENDATIONS.largeBird : WEIGHT_CHANGE_RECOMMENDATIONS.smallBird;
  } else if (petType === 'sheep') {
    return isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.youngSheep : WEIGHT_CHANGE_RECOMMENDATIONS.sheep;
  } else if (petType === 'cow') {
    return isYoung ? WEIGHT_CHANGE_RECOMMENDATIONS.youngCow : WEIGHT_CHANGE_RECOMMENDATIONS.cow;
  }
  return WEIGHT_CHANGE_RECOMMENDATIONS.adultDog; // default
};

// Calculate expected weight change
const calculateExpectedWeightChange = (pet) => {
  if (!pet.weight_history || pet.weight_history.length === 0) return 0;
  
  const recs = getRecommendationsForPet(pet);
  const lastRecord = pet.weight_history[pet.weight_history.length - 1];
  const daysSinceLastUpdate = (new Date() - new Date(lastRecord.date)) / (1000 * 60 * 60 * 24);
  
  // Calculate expected change based on normal fluctuation
  const changePerPeriod = recs.normal / 100; // Convert percentage to decimal
  const periods = recs.frequency === 'weekly' ? daysSinceLastUpdate / 7 : daysSinceLastUpdate / 30;
  
  return lastRecord.weight * changePerPeriod * periods;
};

// Simulate automatic weight update
const simulateAutomaticWeightUpdate = async (pet) => {
  const recs = getRecommendationsForPet(pet);
  const daysBetweenUpdates = recs.frequency === 'weekly' ? 7 : recs.frequency === 'bi-weekly' ? 14 : 30;
  
  // Only simulate if enough time has passed
  const lastUpdate = pet.weight_history.length > 0 
    ? new Date(pet.weight_history[pet.weight_history.length - 1].date)
    : new Date(pet.created_at);
  
  const daysSinceLastUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastUpdate >= daysBetweenUpdates) {
    const weightChange = calculateExpectedWeightChange(pet);
    const newWeight = pet.weight + weightChange;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/pets/${pet._id}/weight`,
        { 
          weight: parseFloat(newWeight.toFixed(2)),
          notes: `Automatic ${recs.frequency} weight update`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.pet;
    } catch (error) {
      console.error('Error in automatic weight update:', error);
      return pet; // Return original if error
    }
  }
  return pet; // No update needed
};

  // Calculate nutrition requirements
  const calculateNutrition = () => {
    if (!selectedPet) return;

    const { species, weight, birth_date, breed } = selectedPet;
    const age = calculateAge(birth_date);
    const idealWeight = getIdealWeightRange(selectedPet);
    
    // Ensure idealWeight has min and max values
    if (!idealWeight || typeof idealWeight.min === 'undefined' || typeof idealWeight.max === 'undefined') {
      alert("Could not determine ideal weight range for this pet");
      return;
    }

    let calories, message, warning = null;
    let foodRecommendation = '';
    const petType = species.toLowerCase();

    // Dog Calculations
    if (petType === 'dog') {
      const baseCalories = 70 * Math.pow(weight, 0.75);
      let activityFactor = 1.6; // Default for adult dogs

      if (age !== null) {
        if (age.includes('month')) { // Puppy
          message = "Young animals need more calories for growth!";
          activityFactor = 2.0;
        } else if (parseInt(age) > 7) { // Senior
          message = "Senior pets need fewer calories.";
          activityFactor = 1.4;
        }
      }

      calories = baseCalories * activityFactor;
      foodRecommendation = `${Math.round(calories / 100 * 100)}g dry food or ${Math.round(calories / 120 * 100)}g wet food daily`;

      // Adjust warning messages based on breed data availability
      const weightRangeText = `${idealWeight.min.toFixed(1)}-${idealWeight.max.toFixed(1)}kg (${idealWeight.category})`;

      if (weight > idealWeight.max) {
        warning = {
          title: "Obesity Warning",
          message: `Your dog is overweight! Ideal range: ${weightRangeText}\n• Reduce treats\n• Increase exercise\n• Consider weight management food`,
          calories: Math.round(calories * 0.85)
        };
      } else if (weight < idealWeight.min) {
        warning = {
          title: "Underweight Alert",
          message: `Your dog is underweight! Ideal range: ${weightRangeText}\n• Increase meal frequency\n• Higher calorie food\n• Vet check for parasites`,
          calories: Math.round(calories * 1.15)
        };
      }
    }
    // Cat Calculations
    else if (petType === 'cat') {
      const baseCalories = 40 * weight + 100;
      calories = age && age.includes('month') ? baseCalories * 1.2 : baseCalories;
      foodRecommendation = `${Math.round(calories / 80 * 100)}g wet food or ${Math.round(calories / 350 * 100)}g dry food daily`;

      const weightRangeText = breedData ? 
        `${idealWeight.min.toFixed(1)}-${idealWeight.max.toFixed(1)}kg (${breed} standard)` : 
        `${idealWeight.min}-${idealWeight.max}kg (${idealWeight.category} range)`;

      if (weight > idealWeight.max) {
        warning = {
          title: "Obesity Warning",
          message: `Your cat is overweight! Ideal range: ${weightRangeText}\n• Use puzzle feeders\n• Increase playtime\n• Limit dry food`,
          calories: Math.round(calories * 0.85)
        };
      } else if (weight < idealWeight.min) {
        warning = {
          title: "Underweight Alert",
          message: `Your cat is underweight! Ideal range: ${weightRangeText}\n• Increase meal frequency\n• Higher calorie food\n• Vet check for parasites`,
          calories: Math.round(calories * 1.15)
        };
      }
    } 
    // Rabbit Calculations
    else if (petType === 'rabbit') {
      calories = 100 * Math.pow(weight, 0.75);
      foodRecommendation = `Unlimited timothy hay + ${Math.round(weight * 25)}g fresh veggies + ${Math.round(weight * 5)}g pellets daily`;

      const weightRangeText = breedData ? 
        `${idealWeight.min.toFixed(1)}-${idealWeight.max.toFixed(1)}kg (${breed} standard)` : 
        `${idealWeight.min}-${idealWeight.max}kg (${idealWeight.category} range)`;

      if (weight > idealWeight.max) {
        warning = {
          title: "Weight Warning",
          message: `Your rabbit is overweight! Ideal range: ${weightRangeText}\n• 80% hay diet\n• Limit fruits\n• More exercise space`,
          calories: Math.round(calories * 0.9)
        };
      } else if (weight < idealWeight.min) {
        warning = {
          title: "Underweight Alert",
          message: `Your rabbit is underweight! Ideal range: ${weightRangeText}\n• Increase food quantity\n• Check dental health\n• Vet check for parasites`,
          calories: Math.round(calories * 1.1)
        };
      }
    } 
    // Bird Calculations
    else if (petType === 'bird') {
      const weightGrams = weight * 1000; // Convert kg to grams
      
      if (weight <= 0.05) { // <50g
        calories = 20 + (weightGrams * 0.2);
        foodRecommendation = `${Math.round(weightGrams * 0.1)}g pellets + ${Math.round(weightGrams * 0.05)}g fruits/veggies`;
      } 
      else if (weight <= 0.3) { // 50-300g
        calories = 30 + (weightGrams * 0.1);
        foodRecommendation = `${Math.round(weightGrams * 0.08)}g pellets + ${Math.round(weightGrams * 0.03)}g fruits/veggies`;
      } 
      else {
        calories = 60 + (weightGrams * 0.05);
        foodRecommendation = `${Math.round(weightGrams * 0.06)}g pellets + ${Math.round(weightGrams * 0.04)}g fruits/veggies`;
      }

      const weightRangeText = breedData ? 
        `${idealWeight.min.toFixed(2)}-${idealWeight.max.toFixed(2)}kg (${breed} standard)` : 
        `${idealWeight.min}-${idealWeight.max}kg (${idealWeight.category} range)`;

      if (weight > idealWeight.max) {
        warning = {
          title: "Weight Alert",
          message: `Your bird is overweight! Ideal range: ${weightRangeText}\n• Increase flight time\n• More vegetables\n• No avocado/chocolate`,
          calories: Math.round(calories * 0.85)
        };
      } else if (weight < idealWeight.min) {
        warning = {
          title: "Underweight Alert",
          message: `Your bird is underweight! Ideal range: ${weightRangeText}\n• Increase food quantity\n• Check for illness\n• Offer high-energy foods`,
          calories: Math.round(calories * 1.15)
        };
      }
    } 
    // Sheep Calculations
else if (petType === 'sheep') {
    const baseCalories = 60 * Math.pow(weight, 0.75);
    
    // Adjust for life stage
    if (age && age.includes('month')) { // Lamb
      message = "Growing lambs need more calories!";
      calories = baseCalories * 1.15;
    } else if (selectedPet.gender === 'female' && selectedPet.reproductive_status === 'pregnant') {
      message = "Pregnant ewes need increased nutrition!";
      calories = baseCalories * 1.2;
    } else if (selectedPet.gender === 'female' && selectedPet.reproductive_status === 'lactating') {
      message = "Lactating ewes need significantly more calories!";
      calories = baseCalories * 1.3;
    } else {
      calories = baseCalories;
    }
  
    foodRecommendation = `${Math.round(weight * 20)}g hay + ${Math.round(weight * 5)}g grain/concentrate daily`;
    
    const weightRangeText = breedData ? 
      `${idealWeight.min}-${idealWeight.max}kg (${selectedPet.breed} standard)` : 
      `${idealWeight.min}-${idealWeight.max}kg (${idealWeight.category} range)`;
  
    if (weight > idealWeight.max) {
      warning = {
        title: "Overweight Warning",
        message: `Your sheep is overweight! Ideal range: ${weightRangeText}\n• Increase exercise\n• Reduce grain intake\n• Monitor body condition`,
        calories: Math.round(calories * 0.9)
      };
    } else if (weight < idealWeight.min) {
      warning = {
        title: "Underweight Alert",
        message: `Your sheep is underweight! Ideal range: ${weightRangeText}\n• Increase feed quantity\n• Check for parasites\n• Consider higher quality forage`,
        calories: Math.round(calories * 1.1)
      };
    }
  }
  // Cow Calculations
  else if (petType === 'cow') {
    const baseCalories = 70 * Math.pow(weight, 0.75);
    
    // Adjust for life stage and purpose
    if (age && age.includes('month')) { // Calf
      message = "Growing calves need more calories!";
      calories = baseCalories * 1.2;
    } else if (selectedPet.gender === 'female' && selectedPet.reproductive_status === 'lactating') {
      message = "Lactating cows need significantly more calories!";
      calories = baseCalories * 1.5;
    } else if (selectedPet.type === 'beef' && selectedPet.gender === 'male') {
      calories = baseCalories * 1.1; // Bulls need slightly more
    } else {
      calories = baseCalories;
    }
  
    // Different recommendations for dairy vs beef
    if (breedData?.type === 'dairy') {
      foodRecommendation = `${Math.round(weight * 25)}g forage + ${Math.round(weight * 8)}g concentrate daily`;
    } else {
      foodRecommendation = `${Math.round(weight * 30)}g forage/grass daily`;
    }
    
    const weightRangeText = breedData ? 
      `${idealWeight.min}-${idealWeight.max}kg (${selectedPet.breed} standard)` : 
      `${idealWeight.min}-${idealWeight.max}kg (${idealWeight.category} range)`;
  
    if (weight > idealWeight.max) {
      warning = {
        title: "Overweight Warning",
        message: `Your cow is overweight! Ideal range: ${weightRangeText}\n• Adjust feeding regimen\n• Increase exercise\n• Monitor body condition score`,
        calories: Math.round(calories * 0.85)
      };
    } else if (weight < idealWeight.min) {
      warning = {
        title: "Underweight Alert",
        message: `Your cow is underweight! Ideal range: ${weightRangeText}\n• Increase feed quantity\n• Check for health issues\n• Consider higher quality nutrition`,
        calories: Math.round(calories * 1.15)
      };
    }
  }
    else {
      alert("Nutrition guidelines not available for this species");
      return;
    }
    // meal frequency calculation
    const mealsPerDay = getMealFrequency(
      species,
      calculateAge(birth_date),
      weight,
      idealWeight.category 
    );
  
    const mealCalories = Math.round(calories / mealsPerDay);


     
 // Default meal times based on number of meals

  let defaultMealTimes = [];
  if (mealsPerDay === 1) {
    defaultMealTimes = [{ time: '00:22', calories: mealCalories }];
  } else if (mealsPerDay === 2) {
    defaultMealTimes = [
      { time: '08:00', calories: mealCalories },
      { time: '18:00', calories: mealCalories }
    ];
  } else if (mealsPerDay === 3) {
    defaultMealTimes = [
      { time: '07:00', calories: mealCalories },
      { time: '12:00', calories: mealCalories },
      { time: '18:00', calories: mealCalories }
    ];
  } else if (mealsPerDay === 4) {
    defaultMealTimes = [
      { time: '07:00', calories: mealCalories },
      { time: '11:00', calories: mealCalories },
      { time: '15:00', calories: mealCalories },
      { time: '19:00', calories: mealCalories }
    ];
  }




     // Save the feeding schedule and update state
     const saveFeedingSchedule = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Create the payload for nutrition analysis
        const nutritionPayload = {
          calories: Math.round(calories),
          idealWeightRange: breedData ? 
            `${idealWeight.min.toFixed(petType === 'bird' ? 2 : 1)}-${idealWeight.max.toFixed(petType === 'bird' ? 2 : 1)}kg (breed standard)` : 
            `${idealWeight.min}-${idealWeight.max}kg (${idealWeight.category} range)`,
          message,
          warning,
          foodRecommendation,
          petType,
          breedData,
          mealsPerDay,
          mealCalories
        };
    
        // First save nutrition analysis
        const nutritionResponse = await axios.post(
          `http://localhost:5000/api/pets/${selectedPet._id}/nutrition`,
          nutritionPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
    
        // Then save feeding schedule
        const scheduleResponse = await axios.put(
          `http://localhost:5000/api/feeding/${selectedPet._id}/feeding-schedule`,
          {
            mealsPerDay,
            mealTimes: defaultMealTimes,
            remindersEnabled: true
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
    
        // Update state with saved data
        setNutritionInfo({
          ...nutritionPayload,
          nutritionData: nutritionResponse.data.nutritionAnalysis,
          feedingSchedule: scheduleResponse.data.feedingSchedule
        });
    
        // Refresh pet data
        const petResponse = await axios.get(
          `http://localhost:5000/api/pets/id/${selectedPet._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSelectedPet(petResponse.data.pet);
    
      } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save nutrition data. Please try again.');
      }
    };

  saveFeedingSchedule();


  };

  // Handle pet selection
  const handlePetSelect = (petId) => {
    const pet = pets.find(p => p._id === petId);
    setSelectedPet(pet);
    setNutritionInfo(null);
  };

  // Get species-specific tips
  const getSpeciesTips = () => {
    if (!nutritionInfo) return [];
    
    const generalTips = [
      'Always provide fresh, clean water',
      'Monitor weight monthly',
      'Consult vet before diet changes'
    ];

    const breedSpecificTip = nutritionInfo.breedData && selectedPet?.breed ? 
      `Typical ${selectedPet.breed} lifespan: ${getLifespanEstimate(selectedPet.species.toLowerCase(), selectedPet.breed)}` : 
      '';

    switch(nutritionInfo.petType) {
      case 'dog':
        return [
          ...generalTips,
          'Avoid chocolate, grapes, and onions',
          'Feed 2-3 meals per day',
          'Adjust portions for activity level',
          breedSpecificTip
        ].filter(Boolean);
      case 'cat':
        return [
          ...generalTips,
          'Cats need animal protein',
          'Wet food prevents urinary issues',
          'Avoid free-feeding adults',
          breedSpecificTip
        ].filter(Boolean);
      case 'rabbit':
        return [
          ...generalTips,
          '80% of diet should be hay',
          'Introduce new veggies slowly',
          'No iceberg lettuce',
          breedSpecificTip
        ].filter(Boolean);
      case 'bird':
        return [
          ...generalTips,
          'Remove uneaten fresh food after 4 hours',
          'Calcium for egg-laying females',
          'Never feed avocado or chocolate',
          breedSpecificTip
        ].filter(Boolean);
        case 'sheep':
  return [
    ...generalTips,
    'Provide free-choice mineral supplement',
    'Ensure constant access to fresh water',
    'Gradually transition between feed types',
    'Monitor for signs of bloat',
    breedSpecificTip
  ].filter(Boolean);
case 'cow':
  return [
    ...generalTips,
    'Always provide salt/mineral blocks',
    'Ensure adequate rumen fiber',
    'Make dietary changes gradually (over 7-10 days)',
    'Watch for signs of bloat or acidosis',
    breedSpecificTip
  ].filter(Boolean);
      default:
        return generalTips;
    }
  };

  // Helper function to estimate lifespan based on breed
  const getLifespanEstimate = (species, breed) => {
    if (species === 'dog') {
      if (breed.toLowerCase().includes('great dane') || breed.toLowerCase().includes('mastiff')) {
        return '6-10 years';
      } else if (breed.toLowerCase().includes('chihuahua') || breed.toLowerCase().includes('terrier')) {
        return '12-20 years';
      }
      return '10-15 years';
    } else if (species === 'cat') {
      if (breed.toLowerCase().includes('siamese')) {
        return '15-20 years';
      } else if (breed.toLowerCase().includes('maine coon')) {
        return '12-15 years';
      }
      return '12-18 years';
    } else if (species === 'rabbit') {
      if (breed.toLowerCase().includes('dwarf')) {
        return '8-12 years';
      } else if (breed.toLowerCase().includes('flemish giant')) {
        return '5-8 years';
      }
      return '7-10 years';
    } else if (species === 'bird') {
      if (breed.toLowerCase().includes('budgerigar') || breed.toLowerCase().includes('cockatiel')) {
        return '10-15 years';
      } else if (breed.toLowerCase().includes('macaw') || breed.toLowerCase().includes('cockatoo')) {
        return '40-60 years';
      }
      return '15-30 years';
    }
    else if (species === 'sheep') {
        if (breed.toLowerCase().includes('dairy')) {
          return '8-12 years';
        }
        return '10-14 years';
      } else if (species === 'cow') {
        if (breed.toLowerCase().includes('dairy')) {
          return '15-20 years';
        } else if (breed.toLowerCase().includes('beef')) {
          return '12-18 years';
        }
        return '15-20 years';
      }
    return '';
  };

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-9">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full bg-[#E59560] text-white hover:bg-[#d48753] transition"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-bold text-[#E59560] font-laila">Pet Nutrition Calculator</h1>
          <FaPaw className="ml-3 text-[#E59560]" />
        </div>
        
        {/* Pet Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-[#325747] mb-4 font-laila">Select Your Pet</h2>
          
          {pets.length > 0 ? (
            <select
              value={selectedPet?._id || ''}
              onChange={(e) => handlePetSelect(e.target.value)}
              className="w-full p-3 border border-[#E59560] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E59560]"
            >
              <option value="">Select a pet</option>
              {pets.map(pet => (
                <option key={pet._id} value={pet._id}>
                  {pet.name} ({pet.species}{pet.breed ? ` - ${pet.breed}` : ''})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-600">No pets found. Add pets first.</p>
          )}
        </div>

        {/* Display Selected Pet Info */}
        {selectedPet && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-[#325747] mb-4 font-laila">Pet Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="font-medium text-[#325747]">Name: <span className="font-normal text-gray-700">{selectedPet.name}</span></p>
                <p className="font-medium text-[#325747]">Species: <span className="font-normal text-gray-700">{selectedPet.species}</span></p>
                {selectedPet.breed && <p className="font-medium text-[#325747]">Breed: <span className="font-normal text-gray-700">{selectedPet.breed}</span></p>}
              </div>
              <div>
                <p className="font-medium text-[#325747]">Age: <span className="font-normal text-gray-700">{calculateAge(selectedPet.birth_date) || 'Unknown'}</span></p>
                <p className="font-medium text-[#325747]">Weight: <span className="font-normal text-gray-700">{selectedPet.weight} kg</span></p>
              </div>
            </div>

            {/* Weight Tracking Section */}
            <div className="mb-4">
              <h3 className="font-medium text-[#325747] mb-2">Update Weight</h3>
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Current weight (kg)"
                  className="flex-1 p-2 border border-[#E59560] rounded"
                />
                <input
                  type="text"
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="flex-1 p-2 border border-[#E59560] rounded"
                />
                <button
                  onClick={addWeightRecord}
                  className="bg-[#325747] text-white px-4 py-2 rounded hover:bg-[#2a4536]"
                >
                  Record
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={calculateNutrition}
                className="bg-[#325747] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#2a4536] transition"
              >
                Calculate Nutrition Needs
              </button>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 bg-[#E59560] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#d48753] transition"
              >
                <FaHistory /> {showHistory ? 'Hide History' : 'View History'}
              </button>
            </div>
          </div>
        )}

        {/* Weight History */}
        {selectedPet && showHistory && (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 className="text-xl font-semibold text-[#325747] mb-4 font-laila">Weight History</h2>
    
    {weightChangeAnalysis && (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-[#325747]">Monitoring Recommendations:</h3>
        <p className="text-sm">
          For {selectedPet.species.toLowerCase()}{calculateAge(selectedPet.birth_date)?.includes('month') ? ' (young)' : ''}:
          Normal fluctuation: ±{weightChangeAnalysis.recommendations.normal}% {weightChangeAnalysis.recommendations.frequency},
          Concerning: ±{weightChangeAnalysis.recommendations.concerning}%,
          Critical: ±{weightChangeAnalysis.recommendations.critical}%
        </p>
      </div>
    )}
    
    {selectedPet.weight_history.length < 2 ? (
      <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500 mb-4">
        <p className="text-yellow-800">Need at least 2 weight records to analyze changes</p>
      </div>
    ) : null}
    
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-[#325747] text-white">
            <th className="py-2 px-4">Date</th>
            <th className="py-2 px-4">Weight (kg)</th>
            <th className="py-2 px-4">Change</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Notes</th>
          </tr>
        </thead>
        <tbody>
          {[...selectedPet.weight_history]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((record, index, array) => {
              const change = index < array.length - 1 
                ? ((record.weight - array[index + 1].weight) / array[index + 1].weight * 100).toFixed(1)
                : null;
              
              // Get the matching change analysis if available
              const changeAnalysis = weightChangeAnalysis?.changes.find(c => 
                new Date(c.date).toISOString() === new Date(record.date).toISOString()
              );
              
              // Determine status based on analysis or if it's the most recent record
              let status;
              if (changeAnalysis) {
                status = changeAnalysis.status;
              } else if (index === 0 && array.length > 1) {
                // For the most recent record, compare with previous
                const normalizedChange = ((record.weight - array[1].weight) / array[1].weight * 100) / 
                  (weightChangeAnalysis?.recommendations.frequency === 'weekly' ? 7 : 30);
                
                if (Math.abs(normalizedChange) > weightChangeAnalysis?.recommendations.critical) {
                  status = 'critical';
                } else if (Math.abs(normalizedChange) > weightChangeAnalysis?.recommendations.concerning) {
                  status = 'concerning';
                } else if (Math.abs(normalizedChange) > weightChangeAnalysis?.recommendations.normal) {
                  status = 'normal';
                }
              }

              return (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="py-2 px-4">{record.weight}</td>
                  <td className="py-2 px-4">
                    {change !== null && (
                      <div className="flex items-center">
                        {parseFloat(change) > 0 ? (
                          <FaArrowUp className="text-red-500 mr-1" />
                        ) : parseFloat(change) < 0 ? (
                          <FaArrowDown className="text-green-500 mr-1" />
                        ) : null}
                        {change}%
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {status === 'critical' && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Critical</span>
                    )}
                    {status === 'concerning' && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Concerning</span>
                    )}
                    {status === 'normal' && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Normal</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-sm">
                  {record.notes && record.notes.includes('Automatic') ? (
                      <span className="text-blue-600">{record.notes}</span>
                    ) : (
                      record.notes
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  </div>
)}

        {/* Nutrition Results */}
        {nutritionInfo && (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold text-[#325747] mb-4 font-laila">Nutritional Requirements</h2>
    
    {nutritionInfo.breedImage && (
      <div className="mb-6 text-center">
        <p className="font-medium text-[#325747] mb-2">Breed: {selectedPet.breed}</p>
        <img 
          src={nutritionInfo.breedImage} 
          alt={selectedPet.breed} 
          className="mx-auto rounded-lg max-h-60 object-cover shadow-md"
        />
      </div>
    )}
    
    <div className="space-y-4">
      <p className="font-medium text-[#1D3124]">
        Healthy Weight Range: <span className="font-bold text-[#E59560]">{nutritionInfo.idealWeightRange}</span>
      </p>
      
      <p className="font-medium text-[#1D3124]">
        Daily Calories Needed: <span className="font-bold text-[#E59560]">{nutritionInfo.calories} kcal</span>
      </p>
      
      {nutritionInfo.message && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-700">ℹ️ {nutritionInfo.message}</p>
        </div>
      )}

      <div className="bg-[#F6F4E8] p-4 rounded-lg">
        <p className="font-bold text-[#325747] font-laila">Recommended Daily Food:</p>
        <p className="font-bold text-[#E59560] mt-1">{nutritionInfo.foodRecommendation}</p>
      </div>

      {/* Feeding Schedule Section */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-bold text-[#325747] mb-2 font-laila">Feeding Schedule:</h3>
        <p className="font-semibold ">
          Recommended meals per day: {nutritionInfo.mealsPerDay}
        </p>
        
        {nutritionInfo.petType === 'dog' && (
          <p className="text-sm mt-1">
            {nutritionInfo.mealsPerDay > 2 
              ? "Puppies need frequent small meals for proper growth"
              : "Adult dogs do well with scheduled mealtimes"}
          </p>
        )}
        
        {nutritionInfo.petType === 'cat' && (
          <p className="text-sm mt-1">
            Cats prefer multiple small meals throughout the day
          </p>
        )}

        {nutritionInfo.petType === 'rabbit' && (
          <p className="text-sm mt-1">
            Provide unlimited hay, with pellets/veggies in morning and evening
          </p>
        )}

        {nutritionInfo.petType === 'bird' && (
          <p className="text-sm mt-1">
            Offer fresh food in morning, leave pellets available all day
          </p>
        )}

        {nutritionInfo.petType === 'sheep' && (
          <p className="text-sm mt-1">
            {nutritionInfo.mealsPerDay > 1 
              ? "Divide concentrated feed into meals, provide continuous hay"
              : "Provide continuous grazing with one main supplement meal"}
          </p>
        )}

        {nutritionInfo.petType === 'cow' && (
          <p className="text-sm mt-1">
            {nutritionInfo.mealsPerDay > 1 
              ? "Split grain/concentrates into meals, free access to forage"
              : "Continuous grazing with supplemental feeding"}
          </p>
        )}
      </div>

      {nutritionInfo.warning && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <h3 className="font-bold text-red-700">⚠️ {nutritionInfo.warning.title}</h3>
          <p className="text-red-700 mt-1 whitespace-pre-line">{nutritionInfo.warning.message}</p>
          {nutritionInfo.warning.calories && (
            <p className="text-red-700 mt-2">
              Suggested calories: <span className="font-bold">{nutritionInfo.warning.calories} kcal/day</span>
            </p>
          )}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold font-laila text-[#325747] mb-2">
          {selectedPet?.species} Care Tips:
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          {getSpeciesTips().map((tip, index) => (
            <li key={index} className="text-[#325747]">{tip}</li>
          ))}
        </ul>
      </div>

      {/* Critical Species-Specific Warnings */}
      {nutritionInfo.petType === 'dog' && (
        <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
          <p className="text-red-800 font-medium">🐶 Warning: Never feed dogs chocolate, grapes, onions, or xylitol!</p>
        </div>
      )}
      
      {nutritionInfo.petType === 'cat' && (
        <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
          <p className="text-red-800 font-medium">🐱 Critical: Cats must not consume lilies, onions, or raw fish!</p>
        </div>
      )}
      
      {nutritionInfo.petType === 'rabbit' && (
        <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
          <p className="text-yellow-800 font-medium">🐇 Critical: Rabbits must eat hay constantly for proper digestion!</p>
        </div>
      )}
      
      {nutritionInfo.petType === 'bird' && (
        <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
          <p className="text-red-800 font-medium">🦜 Warning: Never feed birds avocado, chocolate, or caffeine!</p>
        </div>
      )}
      
      {nutritionInfo.petType === 'sheep' && (
        <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
          <p className="text-yellow-800 font-medium">🐑 Important: Avoid sudden diet changes for sheep to prevent digestive issues!</p>
        </div>
      )}
      
      {nutritionInfo.petType === 'cow' && (
        <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
          <p className="text-yellow-800 font-medium">🐄 Critical: Introduce new feeds gradually to cows to prevent acidosis!</p>
        </div>
      )}
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default PetNutritionCalculator;