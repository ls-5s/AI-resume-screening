import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { refreshToken as refreshTokenApi } from "../api/login";
import { useLoginStore } from "../store/Login";

// 1. 基础配置（从环境变量取基础URL，兜底本地服务）
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// 2. 创建Axios实例
const request: AxiosInstance = axios.create({
    baseURL,
    timeout: 10000, // 10秒超时
    headers: { "Content-Type": "application/json" },
});

// 3. 请求拦截器：携带token
request.interceptors.request.use(
    (config) => {
        // 从 zustand store 取 token
        const token = useLoginStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (err: AxiosError) => Promise.reject(err)
);

// 4. 响应拦截器：统一处理错误和数据格式
request.interceptors.response.use(
    // 成功响应：只返回业务数据（适配常见的{code, message, data}结构）
    (res) => {
        // 业务成功（code为0/200都算成功，可根据你的后端调整）
        if ([0, 200,201].includes(res.data.code)) {
            return res.data.data; // 只返回核心数据，简化业务层调用
        }
        // 业务失败：抛出错误（让业务层catch处理）
        return Promise.reject(new Error(res.data.message || "请求失败"));
    },
    // 失败响应：分类处理HTTP错误
    async (err: AxiosError) => {
        const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        // 优先使用后端返回的错误信息
        const backendMessage = err.response?.data?.message || err.message;
        let errorMsg = "网络异常，请稍后重试";

        // 401：token过期，尝试刷新token
        if (err.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const { refreshToken, logout } = useLoginStore.getState();
            
            if (refreshToken) {
                try {
                    // 调用刷新token接口
                    const res = await refreshTokenApi(refreshToken);
                    // 更新 token
                    useLoginStore.getState().setTokens(res.token, res.refreshToken);
                    // 重新设置请求头
                    originalRequest.headers.Authorization = `Bearer ${res.token}`;
                    // 重新发起请求
                    return request(originalRequest);
                } catch {
                    // 刷新失败，清除登录状态
                    errorMsg = "登录已过期，请重新登录";
                    logout();
                    window.location.href = "/";
                }
            } else {
                // 没有 refreshToken，直接跳转登录页
                errorMsg = "登录已过期，请重新登录";
                logout();
                window.location.href = "/";
            }
        }
        // 403：权限不足
        else if (err.response?.status === 403) {
            errorMsg = backendMessage || "暂无权限访问该资源";
        }
        // 4xx：其他客户端错误
        else if (err.response && err.response.status >= 400 && err.response.status < 500) {
            errorMsg = backendMessage || "请求错误";
        }
        // 5xx：服务器错误
        else if (err.response && err.response.status >= 500) {
            errorMsg = backendMessage || "服务器内部错误，请稍后重试";
        }
        // 超时错误
        else if (err.code === "ECONNABORTED") {
            errorMsg = "请求超时，请检查网络";
        }
        // 网络错误
        else if (!err.response) {
            errorMsg = "网络异常，请检查网络连接";
        }

        console.error("请求错误：", errorMsg);
        return Promise.reject(new Error(errorMsg));
    }
);

export default request;