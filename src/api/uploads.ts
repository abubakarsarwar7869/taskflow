import axios from 'axios';

export async function uploadImage(token: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return axios.post('/api/uploads', formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
}
