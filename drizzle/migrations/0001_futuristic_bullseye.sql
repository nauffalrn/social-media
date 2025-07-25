ALTER TABLE "profile" ALTER COLUMN "full_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "bio" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "picture_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "is_private" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "is_private" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_comment_post_id" ON "comment" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_comment_user_id" ON "comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comment_parent_id" ON "comment" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_comment_like_comment_id" ON "comment_like" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_comment_like_user_id" ON "comment_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comment_like_post_id" ON "comment_like" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_email_value" ON "email" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_email_verified_at" ON "email" USING btree ("verified_at");--> statement-breakpoint
CREATE INDEX "idx_follow_following_id" ON "follow" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "idx_follow_follower_id" ON "follow" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_notification_user_id" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notification_category" ON "notification" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_notification_user_category" ON "notification" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "idx_post_user_id" ON "post" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_deleted_at" ON "post" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_post_user_id_deleted_at" ON "post" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_post_like_post_id" ON "post_like" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_like_user_id" ON "post_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_tag_post_id" ON "post_tag" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_tag_user_id" ON "post_tag" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_username" ON "profile" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_profile_user_id" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_email_id" ON "user" USING btree ("email_id");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "is_private";