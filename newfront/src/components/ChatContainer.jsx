import React from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatContainer = () => {
  return (
    
    <div className="flex h-[calc(100vh-120px)] bg-[#F6F4E8] rounded-lg shadow-lg overflow-hidden" style={{marginTop:"80px"}}>
      <div className="w-full md:w-1/3 border-r border-[#BACEC1]">
        <ChatList />
      </div>
      <div className="hidden md:flex md:w-2/3">
        <ChatWindow />
      </div>
   </div>
  );
};

export default ChatContainer;
