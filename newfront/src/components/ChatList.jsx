import React, { useState, useEffect } from 'react';
import { useChat } from './ChatProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faUser, faStore, faHospital, faUserMd } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from './WebSocketContext';

const ChatList = () => {
 const { chats, loading, error, setActiveChat, fetchChats } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { ws } = useWebSocket();
  const lowerSearch = searchTerm.toLowerCase();

const currentUser = JSON.parse(localStorage.getItem('user')) || 
                   JSON.parse(localStorage.getItem('clinic')) || 
                   JSON.parse(localStorage.getItem('shop')) || 
                   JSON.parse(localStorage.getItem('doctor')) || 
                   JSON.parse(localStorage.getItem('admin'));
                     
  const CurrentModel = currentUser?.role === 'pet_owner' ? 'User' : 
                       currentUser?.role === 'clinic' ? 'Clinic' : 
                       currentUser?.role === 'doctor' ? 'Doctor' :
                       currentUser?.role === 'admin' ? 'Admin' :'Shop' ;



  useEffect(() => {
    fetchChats();
  }, []);

   useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'user-connected') {
          setOnlineUsers(prev => [...prev, data.userId]);
        } else if (data.type === 'user-disconnected') {
          setOnlineUsers(prev => prev.filter(id => id !== data.userId));
        }
      };
    }
  }, [ws]);


  // Filter chats based on search (using other participant's name)
  const filteredChats = chats.filter(chat => {
    const userId = currentUser._id || currentUser.id;

    const other = chat.participants.find(p => {
     if (!p.id._id || !userId) return false;
     return p.id._id.toString() !== userId.toString();
   });

    return (
      (other?.id?.clinicName && other.id?.clinicName.toLowerCase().includes(lowerSearch)) ||
      (other?.id?.shopName && other.id?.shopName.toLowerCase().includes(lowerSearch))||
      (other?.id?.name && other.id?.name.toLowerCase().includes(lowerSearch)) ||
      (other?.id?.fullName && other.id?.fullName.toLowerCase().includes(lowerSearch)) 
   
    );
  });

  if (loading) return <div className="p-4 text-center">Loading chats...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="w-full h-full bg-[#F6F4E8] rounded-lg overflow-hidden">
      <div className="p-4 bg-[#325747] text-white">
        <h2 className="text-xl font-bold">Messages</h2>
        <div className="mt-2 relative">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full p-2 pl-8 rounded bg-[#F6F4E8] text-[#325747]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-2 top-3 text-[#325747]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-80px)]">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chats found</div>
        ) : (
          filteredChats.map(chat => {
           const userId = currentUser._id || currentUser.id;
           const other = chat.participants.find(p => {
            if (!p.id._id || !userId) return false;
              return p.id._id.toString() !== userId.toString();
           });
            const isOnline = onlineUsers.includes(other.id._id.toString());
            const icon = other?.model === 'Clinic' ? faHospital : other?.model === 'Shop' ? faStore : other?.model === 'Doctor' ? faUserMd : faUser;
            const name = other?.model === 'Clinic' ? other.id?.clinicName : other?.model === 'Shop' ? other.id?.shopName : other?.model === 'Doctor' ? other.id?.name : other.id?.fullName;

            return (
              <div
                key={chat._id}
                className={`p-3 border-b border-[#BACEC1] flex items-center cursor-pointer hover:bg-[#e8f0eb] ${chat.unreadCount > 0 ? 'bg-[#fff8f0]' : ''}`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#E59560] flex items-center justify-center text-white mr-3">
                    {other?.id?.profileImage ? (
                      <img 
  src={
    other?.id?.profileImage?.startsWith('data:') // base64 case
      ? other.id.profileImage
      : `http://localhost:5000${other.id.profileImage}` // multer case
  }
  alt="Profile" 
  className="w-full h-full rounded-full object-cover"
/>

                    ) : (
            <FontAwesomeIcon icon={icon} />
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#325747] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-[#325747]">{name}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {chat.messages.length > 0 
                      ? chat.messages[chat.messages.length - 1].content 
                      : 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
