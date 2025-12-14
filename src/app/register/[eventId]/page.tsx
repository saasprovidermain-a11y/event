

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event, Participant, CheckInTypeDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Loader2, CheckCircle, AlertCircle, User, Mail, Phone, Tag, Home, Download } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { ParticipantCard } from '@/components/ParticipantCard';
import html2canvas from 'html2canvas';

const PublicRegistrationPage = () => {
  const params = useParams();
  const eventId = params.eventId;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [checkInTypes, setCheckInTypes] = useState<CheckInTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [newParticipant, setNewParticipant] = useState<Participant | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    category: '',
  });

  useEffect(() => {
    if (!eventId) return;
  
    const fetchEvent = async () => {
      try {
        const registrationLink = `${window.location.origin}/register/${eventId}`;
        const eventQuery = query(
          collection(db, 'events'),
          where('registrationLink', '==', registrationLink)
        );
        const snapshot = await getDocs(eventQuery);
        
        if (!snapshot.empty) {
          const eventData = {
            ...snapshot.docs[0].data(),
            id: snapshot.docs[0].id,
          } as Event;
          setEvent(eventData);

          const checkInTypeQuery = query(collection(db, 'checkInTypes'), where('eventId', '==', eventData.id));
          const checkInTypeSnapshot = await getDocs(checkInTypeQuery);
          const checkInData = checkInTypeSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as CheckInTypeDefinition[];
          setCheckInTypes(checkInData);

        } else {
          setError('This registration link is invalid or has expired.');
        }
      } catch (err) {
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const duplicateCheck = query(
        collection(db, 'participants'),
        where('eventId', '==', event.id),
        where('email', '==', formData.email.toLowerCase().trim())
      );
      const duplicateSnapshot = await getDocs(duplicateCheck);
      
      if (!duplicateSnapshot.empty) {
        toast.error('This email is already registered for the event.');
        setSubmitting(false);
        return;
      }

      const selectedCategory = event.categories.find(cat => cat.id === formData.category);
      if (!selectedCategory) {
        toast.error('Please select a valid category.');
        setSubmitting(false);
        return;
      }

      const participantId = uuidv4();
      const registrationNumber = `REG-${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;

      const participantData: Omit<Participant, 'id'> = {
        eventId: event.id,
        organizerId: event.organizerId,
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        category: selectedCategory.name,
        categoryColor: selectedCategory.color,
        registeredAt: new Date(),
        qrCode: participantId,
        checkIns: [],
        registrationNumber,
      };

      const docRef = await addDoc(collection(db, 'participants'), participantData);
      setNewParticipant({ ...participantData, id: docRef.id });
      setSuccess(true);
      toast.success('Registration successful! We look forward to seeing you.');
    } catch (err) {
      console.error(err)
      toast.error('Registration failed. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1c2532' : '#ffffff',
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${newParticipant?.fullName.replace(/\s+/g, '_')}_ID_Card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('ID Card downloaded!');
    } catch (err) {
      toast.error('Failed to download ID Card');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0">
          <CardContent className="py-12">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Registration Unavailable</h2>
            <p className="text-muted-foreground">{error || 'The event you are looking for could not be found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && newParticipant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <Card className="w-full max-w-md text-center shadow-xl border-0 animate-scale-in">
          <CardHeader>
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-2xl font-sans font-bold mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground">
              Thank you for registering for <span className="font-medium text-foreground">{event.name}</span>.
              You can download your ID card now.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="fixed -left-[9999px] top-0 p-1">
              <div ref={cardRef}>
                <ParticipantCard 
                  participant={newParticipant} 
                  event={event} 
                  checkInTypes={checkInTypes} 
                />
              </div>
            </div>
            <Button variant="gradient" size="lg" className="w-full" onClick={downloadCard}>
                <Download className="w-5 h-5" />
                Download ID Card
            </Button>
            <Link href="/">
                <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Homepage
                </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-lg relative animate-scale-in shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-sans">{event.name}</CardTitle>
          {event.description && (
            <CardDescription className="text-base">{event.description}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                Registration Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your category" />
                </SelectTrigger>
                <SelectContent>
                  {event.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={submitting || !formData.category}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicRegistrationPage;
