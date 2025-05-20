import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import styled from 'styled-components';
import { AuthContext } from '../../utils/auth/contexts/AuthProvider';
import axios from 'axios';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #1a1a1a;
  margin-top: 64px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  &::-webkit-scrollbar-thumb {
    background: #3a3a3a;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #4a4a4a;
  }
`;

const MessageInput = styled.div`
  display: flex;
  gap: 10px;
  height: 60px;
  background: #1a1a1a;
  padding: 10px 0;
  position: sticky;
  bottom: 0;
  z-index: 1;
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

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  align-self: ${props => props.isMine ? 'flex-end' : 'flex-start'};
  max-width: 70%;
  width: fit-content;
`;

const SenderName = styled.span`
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 4px;
  align-self: ${props => props.isMine ? 'flex-end' : 'flex-start'};
  width: 100%;
  text-align: ${props => props.isMine ? 'right' : 'left'};
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 8px;
  background: ${props => props.isMine ? '#ff4081' : '#3a3a3a'};
  color: white;
  width: fit-content;
  max-width: 100%;
  word-break: break-word;
`;

const ChatRoom = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);

  const loadPreviousMessages = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/chat/${movieId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('이전 메시지 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }

    if (!movieId || movieId === 'undefined') {
      alert('잘못된 접근입니다.');
      navigate('/');
      return;
    }

    loadPreviousMessages();

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
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [movieId, user, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !stompClient || !user || !movieId) {
      return;
    }

    const chatMessage = {
      movieId,
      senderId: user.payload.userId,
      nickName: user.payload.nickname,
      message: message.trim(),
    };

    stompClient.publish({
      destination: `/app/chat-${movieId}`,
      body: JSON.stringify(chatMessage)
    });

    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer>
      {isLoading ? (
        <div>메시지 로딩 중...</div>
      ) : (
        <>
          <ChatMessages>
            {messages.map((msg, index) => {
              const isMine = String(msg.senderId) === String(user?.payload?.userId);
              return (
                <MessageContainer key={index} isMine={isMine}>
                  <SenderName isMine={isMine}>
                    {msg.nickName}
                  </SenderName>
                  <Message isMine={isMine}>
                    {msg.message}
                  </Message>
                </MessageContainer>
              );
            })}
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
        </>
      )}
    </ChatContainer>
  );
};

export default ChatRoom;