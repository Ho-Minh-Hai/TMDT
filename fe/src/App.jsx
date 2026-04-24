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
 * Guards seller-only routes.
 * Redirects non-seller users to /home.
 */
const SellerRoute = ({ children }) => {
    const { user, userRole } = useAuth();
    if (!user) {
        return <Navigate to="/auth" />;
    }
    if (userRole !== 'seller') {
        return <Navigate to="/home" />;
    }
    return children;
};

/**
 * Prevents authenticated users from accessing the auth page.
 * Redirects based on role.
 */
const AuthRoute = ({ children }) => {
    const { user, userRole } = useAuth();
    if (user) {
        // Role-based redirect after login
        if (userRole === 'seller') {
            return <Navigate to="/seller" />;
        }
        return <Navigate to="/home" />;
    }
    return children;
};

/**
 * Catches all unmatched routes and redirects based on auth/role state.
 */
const CatchAllRedirect = () => {
    const { user, userRole } = useAuth();
    if (!user) {
        return <Navigate to="/auth" />;
    }
    if (userRole === 'seller') {
        return <Navigate to="/seller" />;
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

                    {/* Buyer/default home page */}
                    <Route 
                        path="/home" 
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Seller routes — only for users with role 'seller' */}
                    <Route 
                        path="/seller"
                        element={
                            <SellerRoute>
                                <SellerLayout />
                            </SellerRoute>
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
