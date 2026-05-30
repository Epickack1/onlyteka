import axios from "axios";

const API_URL = "/api";

const $api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    }
});

function setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

$api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // error.response отсутствует при сетевых ошибках/таймауте/CORS —
        // безопасно читаем статус через optional chaining, иначе будет TypeError.
        const status = error.response?.status;

        // Пытаемся обновить токен только на 401 и только один раз для запроса
        if (status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                return Promise.reject(error);
            }

            try {
                // Обновляем пару токенов, передавая текущий refresh-токен.
                // Используем «голый» axios, чтобы не зациклить интерсептор.
                const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
                    headers: { Authorization: `Bearer ${refreshToken}` }
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                setTokens(accessToken, newRefreshToken);

                // Повторяем изначальный запрос с новым токеном
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return $api(originalRequest);
            } catch (refreshError) {
                // refresh-токен тоже протух — разлогиниваем пользователя
                clearTokens();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default $api;
