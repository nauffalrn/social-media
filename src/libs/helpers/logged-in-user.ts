import { FastifyRequest } from 'fastify';

export interface LoggedInUser extends FastifyRequest {
  user: {
    sub: string;
    username: string;
    email: string;
  };
}
