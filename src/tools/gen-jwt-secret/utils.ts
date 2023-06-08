import {serverLogger} from '@/utils/logger/loggerUtils';
import * as crypto from 'crypto';

export async function genJWTSecret() {
  const secret = crypto.randomBytes(128).toString('hex');
  serverLogger.info('secret:');
  serverLogger.info(secret);
  return secret;
}
