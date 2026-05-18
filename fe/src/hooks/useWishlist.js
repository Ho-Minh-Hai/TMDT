import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook quản lý danh sách yêu thích (Wishlist)
 * Sử dụng Supabase trực tiếp với RLS policies
 */
export const useWishlist = () => {
    const { user } = useAuth();
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [loading, setLoading] = useState(false);

    // Fetch danh sách product_id trong wishlist khi user thay đổi
    useEffect(() => {
        if (!user) {
            setWishlistIds(new Set());
            return;
        }
        fetchWishlistIds();
    }, [user]);

    const fetchWishlistIds = async () => {
        try {
            const { data, error } = await supabase
                .from('wishlists')
                .select('product_id')
                .eq('user_id', user.id);

            if (error) throw error;
            setWishlistIds(new Set((data || []).map(w => w.product_id)));
        } catch (err) {
            console.error('Error fetching wishlist:', err);
        }
    };

    // Kiểm tra sản phẩm có trong wishlist không
    const isWishlisted = useCallback((productId) => {
        return wishlistIds.has(productId);
    }, [wishlistIds]);

    // Toggle thêm/xóa sản phẩm khỏi wishlist
    const toggleWishlist = useCallback(async (productId) => {
        if (!user) return { success: false, message: 'Vui lòng đăng nhập!' };

        const alreadyWishlisted = wishlistIds.has(productId);
        setLoading(true);

        try {
            if (alreadyWishlisted) {
                // Xóa khỏi wishlist
                const { error } = await supabase
                    .from('wishlists')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);

                if (error) throw error;

                setWishlistIds(prev => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
                return { success: true, added: false };
            } else {
                // Thêm vào wishlist
                const { error } = await supabase
                    .from('wishlists')
                    .insert({ user_id: user.id, product_id: productId });

                if (error) throw error;

                setWishlistIds(prev => new Set([...prev, productId]));
                return { success: true, added: true };
            }
        } catch (err) {
            console.error('Error toggling wishlist:', err);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [user, wishlistIds]);

    // Lấy danh sách đầy đủ sản phẩm trong wishlist (có thông tin sản phẩm)
    const fetchWishlistProducts = useCallback(async () => {
        if (!user) return [];
        try {
            const { data: wishlistData, error: wishlistError } = await supabase
                .from('wishlists')
                .select('product_id, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (wishlistError) throw wishlistError;
            if (!wishlistData || wishlistData.length === 0) return [];

            const productIds = wishlistData.map(w => w.product_id);
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('*')
                .in('id', productIds);

            if (productsError) throw productsError;

            // Giữ thứ tự theo wishlist (mới nhất trước)
            const productMap = {};
            (products || []).forEach(p => { productMap[p.id] = p; });

            return wishlistData
                .map(w => productMap[w.product_id])
                .filter(Boolean);
        } catch (err) {
            console.error('Error fetching wishlist products:', err);
            return [];
        }
    }, [user]);

    return {
        wishlistIds,
        isWishlisted,
        toggleWishlist,
        fetchWishlistProducts,
        wishlistCount: wishlistIds.size,
        loading,
    };
};
