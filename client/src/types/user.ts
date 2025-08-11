export interface UserType {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}
