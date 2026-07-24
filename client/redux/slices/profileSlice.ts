import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ProfileUser {
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
}

interface ProfileState {
  user: ProfileUser | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  successMessage: string | null;
}

// ─── Initial State ──────────────────────────────────────────────────────────────

const initialState: ProfileState = {
  user: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  successMessage: null,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────────

export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/user/profile");
      return res.data.data?.user || res.data.data || res.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to load profile.";
      return rejectWithValue(message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (
    payload: { phone?: string; role?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.patch("/user/edit-profile", payload);
      return { user: res.data.data?.user || res.data.data || res.data, message: res.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update profile.";
      return rejectWithValue(message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────────────────────

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    clearProfileSuccess: (state) => {
      state.successMessage = null;
    },
    resetProfile: () => initialState,
  },
  extraReducers: (builder) => {
    // ── Fetch Profile ───────────────────────────────────────────────────────────
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Update Profile ──────────────────────────────────────────────────────────
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.user = action.payload.user;
        state.successMessage = action.payload.message || "Profile updated successfully!";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfileError, clearProfileSuccess, resetProfile } =
  profileSlice.actions;
export default profileSlice.reducer;
