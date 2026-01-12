import axios from 'axios';

// Get all tasks for a board
export async function fetchTasks(token: string, boardId: string) {
    return axios.get(`/api/tasks/board/${boardId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Create a new task
export async function createTask(token: string, data: any) {
    return axios.post('/api/tasks', data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Update a task
export async function updateTask(token: string, id: string, data: any) {
    return axios.put(`/api/tasks/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Delete a task
export async function deleteTask(token: string, id: string) {
    return axios.delete(`/api/tasks/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Complete a task
export async function completeTask(token: string, id: string, data: { comment?: string, screenshotUrl?: string }) {
    return axios.post(`/api/tasks/${id}/complete`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
