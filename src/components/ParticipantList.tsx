import { useState, useRef, useMemo, useEffect } from 'react';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search, Users, Grid, List, Eye, Ticket, Download
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

const PARTICIPANTS_PER_PAGE = 10;

const ParticipantList = ({ participants, event, checkInTypes, onRefresh }: ParticipantListProps) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
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
      return timeB - timeA;
    });
  }, [participants, search, categoryFilter]);


  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const totalPages = Math.ceil(filteredParticipants.length / PARTICIPANTS_PER_PAGE);

  const paginatedParticipants = useMemo(() => {
    const startIndex = (currentPage - 1) * PARTICIPANTS_PER_PAGE;
    return filteredParticipants.slice(startIndex, startIndex + PARTICIPANTS_PER_PAGE);
  }, [filteredParticipants, currentPage]);


  const getCheckInStatus = (participant: Participant, typeId: string) => {
    return participant.checkIns?.find((c) => c.typeId === typeId);
  };

  const downloadPng = async () => {
    if (!cardRef.current || !selectedParticipant) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#1c2532',
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${selectedParticipant.fullName.replace(/\s+/g, '_')}_ID_Card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('ID Card downloaded as PNG!');
    } catch (err) {
      toast.error('Failed to download ID Card');
    }
  };

  const renderParticipantDetails = (participant: Participant) => {
    const successfulCheckIns = participant.checkIns?.filter(Boolean) || [];

    return (
      <ScrollArea className="max-h-[75vh] pr-4">
        <div className="space-y-6">
          <div ref={cardRef} className='pb-1'>
            <ParticipantCard
              participant={participant}
              event={event}
              checkInTypes={checkInTypes}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="w-full font-bold" onClick={downloadPng}>
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
          </div>

          <Separator />

          {/* Check-in Status */}
          <div>
            <h4 className="font-bold mb-3">Scanned Status</h4>
            <div className="space-y-2">
              {successfulCheckIns.length > 0 ? (
                successfulCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.typeId}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/10 text-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent/20">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold">Scanned for {checkIn.typeName}</p>
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
                <div className="text-center text-sm text-muted-foreground py-6 border border-dashed rounded-lg">
                  No scans recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-bold">
              <Users className="w-5 h-5" />
              Participants
            </CardTitle>
            <CardDescription className='font-bold'>{paginatedParticipants.length} of {filteredParticipants.length} participants shown</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('table')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Table View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'cards' ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('cards')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Card View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 font-bold"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 font-bold">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className='font-bold'>All Categories</SelectItem>
              {event.categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name} className='font-bold'>
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
          <div className="text-center py-20 border border-dashed rounded-lg">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold">No participants found</h3>
            <p className="text-muted-foreground mt-1">
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
                    <TableHead className='font-bold'>Reg. No.</TableHead>
                    <TableHead className='font-bold'>Participant</TableHead>
                    <TableHead className="hidden md:table-cell font-bold">Email</TableHead>
                    <TableHead className="hidden lg:table-cell font-bold">Phone</TableHead>
                    <TableHead className='font-bold'>Category</TableHead>
                    <TableHead className="text-center font-bold">Check-ins</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="text-muted-foreground text-xs font-bold">{participant.registrationNumber}</TableCell>
                      <TableCell className="font-bold">{participant.fullName}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell font-bold">{participant.email}</TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell font-bold">{participant.phone}</TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: participant.categoryColor,
                            color: '#000'
                          }}
                          className='font-bold'
                        >
                          {participant.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          {checkInTypes.map((type) => (
                            <Tooltip key={type.id}>
                              <TooltipTrigger>
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${getCheckInStatus(participant, type.id)
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-muted/50 text-muted-foreground'
                                    }`}
                                >
                                  <Ticket className="w-3.5 h-3.5" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className='font-bold'>{type.name}</p>
                                <p className="text-xs text-muted-foreground font-bold">
                                  {getCheckInStatus(participant, type.id) ? 'Checked-in' : 'Pending'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className='font-bold'>Participant Details</DialogTitle>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <TooltipProvider>
              {paginatedParticipants.map((participant) => (
                <Dialog key={participant.id} open={selectedParticipant?.id === participant.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedParticipant(null) }}>
                  <DialogTrigger asChild>
                    <div
                      className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedParticipant(participant)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold">{participant.fullName}</h4>
                          <p className="text-sm text-muted-foreground font-bold">{participant.registrationNumber}</p>
                        </div>
                        <Badge
                           style={{
                            backgroundColor: participant.categoryColor,
                            color: '#000'
                          }}
                          className='font-bold'
                        >
                          {participant.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {checkInTypes.map((type) => (
                          <Tooltip key={type.id}>
                            <TooltipTrigger>
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${getCheckInStatus(participant, type.id)
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-muted/50 text-muted-foreground'
                                  }`}
                              >
                                <Ticket className="w-3.5 h-3.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent><p className='font-bold'>{type.name}</p></TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className='font-bold'>Participant Details</DialogTitle>
                    </DialogHeader>
                    {selectedParticipant && renderParticipantDetails(selectedParticipant)}
                  </DialogContent>
                </Dialog>
              ))}
            </TooltipProvider>
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
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
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
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )}
    </Card>
  );
};
export default ParticipantList;
