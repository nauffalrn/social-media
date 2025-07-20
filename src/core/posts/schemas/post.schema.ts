import { z } from 'zod';

// Skema untuk membuat post
export const createPostSchema = z.object({
  userId: z.bigint().min(1n, 'User ID harus diisi'),
  pictureUrl: z.string().url('Format URL tidak valid'),
  caption: z.string().optional(),
});

export type CreatePostSchemaType = z.infer<typeof createPostSchema>;

// Skema untuk menghapus post
export const deletePostSchema = z.object({
  userId: z.bigint().min(1n, 'User ID harus diisi'),
});

export type DeletePostSchemaType = z.infer<typeof deletePostSchema>;

// Skema untuk view posts
export const viewPostsSchema = z.object({
  viewerId: z.bigint().min(1n, 'Viewer ID harus diisi'),
});

export type ViewPostsSchemaType = z.infer<typeof viewPostsSchema>;
