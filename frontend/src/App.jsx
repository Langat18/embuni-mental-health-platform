import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from "./pages/RegisterPage";
import StudentRegisterPage from "./pages/StudentRegisterPage";
import StaffRegisterPage from "./pages/StaffRegisterPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import NewChatPage from "./pages/student/NewChatPage";
import AssessmentPage from "./pages/student/AssessmentPage";
import CounselorDashboard from "./pages/CounselorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ChatPage from "./pages/ChatPage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/student" element={<StudentRegisterPage />} />
          <Route path="/register/staff" element={<StaffRegisterPage />} />
          
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/new-chat" element={
            <ProtectedRoute allowedRoles={['student']}>
              <NewChatPage />
            </ProtectedRoute>
          } />
          <Route path="/student/assessment" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AssessmentPage />
            </ProtectedRoute>
          } />
          <Route path="/student/chat/:ticketId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/counselor/dashboard" element={
            <ProtectedRoute allowedRoles={['counselor', 'peer_counselor']}>
              <CounselorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/counselor/chat/:ticketId" element={
            <ProtectedRoute allowedRoles={['counselor', 'peer_counselor']}>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
