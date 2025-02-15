import * as crypto from 'crypto';

export async function genJWTSecret() {
  const secret = crypto.randomBytes(128).toString('hex');
  console.log(secret);
  return secret;
}
