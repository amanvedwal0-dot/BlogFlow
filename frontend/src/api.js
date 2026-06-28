import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("blogToken");
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;