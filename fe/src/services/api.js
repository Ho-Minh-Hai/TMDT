import { supabase } from '../supabaseClient';

const API_BASE = 'http://localhost:8080/api';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
    };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    return response.json();
};

// ==================== PRODUCT API ====================

export const getProducts = async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/products`, { headers });
    return handleResponse(response);
};

export const getProduct = async (id) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/products/${id}`, { headers });
    return handleResponse(response);
};

export const createProduct = async (productData) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(productData),
    });
    return handleResponse(response);
};

export const updateProduct = async (id, productData) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(productData),
    });
    return handleResponse(response);
};

export const deleteProduct = async (id) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers,
    });
    return handleResponse(response);
};

export const uploadImage = async (file) => {
    const { data: { session } } = await supabase.auth.getSession();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/products/upload-image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
    });
    return handleResponse(response);
};
