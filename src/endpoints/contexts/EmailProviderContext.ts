import aws from '../../resources/aws';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';

export interface ISendEmailParams {
  destination: string[];
  source: string;
  subject: {
    charset: string;
    data: string;
  };
  body: {
    html: {
      charset: string;
      data: string;
    };
    text: {
      charset: string;
      data: string;
    };
  };
}

export interface IEmailProviderContext {
  sendEmail: (params: ISendEmailParams) => Promise<void>;
}

class EmailProviderContext implements IEmailProviderContext {
  private ses = new aws.SES();

  public sendEmail = wrapFireAndThrowError(async (params: ISendEmailParams) => {
    await this.ses
      .sendEmail({
        Destination: {
          ToAddresses: params.destination,
        },
        Source: params.source,
        Message: {
          Subject: {
            Charset: params.subject.charset,
            Data: params.subject.data,
          },
          Body: {
            Html: {
              Charset: params.body.html.charset,
              Data: params.body.html.data,
            },
            Text: {
              Charset: params.body.text.charset,
              Data: params.body.text.data,
            },
          },
        },
      })
      .promise();
  });
}

export const getEmailProviderContext = singletonFunc(
  () => new EmailProviderContext()
);
