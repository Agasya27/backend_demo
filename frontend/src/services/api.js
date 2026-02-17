import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

const api = {
    async getTickets(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);

        const response = await apiClient.get(`/tickets/?${params.toString()}`);
        return response.data;
    },

    async createTicket(ticketData) {
        const response = await apiClient.post('/tickets/', ticketData);
        return response.data;
    },

    async updateTicket(id, updates) {
        const response = await apiClient.patch(`/tickets/${id}/`, updates);
        return response.data;
    },

    async deleteTicket(id) {
        const response = await apiClient.delete(`/tickets/${id}/`);
        return response.data;
    },

    async classifyTicket(description) {
        const response = await apiClient.post('/tickets/classify/', { description });
        return response.data;
    },

    async getStats() {
        const response = await apiClient.get('/tickets/stats/');
        return response.data;
    },
};

export default api;
