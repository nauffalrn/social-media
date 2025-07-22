CREATE TABLE "comment" (
	"id" bigint PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"text" text NOT NULL,
	"parent_id" bigint
);
--> statement-breakpoint
CREATE TABLE "comment_like" (
	"id" bigint PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"comment_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	CONSTRAINT "comment_like_comment_id_user_id_unique" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "email" (
	"id" bigint PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "email_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "follow" (
	"id" bigint PRIMARY KEY NOT NULL,
	"following_id" bigint NOT NULL,
	"follower_id" bigint NOT NULL,
	CONSTRAINT "follow_following_id_follower_id_unique" UNIQUE("following_id","follower_id")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"picture_url" text NOT NULL,
	"caption" text NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "post_like" (
	"id" bigint PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	CONSTRAINT "post_like_post_id_user_id_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_tag" (
	"post_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	CONSTRAINT "post_tag_post_id_user_id_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"bio" text NOT NULL,
	"username" text NOT NULL,
	"picture_url" text NOT NULL,
	"is_private" boolean NOT NULL,
	CONSTRAINT "profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" bigint PRIMARY KEY NOT NULL,
	"email_id" bigint NOT NULL,
	"password" text NOT NULL,
	"is_private" boolean NOT NULL,
	CONSTRAINT "user_email_id_unique" UNIQUE("email_id")
);
