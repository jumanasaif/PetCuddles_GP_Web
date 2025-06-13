import React, { useEffect, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotificationContext } from './components/NotificationContext';
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/header";
import FirstHeader from "./components/FirstHeader";  
import SignupPage from "./components/SignUp";
import LoginPage from "./components/LogIn"; 
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import HomePage from "./components/Home";
import OwnerProfile from "./components/OwnerProfile";
import OwnerPets from "./components/OwnerPets";
import PetProfile from "./components/petProfile";
import Community from "./components/community";
import Adoption from "./components/Adoption";
import PetDetails from "./components/PetDetails";
import { NotificationProvider } from './components/NotificationContext';
import AdoptionRequestDetails from "./components/AdoptionRequestDetails";
import AdoptionRequestsList from "./components/AdoptionRequestsList";
import PetNutritionCalculator from "./components/PetNetrution";
import CaretakerPets from "./components/CaretakerPets";
import PetQRCode from "./components/PetQRCode";
import ExtendAdoption from "./components/ExtendAdoption";
import VetSignUp from "./components/VetSignUp";
import RoleSelection from "./components/RoleSelection";
import ExtensionResponse from "./components/ExtensionResponse";
import { FaUtensils, FaHandHoldingHeart, FaBullhorn,FaCommentAlt } from 'react-icons/fa';
import Admin from "./components/admin";
import Subscription from "./components/Subscription";
import AdminHeader from "./components/AdminHeader";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import VisaInformationForm from './components/Visa';
import Clinic from "./components/clinic";
import VetHeader from "./components/VetHeader";
import ClinicDashboard from "./components/ClinicDashboard";
import VetServices from "./components/VetServices";
import AppointmentForm from "./components/AppointmentForm";
import VetAppointments from "./components/VetAppointments";
import HealthRecordsPage from './components/HealthRecordsPage';
import HealthRecordDetail from './components/HealthRecordDetail';
import FoundPetForm from './components/FoundPetForm';
import VaccinationInfoPage from './components/vetVaccination';
import LabTestManagement from './components/LabTestManagement';
import LabTestResultForm from './components/LabTestResultForm';
import VetPatients from './components/vetPatients';
import FoundPetAdoptionForm from './components/FoundPetAdoptionForm';
import FoundPetsAdoptionRequestsList from './components/FoundPetsAdoptionRequestsList';
import FoundPetsAdoptionRequestDetails from './components/FoundPetsAdoptionRequestDetails';
import SkinAnalysis from './components/SkinAnalysis';
import PetHealthRecordsPage from './components/HealthRecordPage';
import ClinicProfileContainer from './components/ClinicProfileContainer';
import VetDiscovery from "./components/VetDiscovery";
import AppointmentReminder from "./components/AppointmentReminder";
import VetTemporaryCareSettings from "./components/VetTemporaryCareSettings";
import PostAdoptionOptions from "./components/PostAdoptionOptions";
import VetTemporaryCareRequest from "./components/VetTemporaryCareRequest";
import VetRequestsList from "./components/vetRequestsList";
import VetRequestDetail from "./components/VetRequestDetail";
import VetActiveTemporaryPets from "./components/VetActiveTemporaryPets";
import PetBehaviorAnalysis from "./components/PetBehaviorAnalysis";
import ShopSignupPage from "./components/ShopSignup";
import ShopOwnerDashboard from "./components/ShopHome";
import Products from "./components/Products";
import ProductDetail from "./components/ProductForm";
import Coupon from "./components/Coupon";
import ShopListPage from './components/ShopListPage';
import ShopProductsPage from './components/ShopProductsPage'
import ShopSettings from "./components/ShopSettings";
import Orders from "./components/orders";
import InventoryDashboard from "./components/InventoryDashboard";
import { WebSocketProvider } from './components/WebSocketContext';
import { ChatProvider } from './components/ChatProvider';
import ChatPage from './components/ChatPage';
import ShopSubscription from "./components/ShopSubscription";
import ShopVisaPayment from "./components/VisaShop";
import Dashboard from "./components/AdminDashboard";
import AdminPetOwners from "./components/AdminPetOwner";
import AdminPets from "./components/AdminPets";
import AdminVetsManagement from "./components/AdminVets";
import AdminShopsManagement from "./components/AdminShops";
import AdminDoctorsManagement from "./components/AdminDoctors";
import PaymentManagement from "./components/AdminPayments";
import PetAnalyticsDashboard from "./components/AdminServices";
import LibraryDashboard from "./components/AdminLibraryDashboard";
import LibraryItemForm from "./components/AdminLibraryItemForm";
import CategoryForm from "./components/AdminLibCategoryForm";
import LibraryPage from "./components/LibraryPage";
import LibraryItemDetail from "./components/LibraryItemDetail";
import WeatherAlertsAdmin from "./components/AdminWeatherAlerts";
import WeatherAlerts from "./components/WeatherAlertsUser";
import DiseaseAlert from "./components/DiseaseAlertsUser";
import DiseaseAlertDetail from "./components/DiseaseAlertDetail";
import DiseaseAlertsAdmin from "./components/AdminDiseaseAlerts";
import DiseaseAlertForm from "./components/DiseaseAlertForm";
import DoctorDashboard from "./components/DoctorDashboard";
import DoctorAppointments from "./components/DoctorAppointments";
import DoctorProfile from "./components/DoctorProfile";
import DoctorLabTests from "./components/DoctorLabTests";
import DoctorPatients from "./components/DoctorPatients";
import ClinicDoctorsManagement from "./components/ClinicDoctorsManagement";
import AlertsDashboard from "./components/UserAlertsDashboard";
import ShopLayout from "./components/ShopLayout";
import DoctorHeader from "./components/DoctorHeader";
import TravelGuidePage from "./components/TravelGuide/TravelGuidePage";
import PaymentsPage from "./components/Strip";

