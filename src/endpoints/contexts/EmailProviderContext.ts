import aws from '../../resources/aws';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
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
}

class EmailProviderContext implements IEmailProviderContext {
  private ses = new aws.SES();

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

export const getEmailProviderContext = singletonFunc(
  () => new EmailProviderContext()
);
