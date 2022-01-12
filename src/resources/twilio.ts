import twilio = require('twilio');
import {getAppVariables} from './appVariables';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export function getTwilioClient() {
  return twilio(
    getAppVariables().twilioAccountSID,
    getAppVariables().twilioAuthToken
  );
}
