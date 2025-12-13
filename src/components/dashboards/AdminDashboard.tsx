'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Trash2, Loader2, Mail, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState({ email: '', password: '', displayName: '' });

  const fetchOrganizers = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'organizer'));
      const snapshot = await getDocs(q);
      const orgData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id, // Using doc.id as the uid for table key
      })) as User[];
      setOrganizers(orgData);
    } catch (error) {
      toast.error('Failed to fetch organizers. Please try refreshing.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  const handleCreateOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrganizer.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    setCreating(true);

    try {
      // Note: This creates the user in client-side auth.
      // A backend function would be needed to create a user without signing in.
      // This is a simplified approach for this app.
      
      // Check if email is already in use in Firestore users collection
      const userQuery = query(collection(db, 'users'), where('email', '==', newOrganizer.email));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        toast.error('An account with this email already exists.');
        setCreating(false);
        return;
      }
      
      // This is a placeholder. In a real app, you'd call a serverless function
      // to create the user with the Admin SDK.
      // Since we can't do that here, we'll just add to firestore.
      const newUser = {
        email: newOrganizer.email,
        displayName: newOrganizer.displayName,
        role: 'organizer',
        createdAt: new Date(),
        createdBy: userData?.uid,
      };

      await addDoc(collection(db, 'users'), newUser);

      toast.success('Organizer profile created! They can now sign up with this email.');
      setDialogOpen(false);
      setNewOrganizer({ email: '', password: '', displayName: '' });
      fetchOrganizers();
    } catch (error: any) {
      toast.error('Failed to create organizer. Please try again.');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrganizer = async (organizer: User) => {
    try {
      // Find the document with matching uid
      const userQuery = query(collection(db, 'users'), where('uid', '==', organizer.uid));
      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        toast.error('Could not find user document to delete.');
        return;
      }

      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'users', docSnap.id));
      }

      toast.success(`Organizer ${organizer.displayName || organizer.email} has been deleted.`);
      fetchOrganizers();
    } catch (error) {
      toast.error('Failed to delete organizer. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage event organizers and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchOrganizers} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="default" className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4" />
                Add Organizer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Organizer</DialogTitle>
                <DialogDescription>
                  This will create a user profile. The user can then sign in with the email and password you set.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrganizer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newOrganizer.displayName}
                    onChange={(e) => setNewOrganizer({ ...newOrganizer, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="organizer@example.com"
                    value={newOrganizer.email}
                    onChange={(e) => setNewOrganizer({ ...newOrganizer, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newOrganizer.password}
                    onChange={(e) => setNewOrganizer({ ...newOrganizer, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" variant="gradient" className="w-full" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Organizer'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Organizers</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organizers.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Role</CardTitle>
            <Shield className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-sm capitalize">{userData?.role}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Event Organizers</CardTitle>
          <CardDescription>A list of all registered event organizers in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Organizers Found</h3>
              <p className="text-muted-foreground">Click "Add Organizer" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizers.map((org) => (
                    <TableRow key={org.uid}>
                      <TableCell className="font-medium">{org.displayName || 'N/A'}</TableCell>
                      <TableCell>{org.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you sure?</DialogTitle>
                              <DialogDescription>
                                This will permanently delete the organizer{' '}
                                <span className="font-medium text-foreground">{org.displayName || org.email}</span>.
                                This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteOrganizer(org)}
                                >
                                  Yes, Delete
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
