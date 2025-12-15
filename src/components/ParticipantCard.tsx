import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Participant, Event, CheckInTypeDefinition } from '@/types';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Hash, Calendar } from 'lucide-react';

interface ParticipantCardProps {
  participant: Participant;
  event: Event;
  checkInTypes: CheckInTypeDefinition[];
}

export const ParticipantCard = forwardRef<HTMLDivElement, ParticipantCardProps>(({ participant, event }, ref) => {

  const getFormattedDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  };

  return (
      <div 
        ref={ref}
        className="id-card bg-card rounded-xl p-6 border border-border/50 w-[400px] text-foreground shadow-lg font-bold"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Event Pass</p>
            <h3 className="text-lg font-bold">{event.name}</h3>
          </div>
          <Badge 
            className="text-xs font-bold"
            style={{ 
              backgroundColor: participant.categoryColor,
              color: '#000'
            }}
          >
            {participant.category}
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-white p-2.5 rounded-md shadow-md qr-code-container">
            <QRCodeSVG 
              value={participant.qrCode}
              size={90}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
              includeMargin={false}
            />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-bold text-lg">{participant.fullName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-bold">{participant.registrationNumber}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-dashed">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground break-all font-bold">{participant.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm mt-2">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-bold">{participant.phone}</span>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Registered: {getFormattedDate(participant.registeredAt)}</span>
            </div>
        </div>
      </div>
  );
});
ParticipantCard.displayName = 'ParticipantCard';
