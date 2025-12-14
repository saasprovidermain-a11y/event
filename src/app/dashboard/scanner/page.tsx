
'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Participant, Event, CheckInTypeDefinition, CheckInCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Coffee,
  Box,
  LogIn,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { cn } from '@/lib/utils';

// Helper to map category names to icons
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('food')) return Coffee;
  if (name.includes('kit')) return Box;
  if (name.includes('check')) return LogIn;
  return Ticket;
};


const QRScannerPage = () => {
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [checkInTypes, setCheckInTypes] = useState<CheckInTypeDefinition[]>([]);
  const [checkInCategories, setCheckInCategories] = useState<CheckInCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Participant | null>(null);
  const [scanResult, setScanResult] = useState<'success' | 'duplicate' | 'not-found' | null>(null);
  const [scanMessage, setScanMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        setLoadingData(true);
        const eventQuery = query(collection(db, 'events'), where('organizerId', '==', currentUser.uid));
        const eventSnapshot = await getDocs(eventQuery);
        
        if (!eventSnapshot.empty) {
          const eventData = { ...eventSnapshot.docs[0].data(), id: eventSnapshot.docs[0].id } as Event;
          setEvent(eventData);

          const categoryQuery = query(collection(db, 'checkInCategories'), where('eventId', '==', eventData.id));
          const categorySnapshot = await getDocs(categoryQuery);
          const categoryData = categorySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CheckInCategory[];
          setCheckInCategories(categoryData);

          const checkInTypeQuery = query(collection(db, 'checkInTypes'), where('eventId', '==', eventData.id));
          const checkInTypeSnapshot = await getDocs(checkInTypeQuery);
          const checkInData = checkInTypeSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as CheckInTypeDefinition[];
          setCheckInTypes(checkInData);
        }
      } catch (error) {
        toast.error('Failed to load event information.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
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
      setFocusMode(true);
      setScanResult(null);
      setLastScanned(null);
      
      await scannerRef.current?.start(
        { facingMode: 'environment' },
        { 
          fps: 10,
          // No qrbox property means full screen scanning
        },
        handleScan,
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setFocusMode(false);
      toast.error('Failed to access camera. Please allow camera permissions.');
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
        await scannerRef.current?.stop();
      }
    } catch (err) {
      // Ignore errors when stopping, as it can throw if already stopped.
    } finally {
      setScanning(false);
      setFocusMode(false);
    }
  };

  const handleScan = async (qrCode: string) => {
    await stopScanner(); // Stop scanning immediately after a detection
    if (!event || !currentUser) return;
  
    setFocusMode(false); // Exit focus mode to show results
  
    try {
      const participantQuery = query(
        collection(db, 'participants'),
        where('organizerId', '==', currentUser.uid),
        where('qrCode', '==', qrCode)
      );
      const snapshot = await getDocs(participantQuery);
  
      if (snapshot.empty) {
        setScanResult('not-found');
        setScanMessage('This QR code is not valid for your event.');
        setLastScanned(null);
        toast.error('Invalid QR Code.');
        return;
      }
  
      const participantDoc = snapshot.docs[0];
      const participant = { ...participantDoc.data(), id: participantDoc.id } as Participant;
      const checkIns = participant.checkIns || [];
      const selectedType = checkInTypes.find(t => t.id === selectedTypeId);
      
      if (!selectedType) {
        throw new Error("Selected check-in type not found");
      }
  
      const alreadyScanned = checkIns.some((checkIn) => checkIn.typeId === selectedTypeId);
  
      if (alreadyScanned) {
        setScanResult('duplicate');
        setScanMessage(`This participant has already been scanned for ${selectedType.name}.`);
        setLastScanned(participant);
        toast.warning(`Already scanned for ${selectedType.name}.`);
        return;
      }
  
      await updateDoc(doc(db, 'participants', participantDoc.id), {
        checkIns: arrayUnion({
          typeId: selectedTypeId,
          typeName: selectedType.name,
          timestamp: new Date().toISOString(),
          scannedBy: currentUser.uid,
        }),
      });
  
      setScanResult('success');
      setScanMessage(`${selectedType.name} recorded successfully!`);
      // Update participant object locally to reflect new check-in for the UI
      const updatedParticipant = {
        ...participant,
        checkIns: [
          ...checkIns,
          {
            typeId: selectedTypeId,
            typeName: selectedType.name,
            timestamp: new Date().toISOString(),
            scannedBy: currentUser.uid,
          },
        ],
      };
      setLastScanned(updatedParticipant);
      toast.success(`${participant.fullName} checked in for ${selectedType.name}`);
  
    } catch (err) {
      console.error(err);
      setScanResult('not-found');
      setScanMessage('An error occurred while processing the scan. Please try again.');
      toast.error('Failed to process scan.');
    }
  };
  
  const groupedCheckInTypes = useMemo(() => {
    return checkInCategories.map(category => ({
      ...category,
      types: checkInTypes.filter(type => type.categoryId === category.id)
    })).filter(category => category.types.length > 0); // Only show categories with types
  }, [checkInCategories, checkInTypes]);


  if (loadingData) {
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
        focusMode && 'fixed inset-0 z-[100] bg-background max-w-full w-full h-full p-4 overflow-auto flex flex-col'
      )}
    >
       {focusMode && (
        <Button
          variant="ghost"
          size="icon"
          onClick={stopScanner}
          className="absolute top-4 left-4 z-10 bg-background/50 hover:bg-background/80"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}

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
            {groupedCheckInTypes.length > 0 ? (
                <Accordion type="multiple" className="w-full" defaultValue={groupedCheckInTypes.map(c => c.id)}>
                  {groupedCheckInTypes.map(category => {
                    const Icon = getCategoryIcon(category.name);
                    return (
                      <AccordionItem value={category.id} key={category.id}>
                        <AccordionTrigger className="text-base">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-primary" />
                            {category.name}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                            {category.types.map((type) => (
                              <Button
                                  key={type.id}
                                  variant={selectedTypeId === type.id ? 'default' : 'outline'}
                                  className="flex flex-col h-auto py-3 gap-1.5"
                                  onClick={() => setSelectedTypeId(type.id)}
                              >
                                  <Ticket className="w-5 h-5" />
                                  <span className="text-xs sm:text-sm text-center">{type.name}</span>
                              </Button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
            ) : (
                <p className="text-muted-foreground text-sm">No check-in types have been set up for this event yet.</p>
            )}
        </CardContent>
      </Card>

      <Card className={cn('border-0 shadow-md overflow-hidden', focusMode && 'h-full flex flex-col')}>
        <CardHeader className={cn("flex flex-row items-center justify-between", focusMode && 'hidden')}>
          <CardTitle className="text-lg">2. Scan QR Code</CardTitle>
        </CardHeader>
        <CardContent className={cn("p-0 flex flex-col justify-center items-center", focusMode && 'h-full flex-1')}>
          <div id="qr-reader" className="w-full bg-secondary/5" />
          
          {!scanning && !focusMode && (
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Click the button below to activate the camera and start scanning.
              </p>
              <Button variant="gradient" size="lg" onClick={startScanner} disabled={!selectedTypeId || checkInTypes.length === 0}>
                <QrCode className="w-5 h-5" />
                Start Scanner
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
              disabled={!selectedTypeId}
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
