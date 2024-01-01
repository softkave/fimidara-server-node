import {DisposableResource} from '../../../utils/disposables';

export interface SendEmailParams {
  destination: string[];
  source: string;
  subject: string;
  body: {
    html: string;
    text: string;
  };
}

export interface IEmailProviderContext extends DisposableResource {
  sendEmail: (params: SendEmailParams) => Promise<void>;
}
