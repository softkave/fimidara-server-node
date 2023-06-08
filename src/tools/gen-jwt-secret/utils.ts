import * as crypto from 'crypto';
import {serverLogger} from '../../utils/logger/loggerUtils';

export async function genJWTSecret() {
  const secret = crypto.randomBytes(128).toString('hex');
  serverLogger.info('secret:');
  serverLogger.info(secret);
  return secret;
}
