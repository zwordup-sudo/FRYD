import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import TaskPage from "./pages/Task";
import HabitPage from "./pages/Habit";
import DiaryPage from "./pages/Diary";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/task" element={<TaskPage />} />
          <Route path="/habit" element={<HabitPage />} />
          <Route path="/diary" element={<DiaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;