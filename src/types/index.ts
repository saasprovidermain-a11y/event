
export type UserRole = 'admin' | 'organizer';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: any; // Allow any for Firestore Timestamp flexibility
  createdBy?: string;
}

export interface EventCategory {
  id: string;
  name:string;
  color: string;
}

export interface CheckInCategory {
  id: string;
  name: string;
  eventId: string;
  organizerId: string;
  icon?: string; // Optional: for future use e.g., 'Coffee', 'Box'
}

export interface CheckInTypeDefinition {
  id: string;
  name: string;
  eventId: string;
  organizerId: string;
  categoryId: string;
}

export interface Event {
  id: string;
  organizerId: string;
  name: string;
  description?: string;
  categories: EventCategory[];
  registrationLink: string;
  createdAt: any; // Allow any for Firestore Timestamp flexibility
  isActive: boolean;
}

export interface Participant {
  id: string;
  eventId: string;
  organizerId: string;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  categoryColor: string;
  registeredAt: any; // Allow any for Firestore Timestamp flexibility
  qrCode: string;
  checkIns: CheckIn[];
  registrationNumber: string;
}

export interface CheckIn {
  typeId: string;
  typeName: string;
  timestamp: string; // ISO string
  scannedBy: string;
}
