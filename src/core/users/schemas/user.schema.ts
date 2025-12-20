import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  full_name: z.string().optional(),
});

export const updateProfileSchema = z.object({
  full_name: z.string().optional(),
  bio: z.string().optional(),
  username: z.string().min(3).optional(),
  picture_url: z.string().url().optional(),
  is_private: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
