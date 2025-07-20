import { ZodObject } from 'zod';

export type EnvModuleOptions = {
  global?: boolean;
  name: string;
  schema: ZodObject;
};
