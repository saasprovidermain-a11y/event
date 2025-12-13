import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, QrCode, Shield, ArrowRight, Zap, BarChart } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-primary/80" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <nav className="relative z-10 container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-sans text-2xl font-bold text-secondary-foreground">EventHub</span>
            </div>
            <Link href="/login">
              <Button variant="outline" className="border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10 hover:border-secondary-foreground/40">
                Sign In
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Streamline Your Events
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-secondary-foreground leading-tight mb-6">
              Event Management
              <span className="block text-primary-foreground/90">Made Simple</span>
            </h1>
            
            <p className="text-lg md:text-xl text-secondary-foreground/80 mb-8 max-w-2xl">
              Create events, generate registration links, manage participants, and track check-ins with QR codes. 
              Everything you need to run successful events in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login">
                <Button variant="gradient" size="xl" className="group">
                  Get Started
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make event management effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: 'Participant Management',
                description: 'Collect registrations via shareable links and manage all participants in one place',
                color: 'bg-primary/10 text-primary',
              },
              {
                icon: QrCode,
                title: 'QR Code Check-ins',
                description: 'Scan QR codes for instant check-ins, meals, and event tracking',
                color: 'bg-accent/10 text-accent',
              },
              {
                icon: Shield,
                title: 'Role-Based Access',
                description: 'Admin and organizer roles with appropriate permissions',
                color: 'bg-amber-500/10 text-amber-600',
              },
              {
                icon: BarChart,
                title: 'Real-time Analytics',
                description: 'Track attendance, meals, and event activity as it happens',
                color: 'bg-indigo-500/10 text-indigo-600',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-secondary to-primary/90">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-sans font-bold text-secondary-foreground mb-4">
            Ready to Transform Your Events?
          </h2>
          <p className="text-lg text-secondary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who trust EventHub for seamless event management
          </p>
          <Link href="/login">
            <Button variant="outline" size="xl" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
              Start Managing Events
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-sans font-semibold text-foreground">EventHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EventHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
