
import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Participant, Event, CheckInTypeDefinition } from '@/types';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Hash } from 'lucide-react';

interface ParticipantCardProps {
  participant: Participant;
  event: Event;
  checkInTypes: CheckInTypeDefinition[];
}

export const ParticipantCard = forwardRef<HTMLDivElement, ParticipantCardProps>(({ participant, event }, ref) => {

  const getFormattedDate = (date: any) => {
    if (!date) return 'N/A';
    // Firestore Timestamp objects have toDate(), but JS Dates do not.
    const dateObj = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleString([], {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };


  return (
      <div 
        ref={ref}
        className="id-card bg-card rounded-xl p-6 shadow-lg border w-[400px]"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider">Event Pass</p>
            <h3 className="text-lg font-bold text-foreground">{event.name}</h3>
          </div>
          <Badge 
            className="text-xs"
            style={{ 
              backgroundColor: participant.categoryColor,
              color: '#fff' 
            }}
          >
            {participant.category}
          </Badge>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <QRCodeSVG 
              value={participant.qrCode}
              size={100}
              level="H"
              includeMargin={false}
            />
          </div>
          
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{participant.fullName}</span>
            </div>
             <div className="flex items-center gap-3 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-mono">{participant.registrationNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground break-all">{participant.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{participant.phone}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            Registered: {getFormattedDate(participant.registeredAt)}
          </p>
        </div>
      </div>
  );
});
ParticipantCard.displayName = 'ParticipantCard';
