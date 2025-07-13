# PetCuddles 🐾

**This project is a Graduation Project submitted in partial fulfillment of the requirements for the degree of Bachelor of Computer Engineering at An-Najah National University.**

**PetCuddles** is a comprehensive web and mobile platform for pet care, designed to support pet owners, clinics, veterinarians, and shops in Palestine. This repository contains the **web version** of the platform, which offers features such as pet health tracking, clinic services, AI-based analysis, appointment booking, adoption, and more — all within a unified system that enhances pet care accessibility and organization.


---

## 📚 Features

### For Pet Owners
- Create and manage pet profiles (images, age, breed, weight, etc.)
- Health tracking: vaccinations, medications, lab results
- AI-powered image analysis for skin issues and behavioral insights
- Nutrition assistant to suggest daily meals and track weight
- Interactive map displaying nearby veterinary clinics and pet stores
- Book vet appointments and chat with experts
- Report lost pets and request temporary pet-sitting
- Browse and adopt pets through a matchmaking system
- Access community content: articles, videos, events
- Receive alerts for emergencies and weather-related dangers
- Get reminders for feeding, and veterinary visits
- Digital pet ID cards with QR code access for quick identification
- Travel guide for pet-friendly accommodations
- Educational library with training and emergency care resources

### For Clinics & Veterinarians
- Sign-up with license upload and working hours
- Admin approval with Ministry of Agriculture stamp verification
- Subscription plans (monthly/yearly) with Visa payment
- Receive appointment requests and chat with pet owners
- Upload lab results and health records
- Add doctors and create account for them 
- Manage Patients, services provided vaccination and laboratory tests 
- Provide temporary care for pets 

### For Doctors 
- Manage appointments and chat with pet owners
- Upload lab results and health records
- Manage Patients

### For Pet Shops
- List products and manage orders via Visa payments
- Apply coupons and handle delivery details
- Inventory tracking for pet supplies with restock reminders 
- Communicate with customers through the platform

### For Administrators
- Approve or reject clinic registrations
- Manage user roles (owner, vet, shop, doctors)
- Oversee content, service subscriptions, and AI model settings
- Mange educational library ( add,edit,delete the content )
- Manage Weather, Health alerts  

---

## 🚀 Installation & Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/jumanasaif/PetCuddles_GP_Web.git
   cd PetCuddles_GP_Web
2. Install dependencies:
     npm install
3. Configure environment variables (.env):
   - MONGO_URI= < your MongoDB URI >
   - JWT_SECRET= < your JWT secret >
   - VISA_API_KEY= < your Visa payment API credentials >
   - PYTHON_LICENSE_SERVICE= http://localhost: < any port >/verify-license
   - PYTHON_DISEASE_SERVICE= http://localhost:< any port >/predict
   - OPENAI_API_KEY=  < your OpenAi api key >
   - WEATHER_API_KEY= < your OpenWeather api key >
4. Access the Web site:
    http://localhost:3000

## 🔧 Method Used

- Backend: Node.js, Express, MongoDB

- Frontend: React.js , Tailwind

- AI Services: Python

- Test Api: Postman

- Chat & Notification: WebSocket

- Other: EmailJs , Visa Strip Integration for payment


