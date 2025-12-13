import { useState } from 'react';
import { Event, Participant } from '@/types';
import { ParticipantCard } from '@/components/ParticipantCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, Users, Grid, List, Eye, Ticket, Phone
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ParticipantListProps {
  participants: Participant[];
  event: Event;
  onRefresh: () => void;
}

const ParticipantList = ({ participants, event, onRefresh }: ParticipantListProps) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = 
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.registrationNumber.toString().includes(search);
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.registrationNumber - b.registrationNumber);

  const getCheckInStatus = (participant: Participant, typeId: string) => {
    return participant.checkIns?.some((c) => c.typeId === typeId);
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
                  <TableHead className="w-[60px]">Reg. No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Check-ins</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                     <TableCell className="font-mono text-muted-foreground">{participant.registrationNumber.toString().padStart(3, '0')}</TableCell>
                    <TableCell className="font-medium">{participant.fullName}</TableCell>
                    <TableCell className="hidden md:table-cell">{participant.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{participant.phone}</TableCell>
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
                        {event.checkInTypes.map((type) => (
                          <Tooltip key={type.id}>
                            <TooltipTrigger>
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  getCheckInStatus(participant, type.id)
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
                    <TableCell className="text-right">
                      <Dialog>
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
                            <DialogTitle>Participant Details</DialogTitle>
                          </DialogHeader>
                          {selectedParticipant && (
                            <ParticipantCard 
                              participant={selectedParticipant} 
                              event={event}
                            />
                          )}
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
              <Dialog key={participant.id}>
                <DialogTrigger asChild>
                  <div 
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedParticipant(participant)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{participant.fullName}</h4>
                        <p className="text-sm text-muted-foreground">{participant.email}</p>
                         <p className="text-sm text-muted-foreground">Reg. No: {participant.registrationNumber}</p>
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
                      {event.checkInTypes.map((type) => (
                        <Tooltip key={type.id}>
                          <TooltipTrigger>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                getCheckInStatus(participant, type.id)
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
                  {selectedParticipant && (
                    <ParticipantCard 
                      participant={selectedParticipant} 
                      event={event}
                    />
                  )}
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
