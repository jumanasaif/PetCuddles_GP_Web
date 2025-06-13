import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const VetSubscription = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { vetId } = useParams();

  // Styles
  const styles = {
    container: {
      backgroundColor: '#f6f4e8',
      minHeight: '100vh',
      width: '100%',
      marginTop:"80px"
    },
    scrollContainer: {
      paddingBottom: '40px',
    },
    overlay: {
      backgroundColor: 'rgba(246, 244, 232, 0.9)',
      padding: '20px',
      paddingTop: '50px',
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    },
    spinner: {
      border: '4px solid rgba(29, 49, 36, 0.1)',
      borderRadius: '50%',
      borderTop: '4px solid #325747',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
    },
    title: {
      fontSize: '32px',
      color: '#1d3124',
      textAlign: 'center',
      marginBottom: '8px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '700',
      letterSpacing: '0.5px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#e59560',
      textAlign: 'center',
      marginBottom: '30px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '500',
    },
    toggleContainer: {
      display: 'flex',
      backgroundColor: '#bacec1',
      borderRadius: '30px',
      padding: '5px',
      marginBottom: '30px',
      position: 'relative',
      overflow: 'hidden',
    },
    toggleOption: {
      flex: '1',
      padding: '12px 0',
      borderRadius: '25px',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
    },
    toggleOptionActive: {
      backgroundColor: '#325747',
    },
    toggleText: {
      color: '#1d3124',
      fontSize: '16px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '600',
    },
    toggleTextActive: {
      color: '#f6f4e8',
    },
    savingsBadge: {
      position: 'absolute',
      top: '-8px',
      right: '10px',
      backgroundColor: '#e59560',
      padding: '2px 8px',
      borderRadius: '10px',
    },
    savingsText: {
      color: '#f6f4e8',
      fontSize: '12px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '700',
    },
    planCard: {
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      padding: '25px',
      boxShadow: '0 10px 20px rgba(29, 49, 36, 0.1)',
      marginBottom: '30px',
      transition: 'transform 0.3s ease',
    },
    planCardYearly: {
      transform: 'translateY(-15px)',
    },
    planHeader: {
      textAlign: 'center',
      marginBottom: '25px',
    },
    planPrice: {
      fontSize: '40px',
      color: '#1d3124',
      marginBottom: '5px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '700',
    },
    planPeriod: {
      fontSize: '18px',
      color: '#e59560',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '500',
    },
    featuresContainer: {
      marginBottom: '30px',
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px',
    },
    checkIcon: {
      width: '24px',
      height: '24px',
      borderRadius: '12px',
      backgroundColor: '#bacec1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
      flexShrink: '0',
    },
    checkText: {
      color: '#1d3124',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '700',
    },
    featureText: {
      flex: '1',
      fontSize: '16px',
      color: '#1d3124',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '500',
    },
    subscribeButton: {
      backgroundColor: '#e59560',
      padding: '16px 0',
      borderRadius: '15px',
      border: 'none',
      width: '100%',
      marginBottom: '20px',
      cursor: 'pointer',
    },
    subscribeButtonText: {
      color: '#f6f4e8',
      fontSize: '20px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '700',
      letterSpacing: '0.5px',
    },
    termsText: {
      color: '#bacec1',
      textAlign: 'center',
      fontSize: '14px',
      textDecoration: 'underline',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'block',
      width: '100%',
    },
    errorText: {
      color: '#e74c3c',
      fontSize: '18px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '500',
      textAlign: 'center',
      padding: '20px',
    },
    retryButton: {
      marginTop: '20px',
      backgroundColor: '#e59560',
      padding: '10px 30px',
      borderRadius: '25px',
      border: 'none',
      cursor: 'pointer',
    },
    retryButtonText: {
      color: '#f6f4e8',
      fontSize: '16px',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '600',
    },
    infoContainer: {
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      padding: '20px',
      marginTop: '10px',
    },
    infoTitle: {
      fontSize: '20px',
      color: '#1d3124',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '700',
      marginBottom: '15px',
      textAlign: 'center',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    infoBullet: {
      color: '#e59560',
      fontSize: '20px',
      marginRight: '10px',
    },
    infoText: {
      fontSize: '16px',
      color: '#1d3124',
      fontFamily: '"Laila", sans-serif',
      fontWeight: '500',
      flex: '1',
    },
  };

  // Keyframes for spinner
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/subscriptions/vet');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPlans(data);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
        setPlans({
          monthly: {
            price: '$9.99',
            period: 'month',
            features: [
              'Full access to all features',
              'Cancel anytime',
              'Priority support',
              'Monthly updates'
            ],
          },
          yearly: {
            price: '$99.99',
            period: 'year',
            savings: 'Save 20%',
            features: [
              'Everything in monthly',
              '2 months free',
              'Exclusive content',
              'Early access to new features'
            ],
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  if (loading && !plans) {
    return (
      <div style={styles.container}>
        <div style={{...styles.container, ...styles.center}}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (error && !plans) {
    return (
      <div style={{...styles.container, ...styles.center}}>
        <div style={styles.errorText}>{error}</div>
        <button 
          style={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          <span style={styles.retryButtonText}>Retry</span>
        </button>
      </div>
    );
  }

  const selectedPlanData = plans[selectedPlan];

  return (
    <div style={styles.container}>
      <div style={styles.scrollContainer}>
        <div style={styles.overlay}>
          <h1 style={styles.title}>Choose Your Plan</h1>
          <p style={styles.subtitle}>Unlock premium veterinary features</p>

          <div style={styles.toggleContainer}>
            <button
              style={{
                ...styles.toggleOption,
                ...(selectedPlan === 'monthly' ? styles.toggleOptionActive : {})
              }}
              onClick={() => handlePlanSelect('monthly')}
            >
              <span style={{
                ...styles.toggleText,
                ...(selectedPlan === 'monthly' ? styles.toggleTextActive : {})
              }}>
                Monthly
              </span>
            </button>
            <button
              style={{
                ...styles.toggleOption,
                ...(selectedPlan === 'yearly' ? styles.toggleOptionActive : {})
              }}
              onClick={() => handlePlanSelect('yearly')}
            >
              <span style={{
                ...styles.toggleText,
                ...(selectedPlan === 'yearly' ? styles.toggleTextActive : {})
              }}>
                Yearly
              </span>
              {selectedPlan === 'yearly' && plans.yearly?.savings && (
                <div style={styles.savingsBadge}>
                  <span style={styles.savingsText}>{plans.yearly.savings}</span>
                </div>
              )}
            </button>
          </div>

          <div style={{
            ...styles.planCard,
            ...(selectedPlan === 'yearly' ? styles.planCardYearly : {})
          }}>
            <div style={styles.planHeader}>
              <div style={styles.planPrice}>{selectedPlanData.price}</div>
              <div style={styles.planPeriod}>per {selectedPlanData.period}</div>
            </div>

            <div style={styles.featuresContainer}>
              {selectedPlanData.features.map((feature, index) => (
                <div key={index} style={styles.featureItem}>
                  <div style={styles.checkIcon}>
                    <span style={styles.checkText}>✓</span>
                  </div>
                  <div style={styles.featureText}>{feature}</div>
                </div>
              ))}
            </div>

            <button 
              style={styles.subscribeButton}
              onClick={() => navigate(`/visa/${vetId}`, { 
                state: { amount: selectedPlanData.price.replace(/\D/g, '') }
              })}
            >
              <span style={styles.subscribeButtonText}>Subscribe Now</span>
            </button>

            <button 
              onClick={() => navigate('/terms')} 
              style={styles.termsText}
            >
              Terms & Conditions Apply
            </button>
          </div>

          <div style={styles.infoContainer}>
            <div style={styles.infoTitle}>What's Included</div>
            <div style={styles.infoItem}>
              <span style={styles.infoBullet}>•</span>
              <span style={styles.infoText}>24/7 access to veterinary resources</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoBullet}>•</span>
              <span style={styles.infoText}>Continuing education credits</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoBullet}>•</span>
              <span style={styles.infoText}>Exclusive veterinary community</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetSubscription;
