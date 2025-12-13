'use client';

import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import OrganizerDashboard from '@/components/dashboards/OrganizerDashboard';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userData?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <OrganizerDashboard />;
};

export default DashboardPage;
