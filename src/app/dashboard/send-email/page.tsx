'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Participant, Event, CheckInTypeDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, Mail, Users, Loader2, Send, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { ParticipantCard } from '@/components/ParticipantCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';


const PARTICIPANTS_PER_PAGE = 10;

const SendEmailPage = () => {
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkInTypes, setCheckInTypes] = useState<CheckInTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' });

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

        const checkInTypeQuery = query(collection(db, 'checkInTypes'), where('eventId', '==', eventData.id));
        const checkInTypeSnapshot = await getDocs(checkInTypeQuery);
        const checkInData = checkInTypeSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as CheckInTypeDefinition[];
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
      }
    } catch (error) {
      toast.error('Failed to fetch data. Please refresh.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchEventAndParticipants();
  }, [fetchEventAndParticipants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const searchTerm = search.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(searchTerm) ||
        p.email.toLowerCase().includes(searchTerm) ||
        p.phone.includes(searchTerm) ||
        p.registrationNumber?.toLowerCase().includes(searchTerm)
      );
    });
  }, [participants, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredParticipants.length / PARTICIPANTS_PER_PAGE);

  const paginatedParticipants = useMemo(() => {
    const startIndex = (currentPage - 1) * PARTICIPANTS_PER_PAGE;
    return filteredParticipants.slice(startIndex, startIndex + PARTICIPANTS_PER_PAGE);
  }, [filteredParticipants, currentPage]);


  const handlePreviewEmail = (participant: Participant) => {
    setSelectedParticipant(participant);
    if (event) {
      setEmailContent({
          subject: `Congratulations on completing ${event.name}!`,
          body: `Dear ${participant.fullName},\n\nCongratulations on successfully completing the ${event.name}! We hope you had a great experience and look forward to seeing you at our future events.\n\nPlease find your digital certificate of completion attached.\n\nBest regards,\nThe EventManager Team`
      });
    }
    setPreviewDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedParticipant || !emailContent.subject || !emailContent.body || !event) return;

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
        const errorMessage = "EmailJS is not configured. Please ensure Service ID, Template ID, and Public Key are in your .env.local file and the server has been restarted.";
        toast.error("Configuration Error", { description: errorMessage });
        console.error(errorMessage);
        return;
    }
    
    setSendingEmail(selectedParticipant.id);

    try {
        const cardElement = document.getElementById(`participant-card-${selectedParticipant.id}`);
        if (!cardElement) throw new Error("Participant card element not found. Cannot generate certificate.");

        const canvas = await html2canvas(cardElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: null
        });
        const certificateAttachment = canvas.toDataURL('image/png');

        const emailBodyHtml = emailContent.body.replace(/\n/g, '<br>');

        const templateParams = {
            to_name: selectedParticipant.fullName,
            to_email: selectedParticipant.email,
            subject: emailContent.subject,
            message_html: emailBodyHtml,
            certificate_attachment: certificateAttachment,
        };

        await emailjs.send(serviceId, templateId, templateParams, publicKey);

        toast.success(`Email sent successfully to ${selectedParticipant.fullName}.`);
        
    } catch (error: any) {
        console.error('Email sending error:', error);
        const errorText = error?.text || 'An unknown error occurred.';
        toast.error('Failed to Send Email', {
          description: `Error from EmailJS: ${errorText}. Please check your EmailJS configuration and template variables.`,
        });
    } finally {
        setSendingEmail(null);
        setPreviewDialogOpen(false);
        setSelectedParticipant(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Send Completion Emails</h1>
        <p className="text-muted-foreground mt-1">You must create an event before you can use this feature.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Send Completion Emails</h1>
        <p className="text-muted-foreground mt-1">Send event completion certificates to participants.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 font-bold">
                <Users className="w-5 h-5" />
                Participants
              </CardTitle>
              <CardDescription className='font-bold'>{paginatedParticipants.length} of {filteredParticipants.length} participants shown</CardDescription>
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 font-bold"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-lg">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold">No participants found</h3>
              <p className="text-muted-foreground mt-1">
                {participants.length === 0 ? 'No one has registered for your event yet.' : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold flex items-center gap-2"><Hash className="w-4 h-4"/>Reg. No.</TableHead>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="hidden md:table-cell font-bold">Email</TableHead>
                    <TableHead className="hidden lg:table-cell font-bold">Phone</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="text-right font-bold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="text-xs text-muted-foreground font-bold">{participant.registrationNumber}</TableCell>
                      <TableCell className="font-bold">{participant.fullName}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell font-bold">{participant.email}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell font-bold">{participant.phone}</TableCell>
                      <TableCell>
                        <Badge
                           style={{ 
                            backgroundColor: participant.categoryColor,
                            color: '#000',
                          }}
                          className="font-bold"
                        >
                          {participant.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className='font-bold'
                          onClick={() => handlePreviewEmail(participant)}
                        >
                          <Mail className="w-4 h-4" />
                          Send Email
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
            <div className="p-4 border-t">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage((prev) => Math.max(prev - 1, 1));
                            }}
                            aria-disabled={currentPage === 1}
                            className={cn(currentPage === 1 ? 'pointer-events-none opacity-50' : undefined, 'font-bold')}
                        />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="text-sm font-bold">
                                Page {currentPage} of {totalPages}
                            </span>
                        </PaginationItem>
                        <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                            }}
                            aria-disabled={currentPage === totalPages}
                            className={cn(currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined, 'font-bold')}
                        />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        )}
      </Card>
      
      {selectedParticipant && (
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className='font-bold'>Email Preview</DialogTitle>
              <DialogDescription>
                You are about to send a completion certificate to <span className="font-bold text-foreground">{selectedParticipant.fullName}</span>.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[65vh] pr-6 -mr-2">
              <div className="space-y-6">
                <div>
                    <h3 className="text-base font-bold mb-2 text-muted-foreground">Certificate Preview</h3>
                    <div className="flex justify-center rounded-lg overflow-hidden">
                      {/* This div is used by html2canvas */}
                      <div id={`participant-card-${selectedParticipant.id}`}>
                        <ParticipantCard 
                            participant={selectedParticipant}
                            event={event}
                            checkInTypes={checkInTypes}
                        />
                      </div>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-base font-bold mb-2 text-muted-foreground">Email Content</h3>
                    <div className="p-4 border rounded-md bg-secondary text-sm space-y-2">
                      <p><span className="font-bold text-muted-foreground">To:</span> {selectedParticipant.email}</p>
                      <p><span className="font-bold text-muted-foreground">Subject:</span> {emailContent.subject}</p>
                      <hr className="my-2 border-border/50"/>
                      <p className='whitespace-pre-wrap font-bold'>{emailContent.body}</p>
                    </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className='pt-4'>
              <DialogClose asChild>
                <Button variant="outline" disabled={!!sendingEmail} className='font-bold'>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSendEmail} disabled={!!sendingEmail} className='font-bold'>
                {sendingEmail === selectedParticipant.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm & Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SendEmailPage;
