"use client";

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import AuthProvider from "@/components/providers/AuthProvider";
import VerificationGuard from "@/components/providers/VerificationGuard";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <VerificationGuard>{children}</VerificationGuard>
      </AuthProvider>
    </Provider>
  );
}
