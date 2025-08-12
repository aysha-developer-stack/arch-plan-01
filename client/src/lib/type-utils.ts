import { UserType } from '@shared/schema';

// Type for the user object returned by useAuth hook
export interface AuthUser {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  downloadCount?: number;
  createdAt: Date;
  updatedAt: Date;
  // Add other MongoDB-specific properties if needed
  [key: string]: any;
}

// Convert AuthUser to UserType
export const toUserType = (user: AuthUser | null): UserType | undefined => {
  if (!user) return undefined;
  
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    downloadCount: user.downloadCount || 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  } as UserType;
};
