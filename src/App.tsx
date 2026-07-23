import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './auth/AuthContext';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PerfumesPage = lazy(() => import('./pages/PerfumesPage').then((m) => ({ default: m.PerfumesPage })));
const StockInPage = lazy(() => import('./pages/StockInPage').then((m) => ({ default: m.StockInPage })));
const SalesPage = lazy(() => import('./pages/SalesPage').then((m) => ({ default: m.SalesPage })));
const NewSalePage = lazy(() => import('./pages/NewSalePage').then((m) => ({ default: m.NewSalePage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const DebtorsPage = lazy(() => import('./pages/DebtorsPage').then((m) => ({ default: m.DebtorsPage })));
const MyDebtsPage = lazy(() => import('./pages/MyDebtsPage').then((m) => ({ default: m.MyDebtsPage })));
const IncomesPage = lazy(() => import('./pages/IncomesPage').then((m) => ({ default: m.IncomesPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const WarehousePage = lazy(() => import('./pages/WarehousePage').then((m) => ({ default: m.WarehousePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })));
const EmployeeDetailPage = lazy(() => import('./pages/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage').then((m) => ({ default: m.ActivityLogPage })));

function Loader() {
  return <div className="card grid min-h-64 place-items-center"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /><p className="mt-3 text-sm text-slate-500">Sahifa yuklanmoqda...</p></div></div>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.is_superuser ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  const { user } = useAuth();
  if (!user) return <Routes><Route path="*" element={<LoginPage />} /></Routes>;
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="parfyumlar" element={<PerfumesPage />} />
          <Route path="tovar-kirimi" element={<StockInPage />} />
          <Route path="sotuvlar" element={<SalesPage />} />
          <Route path="sotuvlar/yangi" element={<NewSalePage />} />
          <Route path="mijozlar" element={<CustomersPage />} />
          <Route path="qarzdorlar" element={<DebtorsPage />} />
          <Route path="qarzlarim" element={<MyDebtsPage />} />
          <Route path="kirimlar" element={<IncomesPage />} />
          <Route path="chiqimlar" element={<ExpensesPage />} />
          <Route path="hisobotlar" element={<ReportsPage />} />
          <Route path="ombor" element={<WarehousePage />} />
          <Route path="sozlamalar" element={<SettingsPage />} />
          <Route path="hodimlar" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
          <Route path="hodimlar/:id" element={<AdminRoute><EmployeeDetailPage /></AdminRoute>} />
          <Route path="loglar" element={<AdminRoute><ActivityLogPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
