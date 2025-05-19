import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header/Header';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './utils/auth/contexts/AuthProvider';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 재요청 비활성화
      retry: 1, // 실패 시 1번만 재시도
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
      </QueryClientProvider>
  );
}

export default App;