import {appVariables} from './appVariables';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const twilioClient = require('twilio')(
  appVariables.twilioAccountSID,
  appVariables.twilioAuthToken
);

export default twilioClient;
