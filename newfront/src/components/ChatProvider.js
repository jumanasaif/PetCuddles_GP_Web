import React, { createContext, useContext, useState, useEffect ,useRef} from 'react';
import axios from 'axios';
import { useWebSocket } from './WebSocketContext';
import { toast } from "react-toastify";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
   const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const { ws } = useWebSocket();
 const [loadingUnreadCount, setLoadingUnreadCount] = useState(false);


  // Add this function to fetch unread count
 const fetchUnreadCount = async () => {
  setLoadingUnreadCount(true);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token available');
      return;
    }

    const response = await axios.get('http://localhost:5000/api/chat/unread-count', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    // Validate response structure
    if (response.data && typeof response.data.unreadCount === 'number') {
      setUnreadMessagesCount(response.data.unreadCount);
    } else {
      console.warn('Invalid response format for unread count:', response.data);
      setUnreadMessagesCount(0);
    }
  } catch (err) {
    console.error('Error fetching unread count:', err);
    setUnreadMessagesCount(0);
  } finally {
    setLoadingUnreadCount(false);
  }
 };

  useEffect(() => {
    fetchUnreadCount();
  }, []);


  const fetchChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

 const startChat = async (recipientId, recipientType) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post('http://localhost:5000/api/chat', {
      recipientId,
      recipientType
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Check if this chat already exists in our state
    const existingChatIndex = chats.findIndex(c => c._id === response.data._id);
    
    if (existingChatIndex === -1) {
      // If new chat, add to beginning of list
      setChats(prev => [response.data, ...prev]);
    } else {
      // If existing chat, update it in place
      setChats(prev => {
        const updated = [...prev];
        updated[existingChatIndex] = response.data;
        return updated;
      });
    }
    
    // Set this as the active chat
    setActiveChat(response.data);
    
    return response.data._id;
  } catch (err) {
    setError(err.message);
    return null;
  }
};
  const sendMessage = (chatId, content) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat-message',
        chatId,
        content
      }));
    }
  };

  
  useEffect(() => {
    if (ws) {
      const handleMessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new-message-notification') {
          // Show notification
          toast.info(`New message from ${data.participantName}: ${data.content}`, {
            onClick: () => {
          
              setActiveChat(chats.find(c => c._id === data.chatId));
            }
          });
          
          // Increment unread count
          setUnreadMessagesCount(prev => prev + 1);
        }
       if (data.type === 'new-message') {
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === data.chatId) {
              // Check if message already exists
              const messageExists = chat.messages.some(
                msg => msg._id === data.message._id || 
                      (msg.senderId._id === data.message.senderId._id && 
                       msg.content === data.message.content)
              );
              
              if (!messageExists) {
                return {
                  ...chat,
                  messages: [...chat.messages, data.message],
                  lastMessageAt: new Date()
                };
              }
            }
            return chat;
          });
        });

        // Update active chat if it's the current one
        if (activeChat && activeChat._id === data.chatId) {
          setActiveChat(prev => ({
            ...prev,
            messages: [...prev.messages, data.message],
            lastMessageAt: new Date()
          }));
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            const messagesEnd = document.getElementById('messages-end');
            if (messagesEnd) messagesEnd.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

   ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [ws, chats]);

  const handleTyping = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'typing',
      chatId: activeChat?._id,
      isTyping: true
    }));
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to send 'stopped typing' after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'typing',
        chatId: activeChat?._id,
        isTyping: false
      }));
    }, 3000);
  }
};


useEffect(() => {
  if (ws) {
    const handleTyping = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'typing' && data.chatId === activeChat?._id) {
        setIsTyping(data.isTyping);
      }
    };
    ws.addEventListener('message', handleTyping);
    return () => ws.removeEventListener('message', handleTyping);
  }
}, [ws, activeChat]);



 return (
    <ChatContext.Provider value={{
      chats,
      activeChat,
      setActiveChat,
      loading,
      error,
      unreadMessagesCount,
      fetchChats,
      startChat,
      sendMessage,
      handleTyping,
      fetchUnreadCount
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);