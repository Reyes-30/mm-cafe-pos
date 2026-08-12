import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import CocinaPage from './pages/CocinaPage';
import MenuPage from './pages/MenuPage';
import ReportesPage from './pages/ReportesPage';
import HistorialPage from './pages/HistorialPage';
import UsuariosPage from './pages/UsuariosPage';
import CierreCajaPage from './pages/CierreCajaPage';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#6B3A2A',
            color: '#FAF5EE',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate 
                to={
                  user?.role === 'ADMIN' ? '/dashboard' : 
                  user?.role === 'COCINA' ? '/cocina' : 
                  '/pos'
                } 
                replace 
              />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['ADMIN', 'EMPLEADO']}>
                <POSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cocina"
            element={
              <ProtectedRoute roles={['COCINA']}>
                <CocinaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <MenuPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ReportesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/historial" element={<HistorialPage />} />
          <Route
            path="/cierre-caja"
            element={
              <ProtectedRoute roles={['EMPLEADO', 'ADMIN']}>
                <CierreCajaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate 
              to={
                isAuthenticated ? (
                  user?.role === 'ADMIN' ? '/dashboard' : 
                  user?.role === 'COCINA' ? '/cocina' : 
                  '/pos'
                ) : '/login'
              } 
              replace 
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
