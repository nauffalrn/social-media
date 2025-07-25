export class User {
  id: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  fullName?: string;
  bio?: string;
  username?: string;
  pictureUrl?: string;
  followers?: string[];
  following?: string[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
    this.followers = partial.followers || [];
    this.following = partial.following || [];
    this.isEmailVerified = partial.isEmailVerified || false;
  }
}