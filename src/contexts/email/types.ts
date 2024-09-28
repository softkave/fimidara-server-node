import {DisposableResource} from 'softkave-js-utils';
import {EmailBlocklistReason} from '../../definitions/email.js';
import {EmailJobMeta} from '../../definitions/job.js';

export interface SendEmailParams {
  destination: string[];
  source: string;
  subject: string;
  body: {
    html: string;
    text: string;
  };
}

export interface EmailProviderBlockEmailAddressItem {
  emailAddress: string;
  reason: EmailBlocklistReason;
}

export interface EmailProviderSendEmailResult {
  blockEmailAddressList?: Array<EmailProviderBlockEmailAddressItem>;
  meta?: EmailJobMeta;
}

export interface IEmailProviderContext extends DisposableResource {
  sendEmail: (
    params: SendEmailParams
  ) => Promise<EmailProviderSendEmailResult | undefined>;
}
