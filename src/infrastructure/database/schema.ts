import {
  pgTable,
  bigint,
  text,
  boolean,
  timestamp,
  unique,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// USER
export const user = pgTable('user', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  email_id: bigint('email_id', { mode: 'bigint' }).notNull(),
  password: text('password').notNull(),
  is_private: boolean('is_private').notNull(),
}, (table) => [
  unique().on(table.email_id),
]);

// PROFILE
export const profile = pgTable('profile', {
  user_id: bigint('user_id', { mode: 'bigint' }).primaryKey(),
  full_name: text('full_name').notNull(),
  bio: text('bio').notNull(),
  username: text('username').notNull(),
  picture_url: text('picture_url').notNull(),
  is_private: boolean('is_private').notNull(),
}, (table) => [
  unique().on(table.username),
]);

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.user_id],
    references: [user.id],
  }),
}));

// EMAIL
export const email = pgTable('email', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  value: text('value').notNull(),
  verified_at: timestamp('verified_at', { withTimezone: false }),
}, (table) => [
  unique().on(table.value),
]);

export const userRelations = relations(user, ({ one }) => ({
  email: one(email, {
    fields: [user.email_id],
    references: [email.id],
  }),
}));

// POST
export const post = pgTable('post', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  user_id: bigint('user_id', { mode: 'bigint' }).notNull(),
  picture_url: text('picture_url').notNull(),
  caption: text('caption').notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: false }),
});

export const postRelations = relations(post, ({ one, many }) => ({
  user: one(user, {
    fields: [post.user_id],
    references: [user.id],
  }),
  tags: many(post_tag),
  likes: many(post_like),
  comments: many(comment),
}));

// POST TAG
export const post_tag = pgTable('post_tag', {
  post_id: bigint('post_id', { mode: 'bigint' }).notNull(),
  user_id: bigint('user_id', { mode: 'bigint' }).notNull(),
}, (table) => [
  unique().on(table.post_id, table.user_id),
]);

export const postTagRelations = relations(post_tag, ({ one }) => ({
  post: one(post, {
    fields: [post_tag.post_id],
    references: [post.id],
  }),
  user: one(user, {
    fields: [post_tag.user_id],
    references: [user.id],
  }),
}));

// FOLLOW
export const follow = pgTable('follow', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  following_id: bigint('following_id', { mode: 'bigint' }).notNull(),
  follower_id: bigint('follower_id', { mode: 'bigint' }).notNull(),
}, (table) => [
  unique().on(table.following_id, table.follower_id),
]);

export const followRelations = relations(follow, ({ one }) => ({
  following: one(user, {
    fields: [follow.following_id],
    references: [user.id],
  }),
  follower: one(user, {
    fields: [follow.follower_id],
    references: [user.id],
  }),
}));

// COMMENT
export const comment = pgTable('comment', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  post_id: bigint('post_id', { mode: 'bigint' }).notNull(),
  user_id: bigint('user_id', { mode: 'bigint' }).notNull(),
  text: text('text').notNull(),
  parent_id: bigint('parent_id', { mode: 'bigint' }),
});

export const commentRelations = relations(comment, ({ one, many }) => ({
  post: one(post, {
    fields: [comment.post_id],
    references: [post.id],
  }),
  user: one(user, {
    fields: [comment.user_id],
    references: [user.id],
  }),
  likes: many(comment_like),
}));

// POST LIKE
export const post_like = pgTable('post_like', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  post_id: bigint('post_id', { mode: 'bigint' }).notNull(),
  user_id: bigint('user_id', { mode: 'bigint' }).notNull(),
}, (table) => [
  unique().on(table.post_id, table.user_id),
]);

export const postLikeRelations = relations(post_like, ({ one }) => ({
  post: one(post, {
    fields: [post_like.post_id],
    references: [post.id],
  }),
  user: one(user, {
    fields: [post_like.user_id],
    references: [user.id],
  }),
}));

// COMMENT LIKE
export const comment_like = pgTable('comment_like', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  post_id: bigint('post_id', { mode: 'bigint' }).notNull(),
  comment_id: bigint('comment_id', { mode: 'bigint' }).notNull(),
  user_id: bigint('user_id', { mode: 'bigint' }).notNull(),
}, (table) => [
  unique().on(table.comment_id, table.user_id),
]);

export const commentLikeRelations = relations(comment_like, ({ one }) => ({
  comment: one(comment, {
    fields: [comment_like.comment_id],
    references: [comment.id],
  }),
  user: one(user, {
    fields: [comment_like.user_id],
    references: [user.id],
  }),
}));

// NOTIFICATION
export const notification = pgTable('notification', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  user_id: bigint('user_id', { mode: 'bigint' }).notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
});

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.user_id],
    references: [user.id],
  }),
}));
