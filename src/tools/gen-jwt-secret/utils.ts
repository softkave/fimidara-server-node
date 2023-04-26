import * as crypto from 'crypto';
import {getConsoleLogger} from '../../endpoints/globalUtils';

const consoleLogger = getConsoleLogger();
export async function genJWTSecret() {
  const secret = crypto.randomBytes(128).toString('hex');
  consoleLogger.info('secret:');
  consoleLogger.info(secret);
  return secret;
}
