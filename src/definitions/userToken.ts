export interface IUserToken {
  resourceId: string;
  userId: string;
  version: number;

  // not same as iat in token, may be a litte bit behind or after
  // and is a ISO string, where iat is time in seconds
  issuedAt: string;
  audience: string[];
  expires?: number;
  // meta?: Record<string, string | number | boolean | null>;
}
