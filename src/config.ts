import { env } from './env';

export const SERVER = {
  PORT: Number.parseInt(env.API_PORT),
};
