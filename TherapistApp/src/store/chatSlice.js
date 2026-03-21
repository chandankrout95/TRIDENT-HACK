import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/apiClient';

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/chat/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching chat');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (senderId, { rejectWithValue }) => {
    try {
      await apiClient.patch('/chat/read', { senderId });
      return senderId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error marking read');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    activeChatUser: null,
    isTyping: false,
    isLoading: false,
  },
  reducers: {
    setActiveChatUser: (state, action) => {
      state.activeChatUser = action.payload;
    },
    receiveMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setTypingStatus: (state, action) => {
      state.isTyping = action.payload;
    },
    addOptimisticMessage: (state, action) => {
      state.messages.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchChatHistory.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.messages.forEach(msg => {
          if (msg.sender === action.payload) {
            msg.isRead = true;
          }
        });
      });
  },
});

export const { setActiveChatUser, receiveMessage, setTypingStatus, addOptimisticMessage } = chatSlice.actions;
export default chatSlice.reducer;
