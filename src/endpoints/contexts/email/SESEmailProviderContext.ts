import {SendEmailCommand, SESv2Client} from '@aws-sdk/client-sesv2';
import {IEmailProviderContext, SendEmailParams} from './types';
import {kUtilsInjectables} from '../injectables';

export class SESEmailProviderContext implements IEmailProviderContext {
  protected ses: SESv2Client;

  constructor(region: string) {
    this.ses = new SESv2Client({region});
  }

  sendEmail = async (params: SendEmailParams) => {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: params.destination,
      },
      FromEmailAddress: params.source,
      Content: {
        Simple: {
          Subject: {
            Charset: kUtilsInjectables.config().awsEmailEncoding,
            Data: params.subject,
          },
          Body: {
            Html: {
              Charset: kUtilsInjectables.config().awsEmailEncoding,
              Data: params.body.html,
            },
            Text: {
              Charset: kUtilsInjectables.config().awsEmailEncoding,
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