const Layout = ({ children }) => {
  const location = useLocation();
  const noHeaderPaths = ["/signup", "/login", "/forget-password", "/reset-password/:token"];
  const adminPaths = ["/admin"];
  const vetPaths = ["/clinic", "/health", "/clinic-dashboard"];
  const shopPaths = ["/shop", "/shop/products", "/shop/orders"];
  const chatPaths = ["/chat"];
  const doctorPath = ["/doctor"];

  const user = JSON.parse(localStorage.getItem('user')) || 
               JSON.parse(localStorage.getItem('clinic')) || 
               JSON.parse(localStorage.getItem('admin')) || 
               JSON.parse(localStorage.getItem('shop'));

  // Check path types
  const isAdminPath = adminPaths.some(path => location.pathname.startsWith(path));
  const isVetPath = vetPaths.some(path => location.pathname.startsWith(path));
  const isShopPath = shopPaths.some(path => location.pathname.startsWith(path));
  const isChatPath = chatPaths.some(path => location.pathname.startsWith(path));
  const isdoctorPath = doctorPath.some(path => location.pathname.startsWith(path));

  // Special cases
  const isAppointmentForm = location.pathname === "/clinic-appointment";
  const showVetHeader = isVetPath && (!isAppointmentForm || user?.role === 'vet');

  // Determine which header to show for chat
  const getChatHeader = () => {
    if (!user) return <Header />;
    if (user.role === 'vet') return <VetHeader />;
     if (user.role === 'admin') return <AdminHeader />;
    if (user.role === 'shop') return null;
    if (user.role === 'doctor') return <DoctorHeader/> ; 
    return <Header />;
  };

  return (
    <>
      {noHeaderPaths.includes(location.pathname) ? (
        <FirstHeader />
      ) : isAdminPath ? (
        null
      ): isdoctorPath ? (
        null
      ) : showVetHeader ? (
        <VetHeader />
      ) : isShopPath ? (
        null // Or <ShopHeader /> if you have one
      ) : isChatPath ? (
        getChatHeader()
      ) : (
        <Header />
      )}
      {children}
    </>
  );
};

