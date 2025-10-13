// services/api.ts
import axios from "axios";
const api = axios.create({
  baseURL: "https://api-changelog.intelbras-cve-pro.com.br/api",
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing = false;
let queue: any[] = [];

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (refreshing)
        return new Promise((res, rej) => queue.push({ res, rej, original }));

      try {
        refreshing = true;
        const { data } = await axios.post(
          `https://api-changelog.intelbras-cve-pro.com.br/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem("token", data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        queue.forEach((w) => w.res(api(w.original)));
        queue = [];
        return api(original);
      } catch (e) {
        queue.forEach((w) => w.rej(e));
        queue = [];
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
