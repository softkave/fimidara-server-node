import * as dotenv from 'dotenv';

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

  console.log(`-- ${cmdMessage} --`);
  console.log(result.parsed);
  console.log(`-- ${cmdMessage} --`);
  return result.parsed;
}
