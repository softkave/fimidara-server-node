import {FimidaraEndpointHeaders} from './types.js';

export type FimidaraEndpointErrorItem = {
  name: string;
  field?: string;
  message: string;

  // TODO: find a way to include in generated doc for when we add new
  // recommended actions
  action?: 'logout' | 'loginAgain' | 'requestChangePassword';
};

export class FimidaraEndpointError extends Error {
  name = 'FimidaraEndpointError';
  isFimidaraEndpointError = true;

  constructor(
    public errors: Array<FimidaraEndpointErrorItem>,
    public statusCode?: number,
    public statusText?: string,
    public headers?: FimidaraEndpointHeaders
  ) {
    super(
      errors.map(item => item.message).join('\n') ||
        'fimidara endpoint error. ' +
          'This could be because the client is not able to connect to the server. ' +
          'Please check your internet connection or check with Support if the issue persists.'
    );
  }
}
