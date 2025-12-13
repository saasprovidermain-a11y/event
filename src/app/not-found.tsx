import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <AlertTriangle className="mb-4 h-16 w-16 text-primary" />
      <h1 className="mb-2 text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        Oops! The page you are looking for does not exist. It might have been moved or deleted.
      </p>
      <Link href="/">
        <Button variant="gradient">Return to Homepage</Button>
      </Link>
    </div>
  );
}
