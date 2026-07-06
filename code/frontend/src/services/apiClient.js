import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // the httpOnly refresh-token cookie must ride along on every request
});

// apiClient is built against this interface, not AuthContext directly -- AuthContext (Frontend
// Milestone 2) calls configureAuth() once, on mount. This avoids apiClient.js and AuthContext.jsx
// circularly depending on each other, since AuthContext doesn't exist yet in this milestone.
let getAccessToken = () => null;
let refreshAccessToken = async () => {
  throw new Error("refreshAccessToken() called before configureAuth() ran.");
};

export function configureAuth({ getAccessToken: getTokenFn, refreshAccessToken: refreshFn }) {
  getAccessToken = getTokenFn;
  refreshAccessToken = refreshFn;
}

// Exported (not just registered inline below) so it's directly unit-testable with a plain fake
// config object, no axios internals or mocking required.
export function attachAccessToken(config) {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// Retries a request exactly once, after a fresh access token, on a 401 -- never for the refresh
// call itself, which would otherwise recurse forever if the refresh token is also invalid/expired.
export async function retryOnceAfterRefresh(error) {
  const originalRequest = error.config;
  const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");
  if (error.response?.status !== 401 || originalRequest._retry || isRefreshCall) {
    throw error;
  }
  originalRequest._retry = true;
  const newAccessToken = await refreshAccessToken();
  originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
  return apiClient.request(originalRequest);
}

apiClient.interceptors.request.use(attachAccessToken);
apiClient.interceptors.response.use((response) => response, retryOnceAfterRefresh);
