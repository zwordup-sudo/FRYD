import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn("VITE_API_URL no está definido en el archivo .env");
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Bypass localtunnel warning page for API requests
  config.headers["bypass-tunnel-reminder"] = "true";
  return config;
});

// AUTH & USERS
export const registerUser = async (user: any) => {
  const { data } = await api.post("/users/register", user);
  return data;
};

export const loginUser = async (credentials: any) => {
  const { data } = await api.post("/users/login", credentials);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get("/users/me");
  return data;
};

export const updateUserSettings = async (settings: any) => {
  const { data } = await api.put("/users/me/settings", settings);
  return data;
};

// TASKS
export const getTasks = async () => {
  const { data } = await api.get("/tasks/");
  return data;
};

export const createTask = async (task: any) => {
  const { data } = await api.post("/tasks/", task);
  return data;
};

export const updateTask = async (id: number, task: any) => {
  const { data } = await api.patch(`/tasks/${id}`, task);
  return data;
};

export const deleteTask = async (id: number) => {
  await api.delete(`/tasks/${id}`);
};

// HABITS
export const getHabits = async () => {
  const { data } = await api.get("/habits/");
  return data;
};

export const createHabit = async (habit: any) => {
  const { data } = await api.post("/habits/", habit);
  return data;
};

export const updateHabit = async (id: number, habit: any) => {
  const { data } = await api.patch(`/habits/${id}`, habit);
  return data;
};

export const deleteHabit = async (id: number) => {
  await api.delete(`/habits/${id}`);
};

export const toggleHabitLog = async (habitId: number, dateStr: string) => {
  const { data } = await api.post(`/habits/${habitId}/toggle-log`, { date: dateStr });
  return data;
};


// DIARY
export const getDiaryEntries = async () => {
  const { data } = await api.get("/diary/");
  return data;
};

export const createDiaryEntry = async (entry: any) => {
  const { data } = await api.post("/diary/", entry);
  return data;
};

export const updateDiaryEntry = async (id: number, entry: any) => {
  const { data } = await api.patch(`/diary/${id}`, entry);
  return data;
};

export const deleteDiaryEntry = async (id: number) => {
  await api.delete(`/diary/${id}`);
};

export const extractTasksFromDiary = async (payload: {
  content: string;
  provider: string;
  model?: string | null;
  api_key?: string | null;
}) => {
  const { data } = await api.post("/diary/extract-tasks", payload);
  return data;
};

// ASSISTANT
export const sendChatMessage = async (payload: {
  message: string;
  provider: string;
  model?: string | null;
  api_key?: string | null;
  conversation_id?: number | null;
}) => {
  const { data } = await api.post("/assistant/chat", payload);
  return data;
};

export const sendChatMessageStream = async (
  payload: {
    message: string;
    provider: string;
    model?: string | null;
    api_key?: string | null;
    conversation_id?: number | null;
  },
  onToken: (token: string) => void,
  onInfo: (info: { conversation_id: number }) => void,
  onDone: (done: { id: number; created_at: string }) => void,
  onError: (error: string) => void
) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/assistant/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = "Error de red";
      try {
        const errJson = JSON.parse(errText);
        detail = errJson.detail || detail;
      } catch {}
      throw new Error(detail);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No readable stream in response");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "message";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7);
        } else if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEvent === "info") {
              onInfo(parsed);
            } else if (currentEvent === "done") {
              onDone(parsed);
            } else if (currentEvent === "error") {
              onError(parsed.detail || "Error desconocido");
            } else {
              if (parsed.token) {
                onToken(parsed.token);
              }
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
          currentEvent = "message";
        }
      }
    }
  } catch (error: any) {
    onError(error.message || "Error al conectar con el asistente");
  }
};

export const getConversations = async () => {
  const { data } = await api.get("/assistant/conversations");
  return data;
};

export const getConversation = async (conversationId: number) => {
  const { data } = await api.get(`/assistant/conversations/${conversationId}`);
  return data;
};

export const deleteConversation = async (conversationId: number) => {
  await api.delete(`/assistant/conversations/${conversationId}`);
};

export const getProviders = async () => {
  const { data } = await api.get("/assistant/providers");
  return data;
};

export const getAssistantGraph = async () => {
  const { data } = await api.get("/assistant/graph");
  return data;
};

export const getAnalyticsSummary = async () => {
  const { data } = await api.get("/analytics/summary");
  return data;
};

export const getAssistantInsights = async () => {
  const { data } = await api.get("/assistant/insights");
  return data;
};


export const testProviderConnection = async (payload: {
  provider: string;
  api_key?: string | null;
  model?: string | null;
}) => {
  const { data } = await api.post("/assistant/test-connection", payload);
  return data;
};

// USERS
export const getUserProfile = async (userId: number) => {
  const { data } = await api.get(`/users/${userId}`);
  return data;
};

export const createUser = async (user: { username: string; email: string }) => {
  const { data } = await api.post("/users/", user);
  return data;
};

// PROJECTS
export const createProject = async (project: { name: string; description?: string; methodology: string; custom_columns?: string }) => {
  const { data } = await api.post("/projects/", project);
  return data;
};

export const joinProject = async (inviteCode: string) => {
  const { data } = await api.post("/projects/join", { invite_code: inviteCode });
  return data;
};

export const getMyProjects = async () => {
  const { data } = await api.get("/projects/");
  return data;
};

export const getProjectDetails = async (projectId: number) => {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
};

export const getProjectLeaderboard = async (projectId: number) => {
  const { data } = await api.get(`/projects/${projectId}/leaderboard`);
  return data;
};

export const createProjectTask = async (
  projectId: number,
  task: {
    title: string;
    description?: string;
    column_name: string;
    assigned_to?: number | null;
    story_points?: number;
    xp_reward?: number;
    due_date?: string | null;
  }
) => {
  const { data } = await api.post(`/projects/${projectId}/tasks`, task);
  return data;
};

export const updateProjectTask = async (
  taskId: number,
  task: {
    title?: string;
    description?: string;
    column_name?: string;
    assigned_to?: number | null;
    story_points?: number;
    due_date?: string | null;
  }
) => {
  const { data } = await api.patch(`/projects/tasks/${taskId}`, task);
  return data;
};

export const getProjectTasks = async (projectId: number) => {
  const { data } = await api.get(`/projects/${projectId}/tasks`);
  return data;
};

export const completeProjectTask = async (taskId: number) => {
  const { data } = await api.post(`/projects/tasks/${taskId}/complete`);
  return data;
};

export const getProjectFeed = async (projectId: number) => {
  const { data } = await api.get(`/projects/${projectId}/feed`);
  return data;
};

export const postProjectFeedMessage = async (projectId: number, content: string) => {
  const { data } = await api.post(`/projects/${projectId}/feed`, { content });
  return data;
};

export const getProjectAnalytics = async (projectId: number) => {
  const { data } = await api.get(`/projects/${projectId}/analytics`);
  return data;
};

export const getProjectAICoach = async (projectId: number) => {
  const { data } = await api.post(`/projects/${projectId}/ai-coach`);
  return data;
};

export default api;