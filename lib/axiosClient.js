import axios from "axios";

export const axiosClient = axios.create();

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.error;
    if (serverMessage) error.message = serverMessage;
    return Promise.reject(error);
  }
);
