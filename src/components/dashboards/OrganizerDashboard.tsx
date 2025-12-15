'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Event, EventCategory, Participant, CheckInTypeDefinition, CheckInCategory } from '@/types';
import ParticipantList from '@/components/ParticipantList';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Link2,
  Users,
  Calendar,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Ticket,
  Settings,
  FolderPlus,
  FileDown,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '../ui/separator';
import * as XLSX from 'xlsx';

const CATEGORY_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

const OrganizerDashboard = () => {
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkInTypes, setCheckInTypes] = useState<CheckInTypeDefinition[]>([]);
  const [checkInCategories, setCheckInCategories] = useState<CheckInCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkInManagementDialogOpen, setCheckInManagementDialogOpen] = useState(false);
  
  const [newCheckInTypeName, setNewCheckInTypeName] = useState('');
  const [selectedCheckInCategoryId, setSelectedCheckInCategoryId] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');

  const [copied, setCopied] = useState(false);

  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    categories: [{ id: uuidv4(), name: '', color: CATEGORY_COLORS[0] }] as EventCategory[],
  });

  const fetchEventAndParticipants = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const eventQuery = query(collection(db, 'events'), where('organizerId', '==', currentUser.uid));
      const eventSnapshot = await getDocs(eventQuery);

      if (!eventSnapshot.empty) {
        const eventDoc = eventSnapshot.docs[0];
        const eventData = { ...eventDoc.data(), id: eventDoc.id } as Event;
        setEvent(eventData);

        const categoryQuery = query(collection(db, 'checkInCategories'), where('eventId', '==', eventData.id));
        const categorySnapshot = await getDocs(categoryQuery);
        const categoryData = categorySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CheckInCategory[];
        setCheckInCategories(categoryData);

        const checkInTypeQuery = query(collection(db, 'checkInTypes'), where('eventId', '==', eventData.id));
        const checkInTypeSnapshot = await getDocs(checkInTypeQuery);
        const checkInData = checkInTypeSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as CheckInTypeDefinition[];
        setCheckInTypes(checkInData);

        const participantQuery = query(collection(db, 'participants'), where('eventId', '==', eventData.id));
        const participantSnapshot = await getDocs(participantQuery);
        const participantData = participantSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          registeredAt: doc.data().registeredAt?.toDate() || new Date(),
        })) as Participant[];
        setParticipants(participantData);

      } else {
        setEvent(null);
        setParticipants([]);
        setCheckInTypes([]);
        setCheckInCategories([]);
      }
    } catch (error) {
      toast.error('Failed to fetch event data. Please refresh.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchEventAndParticipants();
  }, [fetchEventAndParticipants]);

  const handleExportToExcel = () => {
    if (!event) return;

    const dataToExport = participants.map(p => {
        const checkInData: {[key: string]: string} = {};
        checkInTypes.forEach(type => {
            const checkIn = p.checkIns.find(ci => ci.typeId === type.id);
            checkInData[`Scanned for: ${type.name}`] = checkIn 
                ? new Date(checkIn.timestamp).toLocaleString() 
                : 'No';
        });

        const registeredAtDate = p.registeredAt?.toDate ? p.registeredAt.toDate() : new Date(p.registeredAt);

        return {
            'Reg. No.': p.registrationNumber,
            'Full Name': p.fullName,
            'Email': p.email,
            'Phone': p.phone,
            'Category': p.category,
            'Registered At': registeredAtDate.toLocaleString(),
            ...checkInData,
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

    XLSX.writeFile(workbook, `${event.name.replace(/\s+/g, '_')}_Participants.xlsx`);
    toast.success("Participant data exported successfully!");
};


  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEvent.categories.some((cat) => !cat.name.trim())) {
      toast.error('Please provide a name for all categories.');
      return;
    }
    setCreating(true);

    try {
      const uniqueId = uuidv4();
      const registrationLink = `${window.location.origin}/register/${uniqueId}`;

      const eventPayload = {
        organizerId: currentUser?.uid,
        name: newEvent.name,
        description: newEvent.description,
        categories: newEvent.categories,
        registrationLink,
        createdAt: serverTimestamp(),
        isActive: true,
      };

      const eventDoc = await addDoc(collection(db, 'events'), eventPayload);
      
      const defaultCategories = ["Food Scanning", "Kit Scanning", "Check-In / Check-Out"];
      for (const name of defaultCategories) {
        await addDoc(collection(db, 'checkInCategories'), {
          name,
          eventId: eventDoc.id,
          organizerId: currentUser?.uid,
          createdAt: serverTimestamp(),
        });
      }
      
      toast.success('Event created successfully!');
      setDialogOpen(false);
      await fetchEventAndParticipants();

    } catch (error) {
      toast.error('Failed to create event. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCheckInCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !event || !currentUser) {
        toast.error('Category name cannot be empty.');
        return;
    }
    setCreating(true);
    try {
        const categoryPayload = {
            name: newCategoryName,
            eventId: event.id,
            organizerId: currentUser.uid,
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'checkInCategories'), categoryPayload);
        
        const newCategory: CheckInCategory = {
            ...categoryPayload,
            id: docRef.id,
        };

        setCheckInCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
        toast.success('Check-in category created!');
    } catch (error) {
        toast.error('Failed to create category.');
    } finally {
        setCreating(false);
    }
  };

  const handleCreateCheckInType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckInTypeName.trim() || !event || !selectedCheckInCategoryId || !currentUser) {
        toast.error('Check-in type name and category are required.');
        return;
    }
    setCreating(true);
    try {
        const typePayload = {
            name: newCheckInTypeName,
            eventId: event.id,
            organizerId: currentUser.uid,
            categoryId: selectedCheckInCategoryId,
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'checkInTypes'), typePayload);

        const newType: CheckInTypeDefinition = {
            ...typePayload,
            id: docRef.id,
        };

        setCheckInTypes(prev => [...prev, newType]);
        setNewCheckInTypeName('');
        setSelectedCheckInCategoryId('');
        toast.success('Check-in type created successfully!');
    } catch (error) {
        toast.error('Failed to create check-in type.');
    } finally {
        setCreating(false);
    }
  };

  const handleDeleteCheckInType = async (typeId: string) => {
    try {
        await deleteDoc(doc(db, 'checkInTypes', typeId));
        setCheckInTypes(prev => prev.filter(t => t.id !== typeId));
        toast.success('Check-in type deleted successfully.');
    } catch (error) {
        toast.error('Failed to delete check-in type.');
    }
  };

    const handleDeleteCategory = async (categoryId: string) => {
    try {
        const typesInCategory = checkInTypes.filter(t => t.categoryId === categoryId);
        if (typesInCategory.length > 0) {
            toast.error('Cannot delete category with active check-in types.');
            return;
        }
        await deleteDoc(doc(db, 'checkInCategories', categoryId));
        setCheckInCategories(prev => prev.filter(c => c.id !== categoryId));
        toast.success('Category deleted successfully.');
    } catch (error) {
        toast.error('Failed to delete category.');
    }
  };

  const groupedCheckInTypes = useMemo(() => {
    return checkInCategories.map(category => ({
      ...category,
      types: checkInTypes.filter(type => type.categoryId === category.id)
    }));
  }, [checkInCategories, checkInTypes]);

  const addCategory = () => {
    if (newEvent.categories.length >= 8) {
      toast.warning('Maximum of 8 categories is allowed.');
      return;
    }
    setNewEvent({
      ...newEvent,
      categories: [
        ...newEvent.categories,
        {
          id: uuidv4(),
          name: '',
          color: CATEGORY_COLORS[newEvent.categories.length % CATEGORY_COLORS.length],
        },
      ],
    });
  };

  const removeCategory = (id: string) => {
    if (newEvent.categories.length <= 1) {
      toast.warning('At least one category is required.');
      return;
    }
    setNewEvent({
      ...newEvent,
      categories: newEvent.categories.filter((cat) => cat.id !== id),
    });
  };

  const updateCategory = (id: string, name: string) => {
    setNewEvent({
      ...newEvent,
      categories: newEvent.categories.map((cat) => (cat.id === id ? { ...cat, name } : cat)),
    });
  };

  const copyRegistrationLink = () => {
    if (event?.registrationLink) {
      navigator.clipboard.writeText(event.registrationLink);
      setCopied(true);
      toast.success('Registration link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats =
    checkInTypes.map((type) => ({
      id: type.id,
      name: type.name,
      count: participants.filter((p) => p.checkIns?.some((c) => c.typeId === type.id)).length,
    })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {event ? event.name : 'Organizer Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {event
              ? 'Manage your event, view participants, and track check-ins.'
              : 'Create an event to get started.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {event && (
            <>
              <Button variant="outline" onClick={handleExportToExcel} disabled={participants.length === 0} className="font-bold hidden sm:inline-flex">
                <FileDown className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Dialog open={checkInManagementDialogOpen} onOpenChange={setCheckInManagementDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="font-bold">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Check-ins
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-bold">Manage Check-in Types</DialogTitle>
                      <DialogDescription>Add or remove categories and check-in types for this event.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-4">
                      {/* Category Management */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><FolderPlus className="w-5 h-5 text-primary" /> Categories</h3>
                        <form onSubmit={handleCreateCheckInCategory} className="flex items-center gap-2">
                          <Input 
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New category name..."
                            required
                            className="font-bold"
                          />
                          <Button type="submit" disabled={creating} className="shrink-0 font-bold">
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                          </Button>
                        </form>
                        <ScrollArea className="rounded-lg border h-48">
                           {checkInCategories.length === 0 && (
                              <div className="text-center text-muted-foreground h-full flex items-center justify-center p-4 font-bold">No categories created.</div>
                           )}
                           <Table>
                            <TableBody>
                               {checkInCategories.map((cat) => (
                                <TableRow key={cat.id}>
                                  <TableCell className="font-bold">{cat.name}</TableCell>
                                  <TableCell className="text-right">
                                    <Dialog>
                                      <DialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle className="font-bold">Delete Category?</DialogTitle>
                                          <DialogDescription>
                                            Are you sure you want to delete "{cat.name}"? This action cannot be undone. You must delete all check-in types within this category first.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                          <DialogClose asChild><Button variant="outline" className="font-bold">Cancel</Button></DialogClose>
                                          <Button variant="destructive" className="font-bold" onClick={() => handleDeleteCategory(cat.id)}>Delete</Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </TableCell>
                                </TableRow>
                               ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                      
                      {/* Check-in Type Management */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" /> Check-in Types</h3>
                         <form onSubmit={handleCreateCheckInType} className="space-y-3">
                            <Input 
                                value={newCheckInTypeName}
                                onChange={(e) => setNewCheckInTypeName(e.target.value)}
                                placeholder="New check-in type name..."
                                required
                                className="font-bold"
                            />
                             <Select value={selectedCheckInCategoryId} onValueChange={setSelectedCheckInCategoryId} required>
                                <SelectTrigger className="font-bold"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>
                                {checkInCategories.map(cat => <SelectItem className="font-bold" key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button type="submit" disabled={creating || !selectedCheckInCategoryId} className="w-full font-bold">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Check-in Type'}
                            </Button>
                        </form>
                      </div>
                    </div>
                    
                    <Separator className="my-2" />

                    <h3 className="font-bold text-lg mb-2">Existing Check-in Types</h3>
                    <ScrollArea className="border rounded-lg h-56">
                       {groupedCheckInTypes.length === 0 ? (
                         <div className="text-center text-muted-foreground p-8 flex items-center justify-center h-full font-bold">No check-in types created.</div>
                       ) : (
                         groupedCheckInTypes.map(category => (
                          <div key={category.id} className="p-2">
                            <h4 className="font-bold text-base px-2 py-1 text-muted-foreground">{category.name}</h4>
                             <Table>
                              <TableBody>
                                {category.types.length === 0 ? (
                                   <TableRow><TableCell className="text-muted-foreground text-sm italic pl-4 font-bold">No types in this category.</TableCell></TableRow>
                                ) : category.types.map(type => (
                                    <TableRow key={type.id}>
                                      <TableCell className="font-bold">{type.name}</TableCell>
                                      <TableCell className="text-right">
                                        <Dialog>
                                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle className="font-bold">Delete Check-in Type?</DialogTitle>
                                              <DialogDescription>Are you sure you want to delete "{type.name}"? This cannot be undone.</DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                              <DialogClose asChild><Button variant="outline" className="font-bold">Cancel</Button></DialogClose>
                                              <Button variant="destructive" className="font-bold" onClick={() => handleDeleteCheckInType(type.id)}>Delete</Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                }
                              </TableBody>
                            </Table>
                          </div>
                         ))
                       )}
                    </ScrollArea>

                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="font-bold">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchEventAndParticipants}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="sr-only">Refresh Data</span>
              </Button>
            </>
          )}
          {!event && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="font-bold">
                  <Calendar className="w-4 h-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-bold">Create New Event</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create your event.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventName" className="font-bold">Event Name</Label>
                    <Input
                      id="eventName"
                      placeholder="e.g., Annual Tech Summit 2024"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      required
                      className="font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-bold">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="A brief summary of your event"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="font-bold"
                    />
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Participant Categories</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCategory} className="font-bold">
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                    <ScrollArea className="space-y-2 max-h-48 p-1">
                      {newEvent.categories.map((cat, index) => (
                        <div key={cat.id} className="flex items-center gap-2 pr-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <Input
                            placeholder={`Category ${index + 1} (e.g., VIP)`}
                            value={cat.name}
                            onChange={(e) => updateCategory(cat.id, e.target.value)}
                            required
                            className="font-bold"
                          />
                          {newEvent.categories.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCategory(cat.id)}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" variant="default" className="w-full font-bold" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Event'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {event ? (
        <>
          <Card>
            <CardContent className="p-4 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Public Registration Link</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {event.registrationLink}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={copyRegistrationLink} className="shrink-0 w-full sm:w-auto mt-3 sm:mt-0 font-bold">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </CardContent>
          </Card>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 pb-4">
                <Card className="shrink-0 w-48">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold">Registered</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold">{participants.length}</div>
                    </CardContent>
                </Card>
                {stats.map((stat) => (
                    <Card key={stat.id} className="shrink-0 w-48">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold truncate">{stat.name}</CardTitle>
                        <Ticket className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stat.count}</div>
                    </CardContent>
                    </Card>
                ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <ParticipantList participants={participants} event={event} checkInTypes={checkInTypes} onRefresh={fetchEventAndParticipants} />
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Event Found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">You haven't created an event yet. Create one to get started with registrations and check-ins.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizerDashboard;
