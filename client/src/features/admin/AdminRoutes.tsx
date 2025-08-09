import { Route, Switch, useLocation } from 'wouter';
import { useEffect } from 'react';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import AdminDashboard from './pages/Dashboard';

const AdminRoutes: React.FC = () => {
  const [location] = useLocation();

  // Redirect to login if not on login page and not authenticated
  useEffect(() => {
    if (!location.startsWith('/admin/login')) {
      // This will be handled by the AdminLayout's authentication check
      return;
    }
  }, [location]);

  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminLayout>
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            {/* Add more admin routes here */}
            <Route>404 - Admin Page Not Found</Route>
          </Switch>
        </AdminLayout>
      </Route>
    </Switch>
  );
};

export default AdminRoutes;
