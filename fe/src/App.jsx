import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './Auth';
import Home from './Home';
import SellerLayout from './components/SellerLayout';
import SellerDashboard from './pages/SellerDashboard';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import Profile from './pages/Profile';

/**
 * Protects routes that require authentication.
 * Redirects unauthenticated users to /auth.
 */
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/auth" />;
    }
    return children;
};

/**
 * Prevents authenticated users from accessing the auth page.
 * Redirects to /home after login.
 */
const AuthRoute = ({ children }) => {
    const { user } = useAuth();
    if (user) {
        return <Navigate to="/home" />;
    }
    return children;
};

/**
 * Catches all unmatched routes and redirects based on auth state.
 */
const CatchAllRedirect = () => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/auth" />;
    }
    return <Navigate to="/home" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Auth page — only for unauthenticated users */}
                    <Route
                        path="/auth"
                        element={
                            <AuthRoute>
                                <Auth />
                            </AuthRoute>
                        }
                    />

                    {/* Home page — default interface for purchases */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />

                    {/* Product management routes — accessible to all authenticated users */}
                    <Route
                        path="/seller"
                        element={
                            <ProtectedRoute>
                                <SellerLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<SellerDashboard />} />
                        <Route path="products" element={<ProductList />} />
                        <Route path="products/new" element={<ProductForm />} />
                        <Route path="products/:id/edit" element={<ProductForm />} />
                    </Route>

                    {/* Profile page */}
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Catch-all — redirect based on role */}
                    <Route path="*" element={<CatchAllRedirect />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
