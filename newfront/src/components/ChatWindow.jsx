import React, { useState, useEffect, useRef } from 'react';
import { useChat } from './ChatProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSmile, faUser, faStore, faHospital, faComment,faUserShield, faUserMd } from '@fortawesome/free-solid-svg-icons';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { useWebSocket } from './WebSocketContext';

const ChatWindow = () => {
  const { activeChat, sendMessage, handleTyping } = useChat();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isParticipantOnline, setIsParticipantOnline] = useState(false);
  const { ws } = useWebSocket();


   useEffect(() => {
    if (ws && activeChat) {
      // Check if participant is online when chat is opened
      const checkOnlineStatus = () => {
        ws.send(JSON.stringify({
          type: 'check-online',
          userId: activeChat.participant._id
        }));
      };
      
      checkOnlineStatus();
      
      // Listen for online status updates
      const handleMessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'online-status' && data.userId === activeChat.participant._id) {
          setIsParticipantOnline(data.isOnline);
        }
      };
      
      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [ws, activeChat]);

  useEffect(() => {
  const messagesEnd = document.getElementById('messages-end');
  if (messagesEnd) messagesEnd.scrollIntoView({ behavior: 'smooth' });
}, [activeChat?.messages]);

  const handleSendMessage = () => {
    if (message.trim() && activeChat) {
      sendMessage(activeChat._id, message);
      setMessage('');
      setShowEmojiPicker(false);
    }
  };
  

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

 useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [activeChat?.messages]);


  if (!activeChat) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F6F4E8] rounded-lg">
        <div className="text-center p-6">
          <div className="text-[#E59560] text-5xl mb-4">
            <FontAwesomeIcon icon={faComment} />
          </div>
          <h3 className="text-xl font-semibold text-[#325747] mb-2">Select a chat to start messaging</h3>
          <p className="text-gray-600">Or start a new conversation</p>
        </div>
      </div>
    );
  }

if (!activeChat || !Array.isArray(activeChat.participants)) {
  return <div>No chat data</div>;
}

const currentUser = JSON.parse(localStorage.getItem('user')) || 
                   JSON.parse(localStorage.getItem('clinic')) || 
                   JSON.parse(localStorage.getItem('shop')) || 
                   JSON.parse(localStorage.getItem('doctor')) ||
                   JSON.parse(localStorage.getItem('admin'));
                     
  const CurrentModel = currentUser?.role === 'pet_owner' ? 'User' : 
                       currentUser?.role === 'clinic' ? 'Clinic' :
                       currentUser?.role === 'doctor' ? 'Doctor' : 
                       currentUser?.role === 'admin' ? 'Admin' :'Shop' ;

  console.log(CurrentModel);
    // Find the other participant (not the current user)
const userId = currentUser._id || currentUser.id;

const otherParticipant = activeChat.participants.find(p => {
  if (!p.id._id || !userId) return false;
  return p.id._id.toString() !== userId.toString();
});


console.log('participants:', activeChat.participants);
console.log('currentUser:', currentUser);
console.log('currentUser._id:', currentUser?.id);


console.log("otherParticipant:", otherParticipant);

const participantName = otherParticipant?.id?.clinicName || 
                        otherParticipant?.id?.shopName ||
                        otherParticipant?.id?.name || 
                        otherParticipant?.id?.fullName || 
                        'Unknown User';

  const participantModel = otherParticipant?.model;
  const participantImage = otherParticipant?.id?.profileImage;

  // Determine the appropriate icon
  const getParticipantIcon = (model) => {
    switch(model) {
      case 'Clinic': return faHospital;
      case 'Doctor': return faUserMd;
      case 'Shop': return faStore;
      case 'Admin': return faUserShield;
      default: return faUser;
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#F6F4E8] rounded-lg overflow-hidden w-full">
     {/* Chat header */}
      <div className="p-3 bg-[#325747] text-white flex items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center text-white mr-3">
            {participantImage ? (
              <img 
  src={participantImage.startsWith('data:') ? participantImage : `http://localhost:5000${participantImage}`} 
  alt="Profile" 
  className="w-full h-full rounded-full object-cover"
/>

            ) : (
              <FontAwesomeIcon icon={getParticipantIcon(participantModel)} />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{participantName}</h3>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1 ${isParticipantOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
              <span className="text-xs">{isParticipantOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeChat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
// In ChatWindow.js
activeChat.messages.map((msg, index) => {
  // Get the current user's ID from localStorage
  const currentModel = CurrentModel;
  
  // Check if the message sender is the current user
  const isCurrentUser = msg.senderModel === currentModel;
  
  return (
    <div 
      key={index}
      className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isCurrentUser ? 
          'bg-[#E59560] text-white' : 'bg-white text-[#325747]'}`}
      >
        <p>{msg.content}</p>
        <p className="text-xs mt-1 text-right opacity-70">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
})
        )}
        <div id="messages-end" ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 border-t border-[#BACEC1] bg-white relative">
        {showEmojiPicker && (
          <div className="absolute bottom-14 left-0 z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={350} />
          </div>
        )}
        <div className="flex items-center">
          <button 
            className="p-2 text-[#E59560] hover:text-[#325747]"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FontAwesomeIcon icon={faSmile} />
          </button>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 p-2 border border-[#BACEC1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E59560]"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowEmojiPicker(false)}
          />
          <button 
            className="ml-2 p-2 bg-[#E59560] text-white rounded-lg hover:bg-[#d18b56]"
            onClick={handleSendMessage}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;

