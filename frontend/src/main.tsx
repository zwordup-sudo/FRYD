import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";

import HomePage from "./pages/Home";
import MainLayout from "./layouts/MainLayout";
import TaskPage from "./pages/Task";
import HabitPage from "./pages/Habit";
import DiaryPage from "./pages/Diary";
import AssistantPage from "./pages/Assistant";
import AnalyticsPage from "./pages/Analytics";
import UserPage from "./pages/User";
import ProjectsPage from "./pages/Projects";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { setupOfflineSync } from "./services/offlineSync";

import "./index.css";

// Setup offline interceptors
setupOfflineSync();

const router = createHashRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "task", element: <TaskPage /> },
          { path: "habit", element: <HabitPage /> },
          { path: "diary", element: <DiaryPage /> },
          { path: "assistant", element: <AssistantPage /> },
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "user", element: <UserPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute requireAdmin={true} />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { path: "admin", element: <AdminPanel /> },
        ],
      },
    ],
  },
]);

import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1054531438689-snb44rge9qjgckdaqooil4h67kbklcbf.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        reg.update().catch(() => {});
        console.log("Service Worker registrado con éxito:", reg.scope);
      })
      .catch((err) => console.error("Error al registrar Service Worker:", err));
  });
}
