import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  _id?: string;
  uid?: string;
  name: string;
  email: string;
  avatar?: string;
  pic?: string;
  token?: string;
  createdAt?: any;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setLoading, setUser, setError, logout } = userSlice.actions;
export default userSlice.reducer;