const AppContent = () => {
  const { setNotifications, setUnreadCount } = useContext(NotificationContext);

  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const ws = new WebSocket(`ws://localhost:5000?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket connection established");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
        
          // Handle different message types
          switch (data.type) {
            case "feeding-reminder":
              const feedingToastId = `feeding-${data.petId}-${data.mealTime}`;
              

              
              toast.info(
                <div className="flex items-center">
                  <FaUtensils className="mr-2 text-orange-500" />
                  {data.message}
                </div>, 
                {
                  toastId: feedingToastId,
                  autoClose: 20000, // 15 seconds for feeding reminders
                  closeOnClick: false,
                  position: 'top-right',
                  className: 'border-l-4 border-orange-500',
                  onClick: () => {
                    toast.dismiss(feedingToastId);
                    if (data.link) {
                      window.location.href = data.link;
                    }
                  }
                }
              );
      
              // Add to notifications context
              const feedingNotification = {
                _id: `feeding-${Date.now()}`,
                message: data.message,
                link: data.link,
                type: 'feeding',
                petId: data.petId,
                mealTime: data.mealTime,
                read: false,
                createdAt: new Date()
              };
              setUnreadCount(prev => prev + 1);
              setNotifications(prev => [feedingNotification, ...prev]);
           break;
      
           case "notification":
              const notificationToastId = `notification-${Date.now()}`;
           
              
              toast.info(
                <div className="flex items-center">
                  {data.data.message}
                </div>,
                {
                  toastId: notificationToastId,
                  autoClose: 20000,
                  closeOnClick: false,
                  icon:false,
                  position: 'top-right',
                  className: 'border-l-4 border-yellow-500',
                  onClick: () => {
                    toast.dismiss(notificationToastId);
                    if (data.data.link) {
                      window.location.href = data.link;
                    }
                  }
                }
              );
      
              // Add to notifications context
              const newNotification = {
                _id: data.data._id || `notification-${Date.now()}`,
                message: data.data.message,
                link: data.data.link,
                type: data.data.notificationType || 'system',
                read: false,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
              };
              setUnreadCount(prev => prev + 1);
              setNotifications(prev => [newNotification, ...prev]);
           break;
      
            case "adoption-update":
              
              const adoptionToastId = `adoption-${data.requestId || Date.now()}`;
              
              
              toast.info(
                <div className="flex items-center">
                  <FaHandHoldingHeart className="mr-2 text-green-500" />
                  {data.message}
                </div>,
                {
                  toastId: adoptionToastId,
                  autoClose: 20000,
                  closeOnClick: false,
                  position: 'top-right',
                  className: 'border-l-4 border-blue-500',
                  onClick: () => {
                    toast.dismiss(adoptionToastId);
                    if (data.link) {
                      window.location.href = data.link;
                    }
                  }
                }
              );
           break;
      
            case "lost-pet-alert":
              const lostPetToastId = `lost-pet-${data.petId}`;
              
              
      
              
              toast.error(
                <div className="flex items-center">
                  <FaBullhorn className="mr-2 text-red-500" />
                  <strong>{data.message}</strong>
                </div>,
                {
                  toastId: lostPetToastId,
                  autoClose: false, // Don't auto-close lost pet alerts
                  closeOnClick: false,
                  position: 'top-right',
                  className: 'border-l-4 border-red-500',
                  onClick: () => {
                    toast.dismiss(lostPetToastId);
                    if (data.link) {
                      window.location.href = data.link;
                    }
                  }
                }
              );
              break;
            case 'online-users':
            // Handle online users list
            console.log('Online users :', data.users);
            break;
            
          case 'new-message-notification':
               toast(
                <div className="flex items-center">
                  <FaCommentAlt className="mr-2 text-blue-500" />
                  {data.message || `${data.userId} sent you a message `}
                </div>,
                {
            
                  autoClose: 10000,
                  closeOnClick: false,
                  position: 'top-right',
                  className: 'border-l-4 border-blue-500',
                  
                }
              );

            break;
            
          case 'user-connected':
          case 'user-disconnected':
            // Handle user status changes
         break;

        case 'disease-alert':
  const diseaseToastId = `disease-${data.petId || Date.now()}`;
  
  // Determine icon and color based on severity
  let diseaseIcon, diseaseColor;
  switch (data.severity) {
    case 'medium':
      diseaseIcon = '⚠️';
      diseaseColor = 'orange';
      break;
    case 'high':
      diseaseIcon = '❗';
      diseaseColor = 'red';
      break;
    default:
      diseaseIcon = 'ℹ️';
      diseaseColor = 'blue';
  }
  
  toast(
    <div className="flex items-center">
      <span className="mr-2 text-xl">{diseaseIcon}</span>
      <div>
        <p className="font-medium">{data.message}</p>
        <p className="text-sm">Tap for more details</p>
      </div>
    </div>,
    {
      toastId: diseaseToastId,
      autoClose: data.severity === 'high' ? false : 10000,
      closeOnClick: false,
      position: 'top-right',
      className: `border-l-4 border-${diseaseColor}-500`,
      onClick: () => {
        toast.dismiss(diseaseToastId);
        if (data.link) {
          window.location.href = data.link;
        }
      }
    }
  );
  
  // Add to notifications context
  const diseaseNotification = {
    _id: `disease-${Date.now()}`,
    message: data.message,
    link: data.link,
    type: 'disease-alert',
    severity: data.severity,
    petId: data.petId,
    read: false,
    createdAt: new Date()
  };
  setUnreadCount(prev => prev + 1);
  setNotifications(prev => [diseaseNotification, ...prev]);
  break;

        case "error":
              toast.error(data.message, {
                autoClose: 5000,
                position: 'top-right'
              });
        break;
      
       case "ping":
              // Handle ping/pong for connection health
              console.log("WebSocket ping received");
      break;
      
            default:
              console.warn("Unknown WebSocket message type:", data.type);
              toast.info(data.message || "New notification jj", {
                autoClose: 5000,
                position: 'top-right'
              });
          }
      
        } catch (error) {
          console.error("Error processing WebSocket message:", error, event.data);
          toast.error("Error processing notification", {
            autoClose: 3000,
            position: 'top-right'
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Retry connection after delay
        setTimeout(connectWebSocket, 3000);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        // Retry connection after delay
        setTimeout(connectWebSocket, 3000);
      };

      return () => ws.close();
    };

    connectWebSocket();
  }, [setNotifications, setUnreadCount]);

 return (
   <WebSocketProvider>
   <ChatProvider>
  <Router>
     <Layout>
        <ToastContainer position="top-right" autoClose={5000} />
         <Routes>
            <Route path="/" element={<RoleSelection  />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/home" element={<HomePage />} />
            <Route path="/UserProfile" element={<OwnerProfile />} />

            <Route path="/ownerpets" element={<OwnerPets />} />
            <Route path="/pet-profile/:petId" element={<PetProfile />} />
            
            <Route path="/community" element={<Community />} />
            
            <Route path="/adoption" element={<Adoption />} />
            <Route path="/caretaker-pets" element={<CaretakerPets />} />
            <Route path="/pet-nutrition" element={<PetNutritionCalculator />} />
            <Route path="/adoptdetailes/:petId" element={<PetDetails />} />
            <Route path="/adoption/requests" element={<AdoptionRequestsList />} />
            <Route path="/adoption/requests/:requestId" element={<AdoptionRequestDetails />} />
            <Route path="/digital-pet-id" element={<PetQRCode />} />
            <Route path="/vet/signup" element={<VetSignUp />} />
            <Route path=":petId/extend-adoption" element={<ExtendAdoption />} />
           <Route path="/extensions/respond/:requestId" element={<ExtensionResponse />} />
           <Route path="/subscriptions/vet/:vetId" element={<Subscription />} />
           <Route path="/visa/:vetId" element={<VisaInformationForm />} />
           <Route path="/clinic" element={<Clinic />} />
           <Route path="/clinic-dashboard" element={<ClinicDashboard />} />
           <Route path="/clinic-service" element={<VetServices />} />
          <Route path="/clinic-appointment"
           element={  
            <Layout>
              <AppointmentForm />
           </Layout>
           } 
         />    
          <Route path="/clinic-appointments" element={<VetAppointments/>} />
          <Route path="/health-records" element={<HealthRecordsPage />} />
          <Route path="/health-records/:id" element={<HealthRecordDetail />} />
          <Route path="/health-records/edit/:id" element={<HealthRecordsPage />} />
          <Route path="/health-records/upload/:id" element={<HealthRecordsPage />} />
          <Route path="/health-records/found-pet" element={<FoundPetForm />} />
          <Route path="/clinic-vaccinations" element={<VaccinationInfoPage />} />
          <Route path="/clinic/lab-test" element={<LabTestManagement />} />
          <Route path="/clinic/lab-tests/:id/results" element={<LabTestResultForm />} />
          <Route path="/clinic/patients" element={<VetPatients/>} />
          <Route path="/clinic/found-pets/:petId/create-adoption"  element={<FoundPetAdoptionForm />} />
          <Route path="/clinic/found-pets/adoption/requests"  element={<FoundPetsAdoptionRequestsList />} />
          <Route path="/clinic/found-pets/requests/:id"  element={<FoundPetsAdoptionRequestDetails />} />
          <Route path="/pet-health/skin-analysis" element={<SkinAnalysis />} />
          <Route path="/pets/:petId/health-records" element={<PetHealthRecordsPage />} />
          <Route path="/clinic-profile" element={<ClinicProfileContainer />} />
          <Route path="/vet-profile/:clinicId" element={<ClinicProfileContainer />} />
          <Route path="/vet-discovery" element={<VetDiscovery />} />
          <Route path="/book-appointment/:clinicId" element={<AppointmentForm />} /> 
          <Route path="/appointments-reminder" element={<AppointmentReminder />} />
          <Route path="/clinic-temporary-care" element={<VetTemporaryCareSettings />} />
          <Route path="/:petId/post-adoption-options" element={<PostAdoptionOptions />} />
         <Route path="/vet-temporary-care/request" element={<VetTemporaryCareRequest />} />
         <Route path="/clinic-care/requests" element={<VetRequestsList />} />
         <Route path="/clinic/temporary-care/requests/:requestId" element={<VetRequestDetail />} />
         <Route path="/clinic/temporary-care/pets/active" element={<VetActiveTemporaryPets />} />
         <Route path="/pets/:petId/behavior" element={<PetBehaviorAnalysis />} />
          <Route path="/behavior" element={<PetBehaviorAnalysis />} />
          <Route path="/shop/signup" element={<ShopSignupPage />} />
          <Route path="/shop" element={<ShopOwnerDashboard />} />
          <Route path="/shop/products" element={<Products />} />
          <Route path="/shop/products/edit" element={<ProductDetail />} />
          <Route path="/shop/coupons" element={<Coupon />} />
          <Route path="/owner/shops" element={<ShopListPage />} />
          <Route path="/owner/shops/:shopId/products" element={<ShopProductsPage />} />
          <Route path="/shop/profile" element={<ShopSettings />} />
          <Route path="/shop/orders" element={<Orders />} />
          <Route path="/shop/inventory" element={<InventoryDashboard />} />
          <Route path="/shop/subscription" element={<ShopSubscription />} />
          <Route path="/shop-payment" element={<ShopVisaPayment />} />
          <Route path="/chat" element={<ChatPage />} />
          
          <Route path="/admin/approvals" element={<Admin />} />  
          <Route path="/admin/dashboard" element={<Dashboard/>} />
          <Route path="/admin/pet-owner" element={<AdminPetOwners />} /> 
          <Route path="/admin/pets" element={<AdminPets />} /> 
          <Route path="/admin/vets" element={<AdminVetsManagement />} /> 
          <Route path="/admin/shops" element={<AdminShopsManagement />} /> 
          <Route path="/admin/doctors" element={<AdminDoctorsManagement />} /> 
          <Route path="/admin/payments" element={<PaymentManagement />} /> 
          <Route path="/admin/services" element={<PetAnalyticsDashboard />} /> 

          <Route path="/admin/library" element={<LibraryDashboard />} /> 
          <Route path="/admin/library/form" element={<LibraryItemForm />} /> 
          <Route path="/admin/library/edit/:id" element={<LibraryItemForm />} />
          <Route path="/admin/library/categories/add" element={<CategoryForm />} />
          <Route path="/admin/library/categories/edit/:id" element={<CategoryForm />} />
          <Route path="/owner/library" element={<LibraryPage />} /> 
          <Route path="/owner/library/:id" element={<LibraryItemDetail />} /> 
                    <Route path="/strip" element={<PaymentsPage />} /> 


          <Route path="/user/alerts" element={<WeatherAlerts />} /> 
          <Route path="/user/disease-alerts" element={<DiseaseAlert />} /> 
          <Route path="/alerts/dashboard" element={<AlertsDashboard />} />  
          <Route path="/user/disease-alerts/:id" element={<DiseaseAlertDetail />} /> 

          <Route path="/admin/alerts" element={<WeatherAlertsAdmin />} /> 
          <Route path="/admin/disease-alerts" element={<DiseaseAlertsAdmin />} /> 
          <Route path="/admin/disease-alerts/:id" element={<DiseaseAlertForm />} /> 
          <Route path="/admin/disease-alerts/new" element={<DiseaseAlertForm />} /> 
          <Route path="/admin/disease-alerts/new" element={<DiseaseAlertForm />} /> 

          <Route path="/doctor-dashboard" element={<DoctorDashboard />} /> 
          <Route path="/doctor-appointments" element={<DoctorAppointments />} /> 
          <Route path="/doctor-profile" element={<DoctorProfile />} /> 
          <Route path="/doctor-lab-tests" element={<DoctorLabTests />} />  
          <Route path="/doctor-patients" element={<DoctorPatients />} />  
          <Route path="/clinic-doctors" element={<ClinicDoctorsManagement />} /> 
          <Route path="/travel-guid" element={<TravelGuidePage />} /> 


          

          </Routes>
      </Layout>
    </Router>
   </ChatProvider>
 </WebSocketProvider>
  );
};
const stripePromise = loadStripe('');

const App = () => {
  return (
    <NotificationProvider>
      <Elements stripe={stripePromise}>
        <AppContent />
      </Elements>
    </NotificationProvider>
  );
};

export default App;

