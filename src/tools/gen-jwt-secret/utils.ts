import * as crypto from 'crypto';
import {consoleLogger} from '../../utils/logger/logger';

export async function genJWTSecret() {
  const secret = crypto.randomBytes(128).toString('hex');
  consoleLogger.info('secret:');
  consoleLogger.info(secret);
  return secret;
}
