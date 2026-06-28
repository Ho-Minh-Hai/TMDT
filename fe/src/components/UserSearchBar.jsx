import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * UserSearchBar — tìm kiếm người dùng theo tên, hiển thị dropdown kết quả,
 * click vào sẽ điều hướng đến trang /user/:id
 */
const UserSearchBar = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults([]);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, school')
                .ilike('full_name', `%${query.trim()}%`)
                .limit(8);

            if (!error && data) {
                setResults(data);
                setOpen(true);
            }
            setLoading(false);
        }, 300);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const handleSelect = (userId) => {
        setQuery('');
        setResults([]);
        setOpen(false);
        navigate(`/user/${userId}`);
    };

    return (
        <div className="search-wrapper" ref={wrapperRef}>
            <div className="search-input-box">
                <Search size={15} color="#9ca3af" />
                <input
                    type="text"
                    placeholder="Tìm người dùng..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                />
                {loading && <div className="search-spinner"></div>}
            </div>

            {open && (
                <div className="search-results-dropdown">
                    {results.length === 0 ? (
                        <div className="search-empty">Không tìm thấy người dùng nào</div>
                    ) : (
                        results.map((u) => (
                            <div
                                key={u.id}
                                className="search-result-item"
                                onClick={() => handleSelect(u.id)}
                            >
                                {u.avatar_url ? (
                                    <img src={u.avatar_url} alt={u.full_name} className="search-result-avatar" />
                                ) : (
                                    <div className="search-result-avatar-placeholder">
                                        <User size={16} color="#6366f1" />
                                    </div>
                                )}
                                <div>
                                    <div className="search-result-name">{u.full_name || 'Người dùng'}</div>
                                    {u.school && <div className="search-result-school">{u.school}</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSearchBar;
