

import { useState, useRef } from 'react';
import { Event, Participant, CheckInTypeDefinition } from '@/types';
import { ParticipantCard } from '@/components/ParticipantCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Search, Users, Grid, List, Eye, Ticket, Download, Check, X
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { ScrollArea } from './ui/scroll-area';

interface ParticipantListProps {
  participants: Participant[];
  event: Event;
  checkInTypes: CheckInTypeDefinition[];
  onRefresh: () => void;
}

const ParticipantList = ({ participants, event, checkInTypes, onRefresh }: ParticipantListProps) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const getFormattedDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      (p.registrationNumber && p.registrationNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const timeA = a.registeredAt?.toDate ? a.registeredAt.toDate().getTime() : new Date(a.registeredAt).getTime();
    const timeB = b.registeredAt?.toDate ? b.registeredAt.toDate().getTime() : new Date(b.registeredAt).getTime();
    return timeA - timeB;
  });

  const getCheckInStatus = (participant: Participant, typeId: string) => {
    return participant.checkIns?.find((c) => c.typeId === typeId);
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1c2532' : '#ffffff',
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${selectedParticipant?.fullName.replace(/\s+/g, '_')}_ID_Card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('ID Card downloaded!');
    } catch (err) {
      toast.error('Failed to download ID Card');
    }
  };

  const renderParticipantDetails = (participant: Participant) => {
    const successfulCheckIns = participant.checkIns?.filter(Boolean) || [];

    return (
        <div className="space-y-4">
            <ScrollArea className="h-[55vh] pr-4">
                <div ref={cardRef} className='pb-5'>
                    <ParticipantCard
                        participant={participant}
                        event={event}
                        checkInTypes={checkInTypes}
                    />
                </div>

                <Button variant="outline" className="w-full mb-5" onClick={downloadCard}>
                    <Download className="w-4 h-4 mr-2" />
                    Download ID Card
                </Button>

                <Separator />

                {/* Check-in Status */}
                <div>
                    <h4 className="font-semibold mb-3 mt-2">Scanned Status</h4>
                    <div className="space-y-2">
                        {successfulCheckIns.length > 0 ? (
                            successfulCheckIns.map((checkIn) => (
                                <div
                                    key={checkIn.typeId}
                                    className="flex items-center justify-between p-3 rounded-lg bg-accent/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent/20 text-accent">
                                            <Ticket className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-accent">Scanned for {checkIn.typeName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(checkIn.timestamp).toLocaleString([], {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground py-4">
                                No scans recorded yet.
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
  };


  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants
            </CardTitle>
            <CardDescription>{filteredParticipants.length} of {participants.length} participants</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('cards')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {event.categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
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
      </CardHeader>

      <CardContent>
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No participants found</h3>
            <p className="text-muted-foreground">
              {participants.length === 0
                ? 'Share your registration link to get participants'
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">S.No.</TableHead>
                    <TableHead>Reg. No.</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Check-ins</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant, index) => (
                    <TableRow key={participant.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{participant.registrationNumber}</TableCell>
                      <TableCell className="font-medium">{participant.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{participant.email}</TableCell>
                      <TableCell className="text-muted-foreground">{participant.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: participant.categoryColor,
                            backgroundColor: `${participant.categoryColor}10`,
                            color: participant.categoryColor
                          }}
                        >
                          {participant.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {checkInTypes.map((type) => (
                            <Tooltip key={type.id}>
                              <TooltipTrigger>
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${getCheckInStatus(participant, type.id)
                                    ? 'bg-accent/20 text-accent'
                                    : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                  <Ticket className="w-3.5 h-3.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{type.name}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right ">
                        <Dialog open={selectedParticipant?.id === participant.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedParticipant(null) }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedParticipant(participant)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent
                            className="
                              max-w-md
                              max-h-[85vh]
                              p-6
                              overflow-hidden
                            "                          >

                            <DialogHeader>
                              <DialogTitle>Participant Details</DialogTitle>
                            </DialogHeader>
                            {selectedParticipant && renderParticipantDetails(selectedParticipant)}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TooltipProvider>
              {filteredParticipants.map((participant) => (
                <Dialog key={participant.id} open={selectedParticipant?.id === participant.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedParticipant(null) }}>
                  <DialogTrigger asChild>
                    <div
                      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedParticipant(participant)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{participant.fullName}</h4>
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                          <p className="text-sm text-muted-foreground">{participant.phone}</p>
                          <p className="text-sm text-muted-foreground font-mono">{participant.registrationNumber}</p>
                        </div>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: participant.categoryColor,
                            backgroundColor: `${participant.categoryColor}10`,
                            color: participant.categoryColor
                          }}
                        >
                          {participant.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {checkInTypes.map((type) => (
                          <Tooltip key={type.id}>
                            <TooltipTrigger>
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${getCheckInStatus(participant, type.id)
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-muted text-muted-foreground'
                                  }`}
                              >
                                <Ticket className="w-3.5 h-3.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{type.name}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Participant Details</DialogTitle>
                    </DialogHeader>
                    {selectedParticipant && renderParticipantDetails(selectedParticipant)}
                  </DialogContent>
                </Dialog>
              ))}
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default ParticipantList;
