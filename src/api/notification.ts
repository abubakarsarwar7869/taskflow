import axios from 'axios';

// Get all notifications
export async function fetchNotifications(token: string) {
    return axios.get('/api/notifications', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Mark a notification as read
export async function markAsRead(token: string, id: string) {
    return axios.put(`/api/notifications/${id}/read`, {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Mark all notifications as read
export async function markAllAsRead(token: string) {
    return axios.put('/api/notifications/read-all', {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Delete a single notification
export async function deleteNotification(token: string, id: string) {
    return axios.delete(`/api/notifications/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// Clear all notifications
export async function clearAllNotifications(token: string) {
    return axios.delete('/api/notifications/clear-all/all', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
