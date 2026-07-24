import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";
import { fetchProfile } from "./profileSlice";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id: string | null;
  email: string | null;
  role: string | null;
  name: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tempEmail: string | null;
  isLoading: boolean;
  error: string | null;
  isCheckingAuth: boolean;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

interface ResendOtpPayload {
  email: string;
}

// Helper to persist tokens
const persistTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "auth_tokens",
      JSON.stringify({ accessToken, refreshToken })
    );
  }
};

const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_tokens");
  }
};

// ─── Initial State ──────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  tempEmail: null,
  isLoading: false,
  error: null,
  isCheckingAuth: true,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────────

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (payload: SignupPayload, { rejectWithValue }) => {
    try {
      const res = await api.post("/user/signup", payload);
      return { email: payload.email, message: res.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Signup failed. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await api.post("/user/login", payload);
      const { accessToken, refreshToken } = res.data.data;
      persistTokens(accessToken, refreshToken);
      return { accessToken, refreshToken, message: res.data.message };
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      return rejectWithValue({ message, status, email: payload.email });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      const res = await api.post("/user/verify-otp", payload);
      return { message: res.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "OTP verification failed.";
      return rejectWithValue(message);
    }
  }
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (payload: ResendOtpPayload, { rejectWithValue }) => {
    try {
      const res = await api.post("/user/resend-otp", payload);
      return { message: res.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to resend OTP.";
      return rejectWithValue(message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      persistTokens(action.payload.accessToken, action.payload.refreshToken);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setTempEmail: (state, action: PayloadAction<string>) => {
      state.tempEmail = action.payload;
    },
    setCheckingAuth: (state, action: PayloadAction<boolean>) => {
      state.isCheckingAuth = action.payload;
    },
    setAuthFromStorage: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isCheckingAuth = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tempEmail = null;
      state.error = null;
      state.isCheckingAuth = false;
      clearTokens();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Signup
    builder
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tempEmail = action.payload.email;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isCheckingAuth = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as { message: string; status?: number; email?: string };
        state.error = payload.message;
        // If 403 (unverified), store email for OTP redirect
        if (payload.status === 403 && payload.email) {
          state.tempEmail = payload.email;
        }
      });

    // Verify OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resend OTP
    builder
      .addCase(resendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Sync auth user from profile fetch
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        const profile = action.payload;
        state.user = {
          id: profile._id || profile.id || null,
          email: profile.email || null,
          role: profile.role || null,
          name: profile.name || null,
        };
      });
  },
});

export const { setCredentials, setUser, setTempEmail, setCheckingAuth, setAuthFromStorage, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
