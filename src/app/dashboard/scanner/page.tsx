'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Participant, Event, CheckInTypeDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  AlertTriangle,
  Camera,
  RefreshCw,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  Ticket,
  Maximize,
  Minimize,
} from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';
import { cn } from '@/lib/utils';

const QRScannerPage = () => {
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Participant | null>(null);
  const [scanResult, setScanResult] = useState<'success' | 'duplicate' | 'not-found' | null>(null);
  const [scanMessage, setScanMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!currentUser) return;
      try {
        const eventQuery = query(collection(db, 'events'), where('organizerId', '==', currentUser.uid));
        const snapshot = await getDocs(eventQuery);
        if (!snapshot.empty) {
          const eventData = snapshot.docs[0].data() as Event;
          setEvent(eventData);
          if (eventData.checkInTypes?.length > 0) {
            setSelectedTypeId(eventData.checkInTypes[0].id);
          }
        }
      } catch (error) {
        toast.error('Failed to load event information.');
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    if (!selectedTypeId) {
      toast.warning('Please select a check-in type first.');
      return;
    }
    try {
      if (!isInitialized) {
        scannerRef.current = new Html5Qrcode('qr-reader');
        setIsInitialized(true);
      }

      setScanning(true);
      setFocusMode(true); // One-click focus mode
      setScanResult(null);
      setLastScanned(null);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current?.start(
        { facingMode: 'environment' },
        { ...config, 
          videoConstraints: { 
            facingMode: 'environment',
            advanced: [{ focusMode: 'continuous' }] 
          } 
        },
        handleScan,
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setFocusMode(false);
      toast.error('Failed to access camera. Please allow camera permissions in your browser settings.');
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current?.stop();
      }
      setScanning(false);
    } catch (err) {
      // Ignore errors when stopping
    }
  };

  const handleScan = async (qrCode: string) => {
    await stopScanner();
    setFocusMode(false); // Exit focus mode on scan
    if (!event) return;

    try {
      const participantQuery = query(collection(db, 'participants'), where('organizerId', '==', currentUser?.uid), where('qrCode', '==', qrCode));
      const snapshot = await getDocs(participantQuery);

      if (snapshot.empty) {
        setScanResult('not-found');
        setScanMessage('This QR code is not valid for your event.');
        setLastScanned(null);
        toast.error('Invalid QR Code.');
        return;
      }

      const participantDoc = snapshot.docs[0];
      const participant = {
        ...participantDoc.data(),
        id: participantDoc.id,
      } as Participant;

      const checkIns = participant.checkIns || [];
      const alreadyScanned = checkIns.some((checkIn) => checkIn.typeId === selectedTypeId);
      const selectedType = event.checkInTypes.find(t => t.id === selectedTypeId);

      if (alreadyScanned) {
        setScanResult('duplicate');
        setScanMessage(`This participant has already been scanned for ${selectedType?.name}.`);
        setLastScanned(participant);
        toast.warning('Duplicate Scan Detected.');
        return;
      }

      await updateDoc(doc(db, 'participants', participantDoc.id), {
        checkIns: arrayUnion({
          typeId: selectedTypeId,
          typeName: selectedType?.name,
          timestamp: new Date().toISOString(),
          scannedBy: currentUser?.uid,
        }),
      });

      setScanResult('success');
      setScanMessage(`${selectedType?.name} recorded successfully!`);
      setLastScanned(participant);
      toast.success(`${participant.fullName} checked in for ${selectedType?.name}`);
    } catch (err) {
      setScanResult('not-found');
      setScanMessage('An error occurred while processing the scan. Please try again.');
      toast.error('Failed to process scan.');
    }
  };
  
  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-sans font-bold text-foreground">QR Scanner</h1>
        <p className="text-muted-foreground mt-1">You must create an event before you can use the scanner.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'max-w-2xl mx-auto space-y-6 transition-all duration-300',
        focusMode && 'fixed inset-0 z-[100] bg-background max-w-full w-full h-full p-4 overflow-auto'
      )}
    >
      <div className={cn('text-center', focusMode && 'hidden')}>
        <h1 className="text-3xl font-sans font-bold text-foreground">QR Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan participant QR codes for check-ins</p>
      </div>

      <Card className={cn('border-0 shadow-md', focusMode && 'hidden')}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">1. Select Check-in Type</CardTitle>
          <CardDescription>Choose what you are scanning for.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {event.checkInTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedTypeId === type.id ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3 gap-1.5"
                onClick={() => setSelectedTypeId(type.id)}
              >
                <Ticket className="w-5 h-5" />
                <span className="text-xs sm:text-sm">{type.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={cn('border-0 shadow-md overflow-hidden', focusMode && 'h-full flex flex-col')}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">2. Scan QR Code</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div id="qr-reader" className="w-full bg-secondary/5 flex-1" />
          
          {!scanning && (
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Click the button below to activate the camera and start scanning.
              </p>
              <Button variant="gradient" size="lg" onClick={startScanner}>
                <QrCode className="w-5 h-5" />
                Start Scanner
              </Button>
            </div>
          )}

          {scanning && (
            <div className="p-4 text-center border-t">
              <Button variant="outline" onClick={async () => {
                await stopScanner();
                setFocusMode(false);
              }}>
                Stop Scanner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {scanResult && !focusMode && (
        <Card className={cn(`border-0 shadow-md animate-scale-in ${
          scanResult === 'success' ? 'bg-accent/5' :
          scanResult === 'duplicate' ? 'bg-amber-500/5' :
          'bg-destructive/5'
        }`)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                scanResult === 'success' ? 'bg-accent/20 text-accent' :
                scanResult === 'duplicate' ? 'bg-amber-500/20 text-amber-600' :
                'bg-destructive/20 text-destructive'
              }`}>
                {scanResult === 'success' && <CheckCircle className="w-6 h-6" />}
                {scanResult === 'duplicate' && <AlertTriangle className="w-6 h-6" />}
                {scanResult === 'not-found' && <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <CardTitle className={`text-lg ${
                  scanResult === 'success' ? 'text-accent' :
                  scanResult === 'duplicate' ? 'text-amber-600' :
                  'text-destructive'
                }`}>
                  {scanResult === 'success' ? 'Scan Successful' :
                   scanResult === 'duplicate' ? 'Duplicate Scan' :
                   'Scan Failed'}
                </CardTitle>
                <CardDescription>{scanMessage}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          {lastScanned && (
            <CardContent>
              <div className="mt-2 p-4 rounded-lg bg-card border">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="font-semibold">Participant Details</h4>
                   <Badge style={{ 
                      backgroundColor: lastScanned.categoryColor,
                      color: '#fff',
                      borderColor: lastScanned.categoryColor
                    }}
                    variant="outline"
                   >
                      {lastScanned.category}
                    </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {lastScanned.fullName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {lastScanned.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {lastScanned.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          )}

          <div className="p-6 pt-0">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={startScanner}
            >
              <RefreshCw className="w-4 h-4" />
              Scan Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default QRScannerPage;
