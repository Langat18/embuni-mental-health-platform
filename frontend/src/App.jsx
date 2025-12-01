import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from "./pages/RegisterPage";
import StudentRegisterPage from "./pages/StudentRegisterPage";
import StaffRegisterPage from "./pages/StaffRegisterPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import CounselorDashboard from "./pages/CounselorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ChatPage from "./pages/ChatPage";

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
          
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/chat/:ticketId" element={<ChatPage />} />
          
          <Route path="/counselor/dashboard" element={<CounselorDashboard />} />
          <Route path="/counselor/chat/:ticketId" element={<ChatPage />} />
          
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;