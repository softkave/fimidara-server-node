import dotenv from 'dotenv';
import {jestLogger} from './logger';

export function setupEnvVars(
  envPath: string,
  cmdMessage = 'unit test env vars'
) {
  const result = dotenv.config({
    debug: true,
    path: envPath,
    override: true,
  });

  if (result.error) {
    throw result.error;
  }

  jestLogger.info(`-- ${cmdMessage} --`);
  jestLogger.info(result.parsed);
  jestLogger.info(`-- ${cmdMessage} --`);
  return result.parsed;
}
