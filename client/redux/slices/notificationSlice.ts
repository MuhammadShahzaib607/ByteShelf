import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface Notification {
  _id: string;
  recipient: string;
  sender: string;
  title?: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsMeta {
  total: number;
  read: number;
  unread: number;
}

interface NotificationState {
  notifications: Notification[];
  total: number;
  read: number;
  unread: number;
  loading: boolean;
  error: string | null;
}

// ─── Initial State ──────────────────────────────────────────────────────────────

const initialState: NotificationState = {
  notifications: [],
  total: 0,
  read: 0,
  unread: 0,
  loading: false,
  error: null,
};

// ─── Async Thunks ───────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (options: { limit?: number; status?: "unread" } | undefined, { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {};
      if (options?.limit) params.limit = String(options.limit);
      if (options?.status) params.status = options.status;
      const res = await api.get("/notification/my-notifications", { params });
      const data = res.data.data;
      return {
        notifications: data.notifications || [],
        total: data.total || 0,
        read: data.read || 0,
        unread: data.unread || 0,
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to fetch notifications.";
      return rejectWithValue(message);
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationIds: string[], { rejectWithValue }) => {
    try {
      await api.patch("/notification/mark-read", { notificationIds });
      return notificationIds;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to mark notifications as read.";
      return rejectWithValue(message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markOneAsRead",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.patch(`/notification/${id}/read`);
      return id;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to mark notification as read.";
      return rejectWithValue(message);
    }
  }
);

export const readAllNotifications = createAsyncThunk(
  "notifications/readAll",
  async (_, { rejectWithValue }) => {
    try {
      await api.patch("/notification/read-all");
      return true;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to mark notifications as read.";
      return rejectWithValue(message);
    }
  }
);

export const deleteNotifications = createAsyncThunk(
  "notifications/deleteNotifications",
  async (notificationIds: string[], { rejectWithValue }) => {
    try {
      await api.delete("/notification/delete", {
        data: { notificationIds },
      });
      return notificationIds;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to delete notifications.";
      return rejectWithValue(message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    clearNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    // ── Fetch Notifications ──────────────────────────────────────────────────────
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.total = action.payload.total;
        state.read = action.payload.read;
        state.unread = action.payload.unread;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Mark Single as Read ──────────────────────────────────────────────────────
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        state.notifications = state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );
        state.unread = Math.max(0, state.unread - 1);
        state.read = Math.min(state.total, state.read + 1);
      });

    // ── Mark as Read ─────────────────────────────────────────────────────────────
    builder
      .addCase(markNotificationsAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        const ids = action.payload;
        state.notifications = state.notifications.map((n) =>
          ids.includes(n._id) ? { ...n, isRead: true } : n
        );
        state.unread = Math.max(0, state.unread - ids.length);
        state.read = Math.min(state.total, state.read + ids.length);
      })
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // ── Read All ─────────────────────────────────────────────────────────────────
    builder
      .addCase(readAllNotifications.pending, (state) => {
        state.error = null;
      })
      .addCase(readAllNotifications.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        state.unread = 0;
        state.read = state.total;
      })
      .addCase(readAllNotifications.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // ── Delete Notifications ─────────────────────────────────────────────────────
    builder
      .addCase(deleteNotifications.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteNotifications.fulfilled, (state, action) => {
        const ids = action.payload;
        const deletedCount = ids.length;
        state.notifications = state.notifications.filter(
          (n) => !ids.includes(n._id)
        );
        // Recalculate counts from remaining notifications
        const remainingUnread = state.notifications.filter((n) => !n.isRead).length;
        state.total = Math.max(0, state.total - deletedCount);
        state.read = Math.max(0, state.total - remainingUnread);
        state.unread = remainingUnread;
      })
      .addCase(deleteNotifications.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearNotificationError, clearNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
