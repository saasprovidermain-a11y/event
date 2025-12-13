import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Participant, Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, User, Mail, Phone, Calendar, Check, X, Ticket, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface ParticipantCardProps {
  participant: Participant;
  event: Event;
}

export const ParticipantCard = ({ participant, event }: ParticipantCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `${participant.fullName.replace(/\s+/g, '_')}_ID_Card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('ID Card downloaded!');
    } catch (err) {
      toast.error('Failed to download ID Card');
    }
  };

  const getCheckInStatus = (typeId: string) => {
    const checkIn = participant.checkIns?.find((c) => c.typeId === typeId);
    return checkIn;
  };

  return (
    <div className="space-y-4">
      {/* ID Card */}
      <div 
        ref={cardRef}
        className="id-card bg-gradient-to-br from-card via-card to-muted/30 rounded-xl p-6 shadow-lg border"
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

        <div className="flex gap-4">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <QRCodeSVG 
              value={participant.qrCode}
              size={100}
              level="H"
              includeMargin={false}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{participant.fullName}</span>
            </div>
             <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reg. No: {participant.registrationNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{participant.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{participant.phone}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            Registered: {new Date(participant.registeredAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={downloadCard}>
        <Download className="w-4 h-4" />
        Download ID Card
      </Button>

      <Separator />

      {/* Check-in Status */}
      <div>
        <h4 className="font-semibold mb-3">Check-in Status</h4>
        <div className="space-y-2">
          {event.checkInTypes.map((type) => {
            const checkIn = getCheckInStatus(type.id);
            return (
              <div 
                key={type.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  checkIn ? 'bg-accent/10' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    checkIn ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Ticket className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{type.name}</span>
                </div>
                <div className="text-right">
                  {checkIn ? (
                    <div className="flex items-center gap-2 text-accent">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(checkIn.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <X className="w-4 h-4" />
                      <span className="text-sm">Not yet</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
