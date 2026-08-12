import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './auth/AuthContext';
import { can, homePathFor, type Capability, type Module } from './auth/roles';

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
const SotuvBolimiPage = lazy(() => import('./pages/SotuvBolimiPage').then((m) => ({ default: m.SotuvBolimiPage })));
const OmborXonasiPage = lazy(() => import('./pages/OmborXonasiPage').then((m) => ({ default: m.OmborXonasiPage })));

function Loader() {
  return <div className="card grid min-h-64 place-items-center"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /><p className="mt-3 text-sm text-slate-500">Sahifa yuklanmoqda...</p></div></div>;
}

function RequireModule({ module, action = 'view', children }: { module: Module; action?: Capability; children: React.ReactNode }) {
  const { user } = useAuth();
  return can(user, module, action) ? <>{children}</> : <Navigate to={homePathFor(user)} replace />;
}

function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === 'cashier') return <Navigate to="/sotuv-bolimi" replace />;
  if (user?.role === 'warehouse') return <Navigate to="/ombor-xonasi" replace />;
  return <DashboardPage />;
}

export default function App() {
  const { user } = useAuth();
  if (!user) return <Routes><Route path="*" element={<LoginPage />} /></Routes>;
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<HomeRoute />} />
          <Route path="parfyumlar" element={<RequireModule module="perfumes"><PerfumesPage /></RequireModule>} />
          <Route path="tovar-kirimi" element={<RequireModule module="stock_ins"><StockInPage /></RequireModule>} />
          <Route path="sotuvlar" element={<RequireModule module="sales"><SalesPage /></RequireModule>} />
          <Route path="sotuvlar/yangi" element={<RequireModule module="sales" action="add"><NewSalePage /></RequireModule>} />
          <Route path="mijozlar" element={<RequireModule module="customers"><CustomersPage /></RequireModule>} />
          <Route path="qarzdorlar" element={<RequireModule module="debts"><DebtorsPage /></RequireModule>} />
          <Route path="qarzlarim" element={<RequireModule module="payables"><MyDebtsPage /></RequireModule>} />
          <Route path="kirimlar" element={<RequireModule module="incomes"><IncomesPage /></RequireModule>} />
          <Route path="chiqimlar" element={<RequireModule module="expenses"><ExpensesPage /></RequireModule>} />
          <Route path="hisobotlar" element={<RequireModule module="reports"><ReportsPage /></RequireModule>} />
          <Route path="ombor" element={<RequireModule module="warehouse"><WarehousePage /></RequireModule>} />
          <Route path="sozlamalar" element={<RequireModule module="settings"><SettingsPage /></RequireModule>} />
          <Route path="sotuv-bolimi" element={<RequireModule module="sales"><SotuvBolimiPage /></RequireModule>} />
          <Route path="ombor-xonasi" element={<RequireModule module="warehouse"><OmborXonasiPage /></RequireModule>} />
          <Route path="hodimlar" element={<RequireModule module="employees"><EmployeesPage /></RequireModule>} />
          <Route path="hodimlar/:id" element={<RequireModule module="employees"><EmployeeDetailPage /></RequireModule>} />
          <Route path="loglar" element={<RequireModule module="activity_logs"><ActivityLogPage /></RequireModule>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
