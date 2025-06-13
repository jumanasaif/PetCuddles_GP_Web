import React from 'react';
import ChatContainer from './ChatContainer';
import { useChat } from './ChatProvider';

const ChatPage = () => {
  const { fetchChats } = useChat();

  React.useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="container mx-auto p-4 font-laila bg-[#F6F4E8]">
      <ChatContainer />
    </div>
  );
};

export default ChatPage;
