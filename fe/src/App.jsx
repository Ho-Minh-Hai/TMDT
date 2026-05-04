import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './Auth';
import Home from './Home';

// Thêm các Component dành cho Admin
import AdminRoute from './components/AdminRoute';
import Admin from './Admin/Admin';

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
 * Redirects to /home (for user) or /admin (for admin) after login.
 */
const AuthRoute = ({ children }) => {
    const { user, isAdmin } = useAuth();
    if (user) {
        // Nếu là admin thì đẩy về dashboard admin, ngược lại về home
        return isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />;
    }
    return children;
};

/**
 * Catches all unmatched routes and redirects based on auth state and role.
 */
const CatchAllRedirect = () => {
    const { user, isAdmin } = useAuth();
    if (!user) {
        return <Navigate to="/auth" />;
    }
    return isAdmin ? <Navigate to="/admin" /> : <Navigate to="/home" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route 
                        path="/auth" 
                        element={
                            <AuthRoute>
                                <Auth />
                            </AuthRoute>
                        } 
                    />
                    <Route 
                        path="/" 
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

                    <Route
                        path="/chat"
                        element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        }
                    />

                    {/* Shop page — browse all products */}
                    <Route
                        path="/shop"
                        element={
                            <ProtectedRoute>
                                <Shop />
                            </ProtectedRoute>
                        }
                    />

                    {/* Product detail page */}
                    <Route
                        path="/product/:id"
                        element={
                            <ProtectedRoute>
                                <ProductDetail />
                            </ProtectedRoute>
                        }
                    />

                    {/* =========================================
                        ADMIN ROUTES - Chỉ dành cho Role Admin
                    ========================================= */}
                    <Route
                        path="/admin"
                        element={<Admin />}
                    />

                    {/* Catch-all — redirect based on role */}
                    <Route path="*" element={<CatchAllRedirect />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;