import {SES} from 'aws-sdk';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import {IBaseContext} from './BaseContext';
import {assertAWSConfigured} from '../../resources/aws';

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
}

export class SESEmailProviderContext implements IEmailProviderContext {
  protected ses: SES;

  constructor() {
    assertAWSConfigured();
    this.ses = new SES();
  }

  public sendEmail = wrapFireAndThrowError(
    async (context: IBaseContext, params: ISendEmailParams) => {
      await this.ses
        .sendEmail({
          Destination: {
            ToAddresses: params.destination,
          },
          Source: params.source,
          Message: {
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
        })
        .promise();
    }
  );
}
