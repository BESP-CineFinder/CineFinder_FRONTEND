import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "../pages/MainPage";
import TheaterSearchPage from "../pages/TheaterSearchPage";
import SignupPage from "../pages/SignupPage";
import TheaterSearchResultPage from "../pages/TheaterSearchResultPage";
import MovieDetailPage from "../pages/MovieDetailPage";
import MyPage from "../pages/MyPage";
import ChatRoom from '../components/Chat/ChatRoom';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/movie/:movieId" element={<MovieDetailPage />} />
      <Route path="/theater-search" element={<TheaterSearchPage />} />
      <Route path="/theater-search-result" element={<TheaterSearchResultPage />} />
      <Route path="/chat/:movieId" element={<ChatRoom />} />
    </Routes>
  );
};

export default AppRoutes;