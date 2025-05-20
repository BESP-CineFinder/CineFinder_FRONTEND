import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import styled from 'styled-components';
import { getUserNickname } from '../../api/chatApi';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const MessageInput = styled.div`
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: #3a3a3a;
  color: white;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #ff4081;
  }
`;

const SendButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #ff4081;
  color: white;
  cursor: pointer;
  
  &:hover {
    background: #f50057;
  }
`;

const Message = styled.div`
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 8px;
  background: ${props => props.isMine ? '#ff4081' : '#3a3a3a'};
  color: white;
  max-width: 70%;
  align-self: ${props => props.isMine ? 'flex-end' : 'flex-start'};
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const SenderName = styled.span`
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 4px;
`;

const ChatRoom = () => {
  const { movieId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [nickname, setNickname] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // 실제 구현시 인증된 사용자 ID를 가져와야 합니다
    const fetchNickname = async () => {
      try {
        const userInfo = await getUserNickname(userId);
        setNickname(userInfo.nickname);
      } catch (error) {
        console.error('닉네임 조회 실패:', error);
      }
    };
    fetchNickname();

    const socket = new SockJS(process.env.REACT_APP_WEBSOCKET_URL || 'https://localhost/CineFinder-ws');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log('Connected to WebSocket');
        client.subscribe(`/topic/chat-${movieId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages(prev => [...prev, newMessage]);
        });
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [movieId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() && stompClient) {
      const chatMessage = {
        movieId,
        senderId: localStorage.getItem('userId'),
        content: message,
        timestamp: new Date().toISOString()
      };

      stompClient.publish({
        destination: `/app/chat-${movieId}`,
        body: JSON.stringify(chatMessage)
      });

      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer>
      <ChatMessages>
        {messages.map((msg, index) => (
          <MessageContainer key={index}>
            <SenderName>{msg.senderId === localStorage.getItem('userId') ? nickname : msg.senderId}</SenderName>
            <Message isMine={msg.senderId === localStorage.getItem('userId')}>
              {msg.content}
            </Message>
          </MessageContainer>
        ))}
        <div ref={messagesEndRef} />
      </ChatMessages>
      <MessageInput>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
        />
        <SendButton onClick={handleSendMessage}>전송</SendButton>
      </MessageInput>
    </ChatContainer>
  );
};

export default ChatRoom; 