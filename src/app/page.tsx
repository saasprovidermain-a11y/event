import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, QrCode, Shield, ArrowRight, BarChart } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-[50rem] h-[50rem] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <nav className="relative z-10 container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">EventManager</span>
            </div>
            <Link href="/login">
              <Button>
                Sign In <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-4 pt-20 pb-32 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              Streamline Your Events
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Event Management
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Made Simple</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Create events, generate registration links, manage participants, and track check-ins with QR codes. 
              Everything you need to run successful events in one platform.
            </p>
            
            <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Link href="/login">
                <Button variant="default" size="lg" className="group">
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
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Powerful features designed to make event management effortless and efficient, from registration to real-time analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: 'Participant Management',
                description: 'Collect registrations via shareable links and manage all participants in one place.',
                color: 'text-primary',
              },
              {
                icon: QrCode,
                title: 'QR Code Check-ins',
                description: 'Scan QR codes for instant check-ins, meals, and event tracking.',
                color: 'text-accent',
              },
              {
                icon: Shield,
                title: 'Role-Based Access',
                description: 'Admin and organizer roles with appropriate permissions for secure management.',
                color: 'text-amber-400',
              },
              {
                icon: BarChart,
                title: 'Real-time Analytics',
                description: 'Track attendance, meals, and event activity as it happens with a live dashboard.',
                color: 'text-green-400',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8 rounded-xl bg-card border border-border/50 shadow-sm hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Events?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who trust EventManager for seamless event management.
          </p>
          <Link href="/login">
            <Button variant="default" size="lg" className="group">
              Start Managing Events
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">EventManager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EventManager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
