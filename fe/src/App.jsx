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
import Chat from './pages/Chat';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Admin from './Admin/Admin';
import AdminRoute from './components/AdminRoute';
import Wishlist from './pages/Wishlist';
import PurchaseHistory from './pages/PurchaseHistory';
import VipMember from './pages/VipMember';
import VipMemberCallback from './pages/VipMemberCallback';
import UserProfile from './pages/UserProfile';

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
    const { user, isAdmin } = useAuth();
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

                    {/* Vip member page */}
                    <Route 
                        path="/vip-member" 
                        element={
                            <ProtectedRoute>
                                <VipMember />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/vip-member/callback" 
                        element={
                            <ProtectedRoute>
                                <VipMemberCallback />
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
                        element={
                            <AdminRoute>
                                <Admin />
                            </AdminRoute>
                        }
                    />

                    {/* Wishlist page */}
                    <Route 
                        path="/wishlist" 
                        element={
                            <ProtectedRoute>
                                <Wishlist />
                            </ProtectedRoute>
                        } 
                    />
                    {/* purchase history page */}
                    <Route
                        path="/purchase-history"
                        element={
                            <ProtectedRoute>
                                <PurchaseHistory />
                            </ProtectedRoute>
                        }
                    />
                    {/* User public profile page */}
                    <Route
                        path="/user/:id"
                        element={
                            <ProtectedRoute>
                                <UserProfile />
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