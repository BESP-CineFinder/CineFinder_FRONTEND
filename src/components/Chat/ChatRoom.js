import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import styled from 'styled-components';
import { AuthContext } from '../../utils/auth/contexts/AuthProvider';
import Toast from '../common/Toast';
import { getChatHistory } from '../../api/api';

const ChatContainer = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: #1a1a1a;
  margin-top: 64px;
  overflow: hidden;
  z-index: 0;
  font-family: 'Pretendard', sans-serif;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    width: 80px;
    z-index: 2;
    pointer-events: none;
  }
  &::before {
    left: 0;
    background: linear-gradient(to right, #1a1a1a 80%, transparent 100%);
  }
  &::after {
    right: 0;
    background: linear-gradient(to left, #1a1a1a 80%, transparent 100%);
  }
`;

const ChatContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  position: relative;
  z-index: 1;
`;

const ChatSidebar = styled.div`
  width: 240px;
  background: #212121;
  padding: 20px;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ChatMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-right: 1px solid #333;
`;

const MovieInfoSidebar = styled.div`
  width: 300px;
  background: #212121;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MoviePoster = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const MovieInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MovieTitle = styled.h2`
  color: #fff;
  font-size: 1.4rem;
  margin: 0;
`;

const MovieDescription = styled.div`
  color: #888;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-y: auto;
  max-height: 80px;
  padding-right: 10px;
  
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

const MovieDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #aaa;
  font-size: 0.9rem;
`;

const DetailItem = styled.div`
  display: flex;
  text-align: left;
  gap: 8px;
  
  &::before {
    content: '•';
    color: #ff4081;
  }
`;

const ParticipantsList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  padding-right: 10px;
  
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

const ParticipantsTitle = styled.h3`
  color: #fff;
  font-size: 1.1rem;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  background: #212121;
  z-index: 1;
  padding-top: 10px;
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  color: #fff;
  font-size: 0.9rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &::before {
    content: '•';
    color: #ff4081;
    margin-right: 8px;
    font-size: 1.2rem;
  }
`;

const ParticipantsCount = styled.div`
  color: #888;
  font-size: 0.8rem;
  margin-top: 5px;
  text-align: right;
`;

const LeaveButton = styled.button`
  padding: 12px;
  background: #ff4081;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f50057;
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;
  margin-bottom: 5px;
  max-height: 72vh;
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

const SystemMessage = styled.div`
  text-align: center;
  color: #888;
  font-size: 0.8rem;
  margin: 10px 0;
  padding: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-style: italic;
  font-family: 'Pretendard', sans-serif;
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
  font-family: 'Pretendard', sans-serif;
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 8px;
  background: ${props => props.isMine ? '#ff4081' : '#3a3a3a'};
  color: white;
  width: fit-content;
  max-width: 100%;
  word-break: break-word;
  text-align: ${props => props.isMine ? 'flex-end' : 'flex-start'};
  font-family: 'Pretendard', sans-serif;
`;

const ChatRoom = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const movieInfo = location.state?.movieData;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: '' });
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const { user } = useContext(AuthContext);
  const oldestTimestampRef = useRef(null);

  // 중복 요청 방지용 debounce
  let lastHistoryRequest = 0;
  const DEBOUNCE_MS = 700;

  const showToast = (message) => {
    setToast({ show: true, message });
  };

  const hideToast = () => {
    setToast({ show: false, message: '' });
  };

  const handleLeave = () => {
    if (stompClient) {
      stompClient.deactivate();
    }
    navigate(-1);
  };

  const loadChatHistory = async (cursorCreatedAt = null) => {
    if (!movieId || isLoadingHistory || !hasMoreHistory) return;

    setIsLoadingHistory(true);
    try {
      const prevScrollHeight = chatMessagesRef.current ? chatMessagesRef.current.scrollHeight : 0;
      const history = await getChatHistory(movieId, cursorCreatedAt);
      
      if (history.length === 0) {
        setHasMoreHistory(false);
        return;
      }

      setMessages(prev => {
        const newMessages = [...history, ...prev];
        if (newMessages.length > 0) {
          oldestTimestampRef.current = newMessages[0].timestamp;
        }
        return newMessages;
      });

      if (chatMessagesRef.current && cursorCreatedAt) {
        setTimeout(() => {
          const newScrollHeight = chatMessagesRef.current.scrollHeight;
          chatMessagesRef.current.scrollTop = newScrollHeight - prevScrollHeight;
        }, 0);
      }
    } catch (error) {
      console.error('채팅 히스토리 로드 실패:', error);
      showToast('채팅 기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleScroll = () => {
    if (!chatMessagesRef.current) return;
    const { scrollTop } = chatMessagesRef.current;
    const now = Date.now();
    if (
      scrollTop === 0 &&
      hasMoreHistory &&
      !isLoadingHistory &&
      now - lastHistoryRequest > DEBOUNCE_MS
    ) {
      lastHistoryRequest = now;
      if (oldestTimestampRef.current) {
        loadChatHistory(oldestTimestampRef.current);
      }
    }
  };

  // 모바일 Pull to Refresh (맨 위에서 아래로 드래그 시)
  let startY = null;
  let pulling = false;

  const handleTouchStart = (e) => {
    if (chatMessagesRef.current && chatMessagesRef.current.scrollTop === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  };
  const handleTouchMove = (e) => {
    if (!pulling || startY === null) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 40 && hasMoreHistory && !isLoadingHistory) {
      pulling = false; // 한 번만
      if (oldestTimestampRef.current) {
        loadChatHistory(oldestTimestampRef.current);
      }
    }
  };
  const handleTouchEnd = () => {
    startY = null;
    pulling = false;
  };

  useEffect(() => {
    const ref = chatMessagesRef.current;
    if (!ref) return;
    ref.addEventListener('touchstart', handleTouchStart);
    ref.addEventListener('touchmove', handleTouchMove);
    ref.addEventListener('touchend', handleTouchEnd);
    return () => {
      ref.removeEventListener('touchstart', handleTouchStart);
      ref.removeEventListener('touchmove', handleTouchMove);
      ref.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hasMoreHistory, isLoadingHistory]);

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

    const socket = new SockJS(process.env.REACT_APP_WEBSOCKET_URL || 'https://localhost/CineFinder-ws');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        setIsConnected(true);

        client.subscribe(`/topic/chat-${movieId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          if (newMessage.type === 'SYSTEM' || newMessage.type === 'CHAT') {
            setMessages(prev => [...prev, newMessage]);
          } else if (Array.isArray(newMessage)) {
            setParticipants(new Set(newMessage));
          }
        });

        const joinMessage = {
          type: 'JOIN',
          movieId,
          senderId: user.payload.userId,
          nickName: user.payload.nickname,
          timestamp: new Date().toISOString()
        };
        client.publish({
          destination: `/app/chat-${movieId}/join`,
          body: JSON.stringify(joinMessage)
        });
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => {
        setIsConnected(false);
        handleLeave();
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [movieId, user]);

  useEffect(() => {
    if (movieId && user) {
      setMessages([]);
      loadChatHistory();
    }
  }, [movieId, user]);

  // 메시지가 변경될 때마다 가장 오래된 메시지의 timestamp 업데이트
  useEffect(() => {
    if (messages.length > 0) {
      oldestTimestampRef.current = messages[0].timestamp;
    }
  }, [messages]);

  // 내가 보낸 메시지일 때만 스크롤 다운
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (String(lastMsg.senderId) === String(user?.payload?.userId)) {
      scrollToBottom();
    }
  }, [messages, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !stompClient || !isConnected || !user || !movieId) {
      return;
    }

    const chatMessage = {
      type: 'CHAT',
      movieId,
      senderId: user.payload.userId,
      nickName: user.payload.nickname,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      stompClient.publish({
        destination: `/app/chat-${movieId}`,
        body: JSON.stringify(chatMessage)
      });
      setMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
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
      <ChatContent>
        <ChatSidebar>
          <ParticipantsList>
            <ParticipantsTitle>
              참여자 목록
              <ParticipantsCount>
                {participants.size}명 참여 중
              </ParticipantsCount>
            </ParticipantsTitle>
            {Array.from(participants).map((nickname, index) => (
              <ParticipantItem key={index}>{nickname}</ParticipantItem>
            ))}
          </ParticipantsList>
          <LeaveButton onClick={handleLeave}>채팅방 나가기</LeaveButton>
        </ChatSidebar>
        
        <ChatMain>
          {isLoading ? (
            <div>메시지 로딩 중...</div>
          ) : (
            <>
              <ChatMessages 
                ref={chatMessagesRef}
                onScroll={handleScroll}
              >
                {isLoadingHistory && (
                  <SystemMessage>
                    이전 메시지를 불러오는 중...
                  </SystemMessage>
                )}
                {messages.map((msg, index) => {
                  if (msg.type === 'SYSTEM') {
                    return (
                      <SystemMessage key={index}>
                        {msg.message}
                      </SystemMessage>
                    );
                  }
                  
                  const isMine = String(msg.senderId) === String(user?.payload?.userId);
                  return (
                    <MessageContainer key={index} isMine={isMine}>
                      <SenderName isMine={isMine}>
                        {msg.nickName}
                      </SenderName>
                      <Message isMine={isMine}>
                        {msg.filteredMessage}
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
                  placeholder={isConnected ? "메시지를 입력하세요..." : "연결 중..."}
                  disabled={!isConnected}
                />
                <SendButton 
                  onClick={handleSendMessage}
                  disabled={!isConnected}
                  style={{ opacity: isConnected ? 1 : 0.5 }}
                >
                  전송
                </SendButton>
              </MessageInput>
            </>
          )}
        </ChatMain>

        <MovieInfoSidebar>
          <MoviePoster 
            src={movieInfo?.posterUrl || 'https://via.placeholder.com/300x450'} 
            alt={movieInfo?.movieNm || '영화 포스터'}
          />
          <MovieInfo>
            <MovieTitle>{movieInfo?.movieNm || '영화 제목'}</MovieTitle>
            <MovieDescription>
              {movieInfo?.plotText || '영화 설명이 없습니다.'}
            </MovieDescription>
            <MovieDetails>
              <DetailItem>개봉일: {movieInfo?.releaseDate || '정보 없음'}</DetailItem>
              <DetailItem>장르: {movieInfo?.genre || '정보 없음'}</DetailItem>
              <DetailItem>감독: {movieInfo?.directors || '정보 없음'}</DetailItem>
              <DetailItem>배우: {movieInfo?.actors || '정보 없음'}</DetailItem>
            </MovieDetails>
          </MovieInfo>
        </MovieInfoSidebar>
      </ChatContent>
      <Toast 
        message={toast.message}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </ChatContainer>
  );
};

export default ChatRoom;