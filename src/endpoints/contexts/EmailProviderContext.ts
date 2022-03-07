import {SendEmailCommand, SESv2Client} from '@aws-sdk/client-sesv2';
import {
  wrapFireAndThrowError,
  wrapFireAndThrowErrorNoAsync,
} from '../../utilities/promiseFns';
import {IBaseContext} from './BaseContext';

export interface ISendEmailParams {
  destination: string[];
  source: string;
  subject: string;
  body: {
    html: string;
    text: string;
  };
}

export interface IEmailProviderContext {
  sendEmail: (context: IBaseContext, params: ISendEmailParams) => Promise<void>;
  close: () => void;
}

export class SESEmailProviderContext implements IEmailProviderContext {
  protected ses: SESv2Client;

  constructor(region: string) {
    this.ses = new SESv2Client({region});
  }

  public sendEmail = wrapFireAndThrowError(
    async (context: IBaseContext, params: ISendEmailParams) => {
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
    }
  );

  public close = wrapFireAndThrowErrorNoAsync(() => {
    this.ses.destroy();
  });
}
