import React from "react";
import {useState} from "react";
import { motion } from "framer-motion";
import Header from "./header";
import Home from "../assets/homee.png";
import PetsImage from "../assets/petsss.png";
import AboutBg from "../assets/bg.png"; 
import BlogImg from "../assets/blogi.jpg"; 
import BlogImg1 from "../assets/blogg.jpg"; 
import CommunityImage from "../assets/cccc.png";
import QrImage from "../assets/pfa.png";
import qr from "../assets/qrr.png"; 
import { FaPaw, FaDog, FaBowlFood, FaMapMarkerAlt ,FaBone,FaPlus,FaMinus,FaStar,FaUserAlt,FaCalendarAlt} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBowlFood } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { faPaw } from '@fortawesome/free-solid-svg-icons';
import "@fontsource/laila"; 


const services = [
  { icon: <FaPaw />, title: "Expert Vet Care", description: "Professional medical care for your pets.", link: "/vet-care" },
  { icon: <FaDog />, title: "Smart Pet Training", description: "Train your pet with expert guidance." },
  { icon: <FontAwesomeIcon icon={faBowlFood} className="w-5 h-5" />, title: "Healthy Pet Meals", description: "Nutritious meals tailored for pets." },
  { icon: <FaMapMarkerAlt />, title: "Find Nearby Services", description: "Find nearby vets and pet stores." },
];

