import { Injectable, Inject } from '@nestjs/common';
import { db } from 'src/infrastructure/database';
import {
  email,
  user,
  profile,
  post,
  follow,
} from 'src/infrastructure/database/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

type DrizzleClient = typeof db;

@Injectable()
export class UserRepository {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: DrizzleClient,
  ) {}

  async findEmailById(emailId: bigint) {
    return this.db.select().from(email).where(eq(email.id, emailId)).limit(1);
  }

  async findByEmail(emailValue: string) {
    return this.db
      .select()
      .from(email)
      .where(eq(email.value, emailValue))
      .limit(1);
  }

  async findUserByEmailId(emailId: bigint) {
    return this.db
      .select()
      .from(user)
      .where(eq(user.email_id, emailId))
      .limit(1);
  }

  async findProfileByUserId(userId: bigint) {
    return this.db
      .select()
      .from(profile)
      .where(eq(profile.user_id, userId))
      .limit(1);
  }

  async findProfileByUsername(username: string) {
    return this.db
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);
  }

  async findUserById(userId: bigint) {
    return this.db.select().from(user).where(eq(user.id, userId)).limit(1);
  }

  async insertEmail(emailData: any) {
    return this.db.insert(email).values(emailData);
  }

  async insertUser(userData: any) {
    return this.db.insert(user).values(userData);
  }

  async insertProfile(profileData: any) {
    return this.db.insert(profile).values(profileData);
  }

  async updateProfile(userId: bigint, update: any) {
    return this.db
      .update(profile)
      .set(update)
      .where(eq(profile.user_id, userId));
  }

  async updateEmailVerified(emailId: bigint, date: Date) {
    return this.db
      .update(email)
      .set({ verified_at: date })
      .where(eq(email.id, emailId));
  }

  async countPosts(userId: bigint) {
    return this.db
      .select({ count: sql`count(*)` })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)));
  }

  async countFollowers(userId: bigint) {
    return this.db
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.following_id, userId));
  }

  async countFollowings(userId: bigint) {
    return this.db
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.follower_id, userId));
  }

  async getRecentPosts(userId: bigint) {
    return this.db
      .select({
        id: post.id,
        user_id: post.user_id,
        picture_url: post.picture_url,
        caption: post.caption,
        created_at: post.created_at,
        deleted_at: post.deleted_at,
      })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)))
      .limit(10);
  }
}
