
export interface UserParticipation {
  meetingId: string;
  isPrivate: boolean;
}

export interface UserProfile {
  id: string;
  phone: string;
  nickname: string;
  age: number;
  isCertified: boolean;
  interests: string[];
  bio: string;
  location: string;
  followerCount: number;
  followingCount: number;
  blockedUserIds: string[];
}

export interface Meeting {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  capacity: number;
  currentParticipants: number;
  description: string;
  host: string;
  hostId: string;
  isCertifiedOnly: boolean;
  imageUrl: string;
  moodTags?: string[];
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
}

export type ViewState = 
  | 'HOME' 
  | 'AUTH_PHONE' 
  | 'PROFILE_SETUP' 
  | 'WELCOME' 
  | 'MEETING_DETAIL' 
  | 'MY_PAGE' 
  | 'CHATTING' 
  | 'CHAT_ROOM'
  | 'CREATE_MEETING'
  | 'EDIT_MEETING';