const ServiceCard = ({ icon, title, description, link }) => {
  return (
    <div className="relative">
      <motion.div
        className="relative bg-white p-6 rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-transform group"
        whileHover={{ y: -10 }}
        style={{
          maskImage: "radial-gradient(circle at bottom right, transparent 46px, white 26px)",
          WebkitMaskImage: "radial-gradient(circle at bottom right, transparent 46px, white 26px)",
        }}
      >
        <div className="flex items-center gap-3 font-laila">
          <div className="bg-[#E59560] text-white p-2 rounded-full flex items-center justify-center text-2xl">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-[#325747]  whitespace-nowrap -ml-1">
            {title}
          </h3>
        </div>
        <div className="mt-2 border-t-2 border-gray-300 transition-all duration-300 group-hover:border-[#BACEC1]"></div>
        <p className="mt-2 text-gray-600 font-laila">{description}</p>
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-[#F6F4E8] rounded-tl-full"></div>
      </motion.div>

      <div className="absolute bottom-0 right-0 flex items-center text-[#5A382D] z-20">
        <Link to={link} className="flex items-center justify-center w-10 h-10 bg-[#BACEC1] rounded-full text-white shadow-lg" style={{ cursor: "pointer", transform: "rotate(-45deg)" }}>
          ➝
        </Link>
      </div>
    </div>
  );
};
const reviews = [
  {
    name: "Jumana Saif",
    review: "This platform has helped me find the perfect home for my dog. The community is so supportive!",
    rating: 5,
  },
  {
    name: "Ahmed Ali",
    review: "I love how easy it is to find local services for my pets. The app is so helpful!",
    rating: 4,
  },
  {
    name: "Malak",
    review: "Great resources and a fantastic community for pet lovers. Highly recommend!",
    rating: 5,
  },
  {
    name: "Ruba",
    review: "The adoption process was so smooth, and I found my new best friend. Thank you!",
    rating: 5,
  },
];
const posts = [
  {
    date: "May 06, 2024",
    title: "A Recipe For Dog Biscuits Suitable For The Holidays",
    image:  "../assets/blogg.jpg",
  },
  {
    date: "May 04, 2024",
    title: "Thinking Creatively: Pet Fears And Stereotypes",
    image: "/images/post2.jpg",
  },
  {
    date: "May 03, 2024",
    title: "Positives And Negatives Of Keeping A Dog As A Pet",
    image: "/images/post3.jpg",
  },
];
const PetOwnerReviewCard = ({ name, review, rating }) => {
  return (
    <div className="relative p-6 bg-white rounded-xl shadow-lg w-80 mx-4 ">
      <p className="text-lg text-gray-700" style={{marginTop:"15px"}}>{review}</p>
      <h3 className="mt-4 font-bold text-[#325747]">{name}</h3>
      <div className="absolute top-3 right-2 flex items-center text-[#E59560]">
        {[...Array(rating)].map((_, index) => (
          <FaStar key={index} className="text-yellow-500" />
        ))}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#325747] text-white py-6 mt-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">&copy; 2025 PetCuddles. All Rights Reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-orange-400">Privacy Policy</a>
          <a href="#" className="hover:text-orange-400">Terms of Service</a>
          <a href="#" className="hover:text-orange-400">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};
const HomePage = () => {

    const [openIndex, setOpenIndex] = useState(null);
  
    const features = [
      {
        title: "Share & Engage",
        description: "Connect with fellow pet lovers, share photos, and create fun interactions in the community."
      },
      {
        title: "Adopt or Rehome",
        description: "Give a pet a second chance by adopting or help find a new home for pets in need."
      },
      {
        title: "Live Q&A with Veterinarians",
        description: "Get live, real-time advice from trusted veterinarians to ensure the best care for your pets."
      },
      {
        title: "Stay Updated",
        description: "Stay informed with real-time notifications about lost pets, new adoption opportunities, and important news."
      }
    ];
  
    const toggleFeature = (index) => {
      setOpenIndex(openIndex === index ? null : index);
    };

  
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center relative overflow-hidden" style={{ backgroundColor: "#F6F4E8" }}>
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${Home})` }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <motion.div className="relative text-white text-center px-4" initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }}>
          <h1 className="text-5xl font-bold drop-shadow-lg">Caring for Your Pets, One Paw at a Time</h1>
          <p className="mt-4 text-lg">Your trusted companion in pet care, adoption, and community.</p>
        </motion.div>
      </section>

      {/* Services Section */}
      <div className="py-16 w-full">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </div>


{/* About Us Section */}

<section 
  className="relative w-full py-32 flex flex-col items-center justify-center text-center top-[240px]" 
  style={{ backgroundImage: `url(${AboutBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
>
  <div className="absolute inset-0 bg-[#5A382D] opacity-80"></div>

  <img src={PetsImage} alt="Pets on Wall" className="absolute top-[-265px] w-122 mx-auto" />

  <motion.div 
    className="relative z-10 max-w-4xl px-6 text-white h-[300px] font-laila"
    initial={{ opacity: 0, y: 50 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 1 }}
    style={{ fontFamily: "'Laila', sans-serif" }}
  >
    <h2 className="text-6xl font-bold" style={{ marginTop: '-35px' }}>About Us</h2>
    <p className="text-lg" style={{ marginTop: '7px' }}>
      Welcome to our pet-cuddles community! We are dedicated to providing top-quality pet care, training, and nutrition to ensure your furry friends live a happy and healthy life.
    </p>
    
    <div className="grid grid-cols-2 gap-4 mt-6 text-left" style={{ marginLeft: '95px' }}>
      {[
        "Pet Adoption",
        "Veterinary Services",
        "Educational library",
        "Pet Nutrition",
        "Pet Behavioral Analysis",
        "Emergency Alerts",
        "Daily Activity Reminders",
        "Supplies Services",
      ].map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <FaStar className="text-[#E59560] text-xl" />
          <span className="text-lg">{item}</span>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {[
              { number: "100+", text: "Happy Pets" },
              { number: "15+", text: "Professional Vets" },
              { number: "99%", text: "Positive Reviews" }
            ].map((item, index) => (
              <motion.div key={index} className="p-8 bg-[#F6F4E8] rounded-xl shadow-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 + index * 0.5 }}>
                <h3 className="text-5xl font-bold text-[#E59560]">{item.number}</h3>
                <p className="mt-2 text-lg text-gray-700">{item.text}</p>
              </motion.div>
            ))}
          </div>
    
  </motion.div>
</section>
{/* Community Section */}
<section className="py-20 flex flex-col min-h-screen w-full items-center justify-center relative overflow-hidden" style={{ marginTop: '300px' }}>
  <div className="max-w-6xl w-full flex flex-col md:flex-row items-center relative">
  <FontAwesomeIcon icon={faPaw}  className="  text-[#ffff]" style={{transform: 'rotate(-30deg)',width:'380px',height:'380px',position:'absolute',marginTop:'-210px',marginLeft:'-160px'}} /> 
    {/* Animated Dog Bone (Moving Diagonally in Opposite Direction) */}
    <motion.div 
      className="absolute bottom-1/4 left-1/3 text-[#e59560] text-8xl"
      animate={{ x: [0, -30, 0], y: [0, -30, 0], rotate: [-45, -45,- 45] }}  
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      <FaBone />
    </motion.div>

    {/* Image Section */}
    <div className="w-full md:w-1/2 flex justify-center">
      <img src={CommunityImage} alt="Pet Community" className="w-4/5 md:w-full rounded-xl " style={{ marginLeft: '-260px',zIndex:'1' }} />
    </div>

    {/* Text Content Section */}
    <div className="w-full md:w-1/2 relative h-[300px] flex items-center">
      <div className="text-left">
      <h2 className="text-3xl md:text-4xl font-laila font-bold text-[#325747]" style={{ marginTop: '-50px' }}>
         <motion.div
           animate={{
             opacity: [0.8, 1, 0.8], // Gradually fades in and out
              textShadow: [
              "0px 0px 5px rgba(255, 255, 255, 0.3)", // Subtle glow effect
              "0px 0px 10px rgba(255, 255, 255, 0.6)", // Stronger glow
              "0px 0px 5px rgba(255, 255, 255, 0.34)", // Subtle glow again
              ],
           }}
           transition={{
            duration: 2, // Time for one full pulse
            repeat: Infinity, // Repeats forever
            ease: "easeInOut", // Smooth easing for the glowing effect
           }}
         >
        Join Our Pet Community & Help Pets Find a Home!
        </motion.div>
    </h2>

        <p className="mt-4 text-gray-600 font-laila">
          A place for pet lovers to connect, share, and make a difference! Whether you want to 
          share adorable moments with your pet, connect with fellow pet lovers, or help a furry 
          friend find a loving home, our platform has everything you need.
        </p>
        <div className="space-y-4 w-full">
      {features.map((feature, index) => (
        <div key={index} className="w-full">
          <button
            onClick={() => toggleFeature(index)}
            className="w-full flex justify-between items-center bg-[#BACEC1] text-white text-lg font-bold font-laila px-6 py-4 rounded-3xl shadow-md " 
          >
            {feature.title}
            {openIndex === index ? <FaMinus /> : <FaPlus />}
          </button>
          {openIndex === index && (
            <p className="mt-2 text-gray-700 ">
              {feature.description}
            </p>
          )}
        </div>
      ))}
    </div>
        <div className="mt-6">
      
          <a href="#" class="inline-flex items-center font-medium text-[#e59560] hover:underline">Join Our Community
            <svg class="w-4 h-4 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
           </svg>
         </a>
          <a href="#" class="inline-flex items-center font-medium text-[#e59560] hover:underline ml-6">Find a Pet to Adopt
            <svg class="w-4 h-4 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
           </svg>
         </a>
        </div>
      </div>
    </div>
  </div>
</section>
 {/* Pet Owner Reviews Section */}
      <section className="py-20 w-full flex flex-col items-center justify-center relative"   style={{ backgroundImage: `url(${AboutBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-[#e59560] opacity-80"></div>
        <h2 className="text-5xl  font-laila font-bold text-[#325747] mb-8" style={{zIndex:'1'}}>What Pet Owners Are Saying</h2>
        <motion.div
          className="flex overflow-x-auto space-x-6"
          animate={{ x: [0, -200, 0] }} 
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "linear",
          }}
        >
          {reviews.map((review, index) => (
            <PetOwnerReviewCard key={index} {...review} />
          ))}
        </motion.div>
      </section>
      <section className="bg-beige p-10" style={{marginTop:'25px'}}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-6xl  font-laila font-bold text-[#325747]">
            Latest posts & articles
          </h2>
        </div>

        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-10 flex flex-col  " style={{marginTop:'70px', marginLeft:'-80px'}}>
            {posts.map((post, index) => (
              <div key={index} className="flex items-center space-x-7 pb-4 border-b border-gray-300 last:border-b-0">
                <img
                  src={BlogImg1}
                  alt={post.title}
                  className=" rounded-full object-cover" style={{width:'115px',height:'115px'}}
                />
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-4 pb-3">
                    <FaCalendarAlt className="text-[#e59560]" /> {post.date}
                    <FaUserAlt className="text-[#e59560] ml-2" /> BY ADMIN
                  </p>
                  <a href="/"><h3 className="text-lg font-semibold text-[#325747] font-laila text-xl">
                    {post.title}
                  </h3></a>
                </div>
              </div>
            
            ))}
            
          </div>
           
          <div className="md:col-span-2 relative bg-white ml-20 rounded-[35px] shadow-lg flex items-center " style={{marginTop:'20px'}}>
            <img
              src={BlogImg}
              alt="Featured post"
              className="w-1/2 rounded-xl object-cover"
            />
            <div className="p-6 ">
              <p className="text-sm text-gray-500 flex items-center gap-4">
                <FaCalendarAlt className="text-[#e59560]" /> May 06, 2024
                <FaUserAlt className="text-[#e59560] ml-2" /> BY ADMIN
              </p>
              <h2 className="text-4xl font-bold text-[#325747] font-laila mt-4 ">
                Possessing A Dog Has Mental Health Benefits
              </h2>
              <p className="text-gray-600 mt-6">
                My Pet Care Is The Basis Of Responsible Pet Ownership. It Is
                Important When...
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
        {/* Digital Pet ID Section */}
        <section className="w-full  bg-cover bg-center flex items-center" style={{ backgroundImage: `url(${QrImage})`, backgroundSize: "cover", backgroundPosition: "center",height:"250px",marginTop:"20px" }}>

        <div className="max-w-6xl mx-auto flex items-left space-x-6 px-6">
          <img
            src={qr}
            alt="QR Code"
            className=" rounded-full border-4 border-white shadow-lg" style={{width:"180px", height:"180px" ,marginLeft:"-500px"}}
          />
          <div className="text-white">
            <h3 className="text-3xl font-bold font-laila pb-5">Create Digital Pet ID</h3>
            <p className="text-sm max-w-lg font-laila">
              Generate a digital pet ID containing the pet’s name, breed, birth date, owner’s contact information, and medical records. Easily scan the QR code to access the details instantly if the pet is lost.
            </p>
            <button className="mt-2 px-4 py-2 bg-[#e59560] text-white rounded-lg shadow font-laila">
              Create Now
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
    
  );
};

export default HomePage;

