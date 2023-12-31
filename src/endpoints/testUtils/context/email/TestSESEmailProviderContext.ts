import {SESEmailProviderContext} from '../../../contexts/email/SESEmailProviderContext';
import {S3FilePersistenceProviderInitParams} from '../../../contexts/file/S3FilePersistenceProvider';
import {ITestEmailProviderContext} from '../types';

export default class TestSESEmailProviderContext implements ITestEmailProviderContext {
  private client: SESEmailProviderContext;

  sendEmail: ITestEmailProviderContext['sendEmail'];
  close: ITestEmailProviderContext['close'];

  constructor(params: S3FilePersistenceProviderInitParams) {
    this.client = new SESEmailProviderContext(params);
    this.sendEmail = jest.fn(this.client.sendEmail).mockName('sendEmail');
    this.close = jest.fn(this.client.close).mockName('close');
  }
}
