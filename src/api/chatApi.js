import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost';

export const getUserNickname = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/user?userId=${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('사용자 닉네임 조회 실패:', error);
    throw error;
  }
}; 