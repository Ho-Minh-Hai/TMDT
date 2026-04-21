import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './Auth';
import Home from './Home';

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
        return <Navigate to="/" />;
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
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
