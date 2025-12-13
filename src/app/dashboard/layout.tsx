'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar, Users, QrCode, LogOut, Menu, X, LayoutDashboard, Shield, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { currentUser, userData, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully. Come back soon!');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (loading || !currentUser || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = userData?.role === 'admin';

  const navItems = isAdmin
    ? [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/dashboard/scanner', label: 'QR Scanner', icon: QrCode },
      ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-sans text-xl font-bold hidden sm:block">EventHub</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button variant={isActive ? 'default' : 'ghost'} size="sm" className="gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {isAdmin ? <Shield className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-primary" />}
                </div>
                <div className="hidden lg:block">
                  <p className="font-medium text-foreground">{userData?.displayName || userData?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userData?.role}</p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden md:flex">
                <LogOut className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card animate-slide-up">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={isActive ? 'default' : 'ghost'} className="w-full justify-start gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};

export default DashboardLayout;
