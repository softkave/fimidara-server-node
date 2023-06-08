import {BaseContextType} from '../types';

export interface SendEmailParams {
  destination: string[];
  source: string;
  subject: string;
  body: {
    html: string;
    text: string;
  };
}

export interface IEmailProviderContext {
  sendEmail: (context: BaseContextType, params: SendEmailParams) => Promise<void>;
  close: () => void | Promise<void>;
}
