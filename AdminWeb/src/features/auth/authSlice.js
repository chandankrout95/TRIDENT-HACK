import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('adminToken');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: token || null,
    user: null,
  },
  reducers: {
    loginAdmin: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logoutAdmin: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('adminToken');
    }
  }
});

export const { loginAdmin, logoutAdmin } = authSlice.actions;
export default authSlice.reducer;
