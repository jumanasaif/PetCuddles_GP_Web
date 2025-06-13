import { useEffect } from 'react';
import { toast } from 'react-toastify';

const useFeedingReminder = (petId, feedingTimes = [], petName = "your pet") => {
  useEffect(() => {
    if (!feedingTimes || feedingTimes.length === 0 || !Array.isArray(feedingTimes)) {
      return;
    }

    // Create a more precise interval
    const checkFeedingTime = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      // Only check at the start of each minute to avoid multiple triggers
      if (currentSeconds > 2) return;

      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      feedingTimes.forEach(meal => {
        try {
          if (!meal) return;
          
          // Parse time (accepts both "HH:MM" and {time: "HH:MM"} formats)
          const timeStr = meal.time || meal;
          const [mealHours, mealMinutes] = timeStr.split(':').map(Number);

          if (isNaN(mealHours) || isNaN(mealMinutes)) return;

          // Check if current time matches exactly
          if (currentHours === mealHours && currentMinutes === mealMinutes) {
            toast.info(`🕒 Time to feed ${petName}! (${timeStr})`, {
              toastId: `feeding-${petId}-${timeStr}`,
              autoClose: 10000,
              closeOnClick: false,
              position: 'top-right',
              onClick: () => {
                toast.dismiss(`feeding-${petId}-${timeStr}`);
                window.location.href = `/pet-profile/${petId}`;
              }
            });
          }
        } catch (error) {
          console.error('Error in feeding reminder:', error);
        }
      });
    };

    // Initial check
    checkFeedingTime();

    // Set up interval (check every second but only act at minute start)
    const interval = setInterval(checkFeedingTime, 1000);

    return () => clearInterval(interval);
  }, [petId, feedingTimes, petName]);
};

export default useFeedingReminder;
