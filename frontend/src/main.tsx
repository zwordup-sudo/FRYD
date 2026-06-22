import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { setupOfflineSync } from "./services/offlineSync";

import "./index.css";

// Setup offline interceptors
setupOfflineSync();

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
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
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("Service Worker registrado con éxito:", reg.scope))
      .catch((err) => console.error("Error al registrar Service Worker:", err));
  });
}
