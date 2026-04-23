import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './Auth';
import SellerLayout from './components/SellerLayout';
import SellerDashboard from './pages/SellerDashboard';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/auth" />;
    }
    return children;
};

const AuthRoute = ({ children }) => {
    const { user } = useAuth();
    if (user) {
        return <Navigate to="/seller" />;
    }
    return children;
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
                    <Route path="*" element={<Navigate to="/seller" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
