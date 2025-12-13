'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Event, EventCategory, Participant, CheckInTypeDefinition } from '@/types';
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
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    categories: [{ id: uuidv4(), name: '', color: CATEGORY_COLORS[0] }] as EventCategory[],
    checkInTypes: [
      { id: uuidv4(), name: 'Event Check-in' },
      { id: uuidv4(), name: 'Event Check-out' },
    ] as CheckInTypeDefinition[],
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

        const participantQuery = query(
          collection(db, 'participants'),
          where('eventId', '==', eventData.id),
        );
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEvent.categories.some((cat) => !cat.name.trim())) {
      toast.error('Please provide a name for all categories.');
      return;
    }
    if (newEvent.checkInTypes.some((type) => !type.name.trim())) {
      toast.error('Please provide a name for all check-in types.');
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
        checkInTypes: newEvent.checkInTypes,
        registrationLink,
        createdAt: new Date(),
        isActive: true,
      };

      const eventDoc = await addDoc(collection(db, 'events'), eventPayload);

      setEvent({ ...eventPayload, id: eventDoc.id });
      toast.success('Event created successfully!');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create event. Please try again.');
    } finally {
      setCreating(false);
    }
  };

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

  const addCheckInType = () => {
    if (newEvent.checkInTypes.length >= 8) {
      toast.warning('Maximum of 8 check-in types is allowed.');
      return;
    }
    setNewEvent({
      ...newEvent,
      checkInTypes: [...newEvent.checkInTypes, { id: uuidv4(), name: '' }],
    });
  };

  const removeCheckInType = (id: string) => {
    if (newEvent.checkInTypes.length <= 1) {
      toast.warning('At least one check-in type is required.');
      return;
    }
    setNewEvent({
      ...newEvent,
      checkInTypes: newEvent.checkInTypes.filter((type) => type.id !== id),
    });
  };

  const updateCheckInType = (id: string, name: string) => {
    setNewEvent({
      ...newEvent,
      checkInTypes: newEvent.checkInTypes.map((type) => (type.id === id ? { ...type, name } : type)),
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
    event?.checkInTypes.map((type) => ({
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
          <h1 className="text-3xl font-sans font-bold text-foreground">
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
          )}
          {!event && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="default" className="w-full sm:w-auto">
                  <Calendar className="w-4 h-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create your event.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input
                      id="eventName"
                      placeholder="e.g., Annual Tech Summit 2024"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="A brief summary of your event"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Participant Categories</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                      {newEvent.categories.map((cat, index) => (
                        <div key={cat.id} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <Input
                            placeholder={`Category ${index + 1} (e.g., VIP)`}
                            value={cat.name}
                            onChange={(e) => updateCategory(cat.id, e.target.value)}
                            required
                          />
                          {newEvent.categories.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCategory(cat.id)}
                              className="shrink-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Check-in Types */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Check-in Types</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCheckInType}>
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                      {newEvent.checkInTypes.map((type, index) => (
                        <div key={type.id} className="flex items-center gap-2">
                          <Input
                            placeholder={`Check-in ${index + 1} (e.g., Lunch)`}
                            value={type.name}
                            onChange={(e) => updateCheckInType(type.id, e.target.value)}
                            required
                          />
                          {newEvent.checkInTypes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCheckInType(type.id)}
                              className="shrink-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" variant="gradient" className="w-full" disabled={creating}>
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
          <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-blue-600/5">
            <CardContent className="p-4 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Public Registration Link</p>
                  <p className="text-sm truncate">
                    {event.registrationLink.replace(/^(https?:\/\/)/, '')}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={copyRegistrationLink} className="shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </CardContent>
          </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Registered</CardTitle>
                  <Users className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{participants.length}</div>
                </CardContent>
              </Card>
              {stats.map((stat) => (
                <Card key={stat.id} className="border-0 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                    <Ticket className="w-5 h-5 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.count}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <ParticipantList participants={participants} event={event} onRefresh={fetchEventAndParticipants} />
        </>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Event Found</h3>
            <p className="text-muted-foreground mb-6">You haven't created an event yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizerDashboard;
