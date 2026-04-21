import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { Workspace } from "./Workspace";

function hasToken() {
  return Boolean(localStorage.getItem("token"));
}

function Protected({ children }: { children: React.ReactNode }) {
  if (!hasToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Workspace />
          </Protected>
        }
      />
    </Routes>
  );
}

