/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);

    // Fetch user profile from the profiles table
    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error.message);
                return null;
            }
            return data;
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            return null;
        }
    };

    useEffect(() => {
        isMounted.current = true;

        // Use onAuthStateChange as the SINGLE source of truth.
        // It fires INITIAL_SESSION on mount (which replaces the old getSession() call)
        // and also handles TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT, etc.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted.current) return;

            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // Use setTimeout to avoid potential Supabase deadlock
                // when making DB calls inside onAuthStateChange callback
                setTimeout(async () => {
                    if (!isMounted.current) return;
                    const userProfile = await fetchProfile(currentUser.id);
                    if (isMounted.current) {
                        setProfile(userProfile);
                        setLoading(false);
                    }
                }, 0);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted.current = false;
            subscription.unsubscribe();
        };
    }, []);

    const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    };

    // Derive role from profile (defaults to 'buyer' if no profile yet)
    const userRole = profile?.role || 'buyer';

    // Will be passed down to Signup, Login and Dashboard components
    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: () => supabase.auth.signOut(),
        user,
        profile,
        userRole,
        session,
        getAccessToken,
        fetchProfile,
    };

    // Show a loading indicator while restoring session
    if (loading) {
        return (
            <AuthContext.Provider value={value}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    background: 'var(--bg-dark, #0a0a0f)',
                    color: 'var(--text-dim, #888)',
                    fontSize: '1rem',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTopColor: 'var(--primary, #6366f1)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 1rem',
                        }} />
                        <p>Đang tải...</p>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
