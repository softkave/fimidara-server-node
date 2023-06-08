import {SendEmailCommand, SESv2Client} from '@aws-sdk/client-sesv2';
import {BaseContextType} from '../types';
import {IEmailProviderContext, SendEmailParams} from './types';

export class SESEmailProviderContext implements IEmailProviderContext {
  protected ses: SESv2Client;

  constructor(region: string) {
    this.ses = new SESv2Client({region});
  }

  sendEmail = async (context: BaseContextType, params: SendEmailParams) => {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: params.destination,
      },
      FromEmailAddress: params.source,
      Content: {
        Simple: {
          Subject: {
            Charset: context.appVariables.awsEmailEncoding,
            Data: params.subject,
          },
          Body: {
            Html: {
              Charset: context.appVariables.awsEmailEncoding,
              Data: params.body.html,
            },
            Text: {
              Charset: context.appVariables.awsEmailEncoding,
              Data: params.body.text,
            },
          },
        },
      },
    });

    await this.ses.send(command);
  };

  close = async () => {
    await this.ses.destroy();
  };
}
