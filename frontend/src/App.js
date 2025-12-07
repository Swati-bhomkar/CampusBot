import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import AdminDashboard from "./pages/AdminDashboard";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth wrapper to handle session_id
function AuthWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
  const processAuth = async () => {
    // Check both hash and query param for session_id
    let sessionId = null;
    // 1. Query param
    const qSession = new URLSearchParams(window.location.search).get('session_id');
    // 2. Hash param
    const hash = window.location.hash;
    const hSession = new URLSearchParams(hash.substring(1)).get('session_id');
    sessionId = qSession || hSession;

    if (sessionId) {
      try {
        const response = await axios.post(`${API}/auth/session`, {}, {
          headers: { 'X-Session-ID': sessionId },
          withCredentials: true
        });
        setUser(response.data.user);
        // Clean URL and navigate to chat
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/chat');
      } catch (error) {
        console.error('Failed to process session:', error);
        setLoading(false);
      }
    } else {
      // Check existing session
      try {
        const response = await axios.get(`${API}/auth/user`, {
          withCredentials: true
        });
        setUser(response.data);
      } catch (error) {
        // Not authenticated
        setUser(null);
      }
      setLoading(false);
    }
  };
  processAuth();
}, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children({ user, setUser });
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AuthWrapper>
              {({ user }) => user ? <Navigate to="/chat" /> : <LandingPage />}
            </AuthWrapper>
          } />
          <Route path="/chat" element={
            <AuthWrapper>
              {({ user, setUser }) => user ? <ChatPage user={user} setUser={setUser} /> : <Navigate to="/" />}
            </AuthWrapper>
          } />
          <Route path="/admin" element={
            <AuthWrapper>
              {({ user, setUser }) => user?.is_admin ? <AdminDashboard user={user} setUser={setUser} /> : <Navigate to="/" />}
            </AuthWrapper>
          } />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
