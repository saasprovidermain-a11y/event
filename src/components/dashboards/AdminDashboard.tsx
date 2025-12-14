
'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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
import { Users, UserPlus, Trash2, Loader2, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [organizerDialogOpen, setOrganizerDialogOpen] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState({ email: '', password: '', displayName: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const orgQuery = query(collection(db, 'users'), where('role', '==', 'organizer'));
      const orgSnapshot = await getDocs(orgQuery);
      const orgData = orgSnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      })) as User[];
      setOrganizers(orgData);

    } catch (error) {
      toast.error('Failed to fetch data. Please try refreshing.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrganizer.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    setCreating(true);

    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', newOrganizer.email));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        toast.error('An account with this email already exists.');
        setCreating(false);
        return;
      }
      
      const newUser = {
        email: newOrganizer.email,
        displayName: newOrganizer.displayName,
        role: 'organizer',
        createdAt: serverTimestamp(),
        createdBy: userData?.uid,
      };

      await addDoc(collection(db, 'users'), newUser);

      toast.success('Organizer profile created! They can now sign up with this email.');
      setOrganizerDialogOpen(false);
      setNewOrganizer({ email: '', password: '', displayName: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to create organizer. Please try again.');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrganizer = async (organizer: User) => {
    try {
      const userQuery = query(collection(db, 'users'), where('email', '==', organizer.email));
      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        toast.error('Could not find user document to delete.');
        return;
      }

      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'users', docSnap.id));
      }

      toast.success(`Organizer ${organizer.displayName || organizer.email} has been deleted.`);
      fetchData();
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
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
          <Dialog open={organizerDialogOpen} onOpenChange={setOrganizerDialogOpen}>
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
                  This creates an organizer profile. The user can then sign up with this email.
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
                <DialogFooter>
                  <Button type="submit" variant="gradient" className="w-full" disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Organizer Profile' }
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <CardDescription>A list of all registered event organizers.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-12"><p>No organizers found.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizers.map((org) => (
                  <TableRow key={org.email}>
                    <TableCell className="font-medium">{org.displayName || 'N/A'}</TableCell>
                    <TableCell>{org.email}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you sure?</DialogTitle>
                            <DialogDescription>
                              This will delete the organizer profile for <span className="font-medium text-foreground">{org.displayName || org.email}</span>. This does not delete their authentication account.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button variant="destructive" onClick={() => handleDeleteOrganizer(org)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
