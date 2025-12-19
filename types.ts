
export interface GroundingLink {
  uri: string;
  title: string;
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  location?: string;
  type: 'FLIGHT' | 'HOTEL' | 'RESTAURANT' | 'SIGHTSEEING' | 'TRANSPORT' | 'OTHER';
  costEstimate?: string;
  bookingUrl?: string;
  groundingUrls?: GroundingLink[];
}

export interface DailyPlan {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  name: string;
  departureLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  summary: string;
  itinerary: DailyPlan[];
  imageUrl: string;
  sources: GroundingLink[];
  originalRequest?: any; 
  editCount: number; // Track how many times the trip has been edited
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isSystem?: boolean;
}

export type AppView = 'DASHBOARD' | 'CHAT' | 'PLANNER' | 'TRIP_DETAILS';

export interface TripRequest {
  departureLocation: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  transportType: string;
  totalBudget: string; // Changed from dailyBudget to totalBudget
  goals: string;
}
