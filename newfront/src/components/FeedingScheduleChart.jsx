import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import axios from 'axios';
import { FaBell, FaBellSlash, FaCheck, FaTimes, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FeedingScheduleChart = ({ petId }) => {
  const [schedule, setSchedule] = useState({
    mealsPerDay: 2,
    mealTimes: [],
    remindersEnabled: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newMealTime, setNewMealTime] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [newMealFoodType, setNewMealFoodType] = useState('');
  const [newMealPortionSize, setNewMealPortionSize] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
              throw new Error("No authentication token found");
            }
    
        const [petRes, historyRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/pets/id/${petId}`, {
                headers: { Authorization: `Bearer ${token}` }
              }),
          axios.get(`http://localhost:5000/api/feeding/${petId}/feeding-history`)
        ]);

        if (petRes.data.pet?.feedingSchedule?.mealTimes) {
          setSchedule(petRes.data.pet.feedingSchedule);
        }

        if (historyRes.data) {
          setHistory(historyRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [petId]);




  if (isLoading) return <div>Loading feeding schedule...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!schedule) return <div>No schedule available</div>;

  const fetchFeedingSchedule = async () => {
    try {
        const response = await axios.get(`http://localhost:5000/api/pets/id/${petId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
       
      setSchedule(response.data.pet.feedingSchedule || {
        mealsPerDay: 2,
        mealTimes: [],
        remindersEnabled: true
      });
    } catch (error) {
      console.error('Error fetching feeding schedule:', error);
    }
  };


  // Helper function with improved date handling
  const getMealStatus = (mealTime) => {
    if (!history || history.length === 0) return 'pending';
    
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // Find most recent entry for this meal time
    const recentEntries = history
      .filter(entry => entry.mealTime === mealTime)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (recentEntries.length === 0) return 'pending';
    
    const mostRecent = recentEntries[0];
    
    if (mostRecent.status === 'given' && new Date(mostRecent.date) >= todayStart) {
      return 'given';
    }
    
    if (mostRecent.status === 'skipped') {
      // Check if skipped within the last 24 hours
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (new Date(mostRecent.date) >= twentyFourHoursAgo) {
        return 'skipped';
      }
    }
    
    return 'pending';
  };


  const fetchFeedingHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/feeding/${petId}/feeding-history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching feeding history:', error);
    }
  };

  const saveSchedule = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/feeding/${petId}/feeding-schedule`,
        schedule
      );
      setIsEditing(false);
      fetchFeedingSchedule(); // Refresh data
    } catch (error) {
      console.error('Error saving feeding schedule:', error);
    }
  };

  const toggleReminders = async () => {
    try {
      const updatedSchedule = {
        ...schedule,
        remindersEnabled: !schedule.remindersEnabled
      };
      
      await axios.put(
        `http://localhost:5000/api/feeding/${petId}/toggle-reminders`,
        { enabled: updatedSchedule.remindersEnabled }
      );
      
      setSchedule(updatedSchedule);
    } catch (error) {
      console.error('Error toggling reminders:', error);
    }
  };
  function convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    
    return `${hours.padStart(2, '0')}:${minutes}`;
}

  const addMealTime = () => {
    if (!newMealTime || !newMealCalories) return;
    
    const time24 = newMealTime.includes(' ') ? 
    convertTo24Hour(newMealTime) : 
    newMealTime;

    const newMeal = {
      time: time24,  
      calories: parseFloat(newMealCalories),
      foodType: newMealFoodType,
      portionSize: newMealPortionSize
  };

    setSchedule({
      ...schedule,
      mealTimes: [...schedule.mealTimes, newMeal]
    });
    
    // Reset form fields
    setNewMealTime('');
    setNewMealCalories('');
    setNewMealFoodType('');
    setNewMealPortionSize('');
  };

  const removeMealTime = (index) => {
    const updatedMealTimes = schedule.mealTimes.filter((_, i) => i !== index);
    setSchedule({
      ...schedule,
      mealTimes: updatedMealTimes
    });
  };

  const logFeeding = async (mealTime, status) => {
    try {
      await axios.post(`http://localhost:5000/api/feeding/${petId}/log-feeding`, {
        mealTime,
        status,
        notes: `Meal ${status} at ${new Date().toLocaleTimeString()}`,
        date: new Date() // Make sure to include the date
      });
      fetchFeedingHistory(); // Refresh history
      if (status=='given'){
        toast.success(`Meal ${status} at ${new Date().toLocaleTimeString()}`); 
      }
    } catch (error) {
      console.error('Error logging feeding:', error);
    }
  };

  const renderTimeChart = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="relative h-32 bg-gray-100 rounded-lg p-2 mt-4">
        {/* Hour markers */}
        {hours.map((hour) => (
          <div key={hour} className="absolute bottom-0 border-l border-gray-300"
            style={{ left: `${(hour / 24) * 100}%`, height: '100%' }}>
            <span className="text-xs text-gray-500 absolute -bottom-5 -ml-2">
              {hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour-12}PM`}
            </span>
          </div>
        ))}
        
        {/* Meal time indicators */}
        {schedule.mealTimes.map((meal, index) => {
          const [hour, minute] = meal.time.split(':').map(Number);
          const left = ((hour + minute / 60) / 24) * 100;
          const status = getMealStatus(meal.time);
          
          const statusColors = {
            given: '#10B981',   // green
            skipped: '#EF4444', // red
            pending: '#E59560'  // orange
          };

          return (
            <div
              key={index}
              className="absolute -top-3 w-4 h-4 rounded-full transform -translate-x-1/2"
              style={{ 
                left: `${left}%`,
                backgroundColor: statusColors[status]
              }}
              title={`${meal.time} - ${meal.calories}kcal - Status: ${status}`}
            >
            
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-center items-center h-32">
          <p>Loading feeding schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#325747]">Feeding Schedule</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleReminders}
            className={`p-2 rounded-full ${schedule.remindersEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'}`}
            title={schedule.remindersEnabled ? 'Disable reminders' : 'Enable reminders'}
          >
            {schedule.remindersEnabled ? <FaBell /> : <FaBellSlash />}
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-full bg-blue-100 text-blue-600"
            title="View history"
          >
            <FaHistory />
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1 rounded bg-[#325747] text-white"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          {isEditing && (
            <button 
              onClick={saveSchedule}
              className="px-3 py-1 rounded bg-[#E59560] text-white"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {renderTimeChart()}

      {isEditing ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="time"
              value={newMealTime}
              onChange={(e) => setNewMealTime(e.target.value)}
              className="border p-2 rounded"
              placeholder="Time"
              required
            />
            <input
              type="number"
              value={newMealCalories}
              onChange={(e) => setNewMealCalories(e.target.value)}
              className="border p-2 rounded"
              placeholder="Calories"
              required
              min="0"
              step="1"
            />
            <input
              type="text"
              value={newMealFoodType}
              onChange={(e) => setNewMealFoodType(e.target.value)}
              className="border p-2 rounded"
              placeholder="Food type (optional)"
            />
            <input
              type="text"
              value={newMealPortionSize}
              onChange={(e) => setNewMealPortionSize(e.target.value)}
              className="border p-2 rounded"
              placeholder="Portion size (optional)"
            />
          </div>
          <button 
            onClick={addMealTime}
            className="px-3 py-1 rounded bg-[#325747] text-white mb-4"
            disabled={!newMealTime || !newMealCalories}
          >
            Add Meal Time
          </button>

          <div className="space-y-2">
            {schedule.mealTimes.map((meal, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>
                  🕒 {meal.time} → {meal.calories} kcal 
                  {meal.foodType && ` (${meal.foodType})`}
                  {meal.portionSize && ` - ${meal.portionSize}`}
                </span>
                <button 
                  onClick={() => removeMealTime(index)}
                  className="text-red-500 p-1"
                  aria-label="Remove meal time"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {schedule.mealTimes.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-medium text-[#325747]">Today's Meal Plan:</h3>
              {schedule.mealTimes.map((meal, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>
                    🕒 {meal.time} → {meal.calories} kcal 
                    {meal.foodType && ` (${meal.foodType})`}
                    {meal.portionSize && ` - ${meal.portionSize}`}
                  </span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => logFeeding(meal.time, 'given')}
                      className="p-1 text-green-500 bg-green-100 rounded"
                      title="Mark as given"
                    >
                      <FaCheck />
                    </button>
                    <button 
                      onClick={() => logFeeding(meal.time, 'skipped')}
                      className="p-1 text-red-500 bg-red-100 rounded"
                      title="Mark as skipped"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No feeding schedule set up yet.</p>
          )}
        </div>
      )}

      {showHistory && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium text-[#325747] mb-2">Feeding History (Last 7 Days)</h3>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((entry, index) => (
                <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>
                    {new Date(entry.date).toLocaleDateString()} - {entry.mealTime}
                  </span>
                  <span className={`${entry.status === 'given' ? 'text-green-500' : 'text-red-500'}`}>
                    {entry.status === 'given' ? '✅ Given' : '❌ Skipped'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No feeding history recorded.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedingScheduleChart;
