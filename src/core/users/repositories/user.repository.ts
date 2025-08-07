import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from 'src/infrastructure/database';
import { TransactionHost } from '@nestjs-cls/transactional';
import {
  email,
  follow,
  post,
  profile,
  user,
} from 'src/infrastructure/database/schema';

type DrizzleClient = typeof db;
type MyDrizzleAdapter = TransactionalAdapterDrizzleOrm<DrizzleClient>;

@Injectable()
export class UserRepository {
  constructor(private readonly txHost: TransactionHost<MyDrizzleAdapter>) {}

  async findEmailById(emailId: bigint) {
    return this.txHost.tx
        .select()
        .from(email)
        .where(eq(email.id, emailId))
        .limit(1);
}
  
  async findByEmail(emailValue: string) {
    return this.txHost.tx
      .select()
      .from(email)
      .where(eq(email.value, emailValue))
      .limit(1);
  }

  async findUserByEmailId(emailId: bigint) {
    return this.txHost.tx
      .select()
      .from(user)
      .where(eq(user.email_id, emailId))
      .limit(1);
  }

  async findProfileByUserId(userId: bigint) {
    return this.txHost.tx
      .select()
      .from(profile)
      .where(eq(profile.user_id, userId))
      .limit(1);
  }

  async findProfileByUsername(username: string) {
    return this.txHost.tx
      .select()
      .from(profile)
      .where(eq(profile.username, username))
      .limit(1);
  }

  async findUserById(userId: bigint) {
    return this.txHost.tx
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
  }

  async insertEmail(emailData: any) {
    return this.txHost.tx.insert(email).values(emailData);
  }

  async insertUser(userData: any) {
    return this.txHost.tx.insert(user).values(userData);
  }

  async insertProfile(profileData: any) {
    return this.txHost.tx.insert(profile).values(profileData);
  }

  async updateProfile(userId: bigint, update: any) {
    return this.txHost.tx
      .update(profile)
      .set(update)
      .where(eq(profile.user_id, userId));
  }

  async updateEmailVerified(emailId: bigint, date: Date) {
    return this.txHost.tx
      .update(email)
      .set({ verified_at: date })
      .where(eq(email.id, emailId));
  }

  async countPosts(userId: bigint) {
    return this.txHost.tx
      .select({ count: sql`count(*)` })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)));
  }

  async countFollowers(userId: bigint) {
    return this.txHost.tx
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.following_id, userId));
  }

  async countFollowings(userId: bigint) {
    return this.txHost.tx
      .select({ count: sql`count(*)` })
      .from(follow)
      .where(eq(follow.follower_id, userId));
  }

  async getRecentPosts(userId: bigint) {
    return this.txHost.tx
      .select({
        id: post.id,
        pictureUrl: post.picture_url,
      })
      .from(post)
      .where(and(eq(post.user_id, userId), isNull(post.deleted_at)))
      .orderBy(desc(post.id))
      .limit(3);
  }
}
