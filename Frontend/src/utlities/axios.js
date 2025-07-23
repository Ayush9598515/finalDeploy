import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:2000/api", // backend URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ This tells axios to send cookies with every request
});

// ❌ The interceptor that was here has been removed.
// The browser will now handle sending the cookie automatically.

export default api;
