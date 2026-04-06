import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen font-bold text-2xl">
      404 - Faqja nuk u gjet
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;