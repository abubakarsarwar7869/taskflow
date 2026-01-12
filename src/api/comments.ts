import axios from 'axios';

// GET /api/comments/:taskId - get all comments for a task
export async function fetchComments(token: string, taskId: string) {
    return axios.get(`/api/comments/${taskId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// POST /api/comments/:taskId - add a comment
export async function addComment(token: string, taskId: string, data: { text?: string; screenshotUrl?: string; parentId?: string; type?: string }) {
    return axios.post(`/api/comments/${taskId}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// PATCH /api/comments/:commentId - update a comment
export async function updateComment(token: string, commentId: string, data: { text: string }) {
    return axios.patch(`/api/comments/comment/${commentId}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

// DELETE /api/comments/:commentId - delete a comment
export async function deleteComment(token: string, commentId: string) {
    return axios.delete(`/api/comments/comment/${commentId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
