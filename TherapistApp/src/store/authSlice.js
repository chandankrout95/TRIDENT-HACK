import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginTherapist = createAsyncThunk(
  'auth/loginTherapist',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data.token) {
        await AsyncStorage.setItem('therapistToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    therapist: null,
    token: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.therapist = action.payload.therapist;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.therapist = null;
      state.token = null;
      AsyncStorage.removeItem('therapistToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginTherapist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginTherapist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.therapist = action.payload; 
        state.token = action.payload.token;
      })
      .addCase(loginTherapist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
