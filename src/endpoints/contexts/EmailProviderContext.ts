import {isEqual} from 'lodash';
import {format} from 'util';
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

type EmailProviderContextMethods = 'sendEmail';
interface IEmailProviderContextSavedParam {
  method: EmailProviderContextMethods;
  params: any;
}

export class TestEmailProviderContext implements IEmailProviderContext {
  public savedParams: IEmailProviderContextSavedParam[] = [];

  public sendEmail = wrapFireAndThrowError(
    async (context: IBaseContext, params: ISendEmailParams) => {
      this.savedParams.push({params, method: 'sendEmail'});
    }
  );

  public getMethodCallWithParamsIndex(
    method: EmailProviderContextMethods,
    params: any
  ) {
    return this.savedParams.findIndex(p => isEqual(p, {method, params}));
  }

  public getMethodCallIndex(method: EmailProviderContextMethods) {
    return this.savedParams.findIndex(p => p.method === method);
  }

  public assertMethodCalledWith(
    method: EmailProviderContextMethods,
    params: any
  ) {
    const index = this.getMethodCallWithParamsIndex(method, params);

    if (index === -1) {
      throw new Error(format('sendEmail was not called with param %o', params));
    }
  }

  public assertMethodCalled(method: EmailProviderContextMethods) {
    const index = this.getMethodCallIndex(method);

    if (index === -1) {
      throw new Error(format('sendEmail was not called'));
    }
  }
}
