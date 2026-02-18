import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  id: string;
  account: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
