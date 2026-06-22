import api from "./api";

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
}

const QUEUE_KEY = "fryd_offline_queue";
const CACHE_PREFIX = "fryd_get_cache_";

// Save request to queue
const enqueueRequest = (url: string, method: string, data: any) => {
  const queue: QueuedRequest[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  
  // Prevent adding duplicate identical requests in quick succession
  const isDuplicate = queue.some(
    (r) => r.url === url && r.method === method && JSON.stringify(r.data) === JSON.stringify(data)
  );
  if (isDuplicate) return;

  queue.push({
    id: `${method}_${url}_${Date.now()}`,
    url,
    method,
    data,
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

// Process the offline queue
export const syncOfflineData = async () => {
  if (!navigator.onLine) return;
  const queue: QueuedRequest[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  if (queue.length === 0) return;

  console.log(`Sincronizando ${queue.length} operaciones offline...`);

  // Clear queue temporarily to prevent concurrent execution loops
  localStorage.setItem(QUEUE_KEY, "[]");

  for (const req of queue) {
    try {
      await api({
        url: req.url,
        method: req.method,
        data: req.data,
      });
      console.log(`Sincronizado con éxito: ${req.method} ${req.url}`);
    } catch (error) {
      console.error(`Error al sincronizar ${req.method} ${req.url}:`, error);
      // Re-queue if it's a connection issue, discard if it's a client error (e.g. 400 Bad Request)
      const err = error as any;
      if (!err.response || err.response.status >= 500) {
        enqueueRequest(req.url, req.method, req.data);
      }
    }
  }

  // Trigger a custom event to notify components that synchronization is complete
  window.dispatchEvent(new CustomEvent("fryd_sync_complete"));
};

// Listen for network status changes
if (typeof window !== "undefined") {
  window.addEventListener("online", syncOfflineData);
}

// Setup Axios Interceptors for Offline mode
export const setupOfflineSync = () => {
  // Request Interceptor
  api.interceptors.request.use(
    async (config) => {
      if (!navigator.onLine) {
        const method = config.method?.toUpperCase() || "GET";

        if (method === "GET") {
          // Retrieve from cache if available
          if (config.url) {
            const cachedData = localStorage.getItem(CACHE_PREFIX + config.url);
            if (cachedData) {
              config.adapter = () => {
                return Promise.resolve({
                  data: JSON.parse(cachedData),
                  status: 200,
                  statusText: "OK",
                  headers: {},
                  config,
                });
              };
            }
          }
        } else {
          // Store modifications in local queue
          enqueueRequest(config.url || "", method, config.data);
          
          // Return a mock successful response to keep UI responsive
          config.adapter = () => {
            const mockData = {
              id: -Date.now(),
              ...config.data,
              _offline_pending: true,
            };
            return Promise.resolve({
              data: mockData,
              status: 200,
              statusText: "OK",
              headers: {},
              config,
            });
          };
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor
  api.interceptors.response.use(
    (response) => {
      const config = response.config;
      const method = config.method?.toUpperCase() || "GET";
      
      // Cache successful GET requests when online
      if (navigator.onLine && method === "GET" && response.status === 200 && config.url) {
        localStorage.setItem(CACHE_PREFIX + config.url, JSON.stringify(response.data));
      }
      
      return response;
    },
    (error) => {
      const config = error.config;
      // Serve from cache if a network error occurs during a GET request
      if (config && config.method?.toUpperCase() === "GET" && config.url) {
        const cachedData = localStorage.getItem(CACHE_PREFIX + config.url);
        if (cachedData) {
          return Promise.resolve({
            data: JSON.parse(cachedData),
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          });
        }
      }
      return Promise.reject(error);
    }
  );
};
