import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faExclamationTriangle, 
  faThermometerHalf,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AlertsDashboard = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    appointments: 0,
    diseases: 0,
    temperature: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch alert counts from backend
  useEffect(() => {
    const fetchAlertCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch all counts in parallel
        const [appointmentsRes, diseasesRes, temperatureRes] = await Promise.all([
          axios.get('http://localhost:5000/api/appointment/reminder-count', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/admin/disease/unread-count', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/admin/weather/unread-count', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCounts({
          appointments: appointmentsRes.data.count,
          diseases: diseasesRes.data.count,
          temperature: temperatureRes.data.count
        });
      } catch (error) {
        console.error('Error fetching alert counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertCounts();
  }, []);

  const alertCards = [
    {
      title: "Appointment Reminders",
      icon: faCalendarAlt,
      count: counts.appointments,
      color: "bg-[#325747]",
      hoverColor: "hover:bg-[#233c31]",
      textColor: "text-white",
      route: "/appointments-reminder"
    },
    {
      title: "Health Alerts",
      icon: faExclamationTriangle,
      count: counts.diseases,
      color: "bg-[#E59560]",
      hoverColor: "hover:bg-[#d6824a]",
      textColor: "text-white",
      route: "/user/disease-alerts"
    },
    {
      title: "Temperature Alerts",
      icon: faThermometerHalf,
      count: counts.temperature,
      color: "bg-[#BACEC1]",
      hoverColor: "hover:bg-[#a8bcb0]",
      textColor: "text-[#325747]",
      route: "/user/alerts"
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E59560]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4E8] p-6 font-laila" style={{ marginTop: '80px' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#325747] to-[#233c31] text-white p-6 rounded-3xl shadow-lg mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Alerts Dashboard</h1>
              <p className="text-gray-300 mt-2">
                View and manage all your pet-related alerts in one place
              </p>
            </div>
            <div className="bg-white rounded-full p-3 shadow-md">
              <FontAwesomeIcon icon={faBell} className="text-[#325747] text-2xl" />
              <span className="absolute -top-1 -right-1 bg-[#E59560] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {counts.appointments + counts.diseases + counts.temperature}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {alertCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`${card.color} ${card.hoverColor} ${card.textColor} rounded-xl shadow-lg p-6 cursor-pointer`}
              onClick={() => navigate(card.route)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{card.title}</h2>
                  <p className="mt-2">
                    {card.count} {card.count === 1 ? 'alert' : 'alerts'}
                  </p>
                </div>
                <div className="relative">
                  <FontAwesomeIcon icon={card.icon} className="text-3xl" />
                  {card.count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-[#325747] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {card.count}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Alerts Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 mt-8"
        >
          <h2 className="text-xl font-bold text-[#325747] mb-4">Recent Alerts</h2>
          
          <div className="space-y-4">
            {/* This would be populated with actual recent alerts from your backend */}
            <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center">
                <div className="bg-[#325747] text-white p-2 rounded-lg mr-4">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </div>
                <div>
                  <h3 className="font-medium">Appointment Reminder</h3>
                  <p className="text-sm text-gray-600">Annual checkup for Bella tomorrow at 2:00 PM</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center">
                <div className="bg-[#E59560] text-white p-2 rounded-lg mr-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </div>
                <div>
                  <h3 className="font-medium">Health Alert</h3>
                  <p className="text-sm text-gray-600">Canine flu outbreak in your area</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 hover:bg-gray-50">
              <div className="flex items-center">
                <div className="bg-[#BACEC1] text-[#325747] p-2 rounded-lg mr-4">
                  <FontAwesomeIcon icon={faThermometerHalf} />
                </div>
                <div>
                  <h3 className="font-medium">Temperature Alert</h3>
                  <p className="text-sm text-gray-600">High temperature warning for dogs</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AlertsDashboard;