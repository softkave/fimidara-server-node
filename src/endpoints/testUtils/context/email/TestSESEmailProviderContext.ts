import {SESEmailProviderContext} from '../../../contexts/email/SESEmailProviderContext';
import {S3FilePersistenceProviderInitParams} from '../../../contexts/file/S3FilePersistenceProvider';
import {ITestEmailProviderContext} from '../types';

export default class TestSESEmailProviderContext implements ITestEmailProviderContext {
  private client: SESEmailProviderContext;

  sendEmail: ITestEmailProviderContext['sendEmail'];
  dispose: ITestEmailProviderContext['dispose'];

  constructor(params: S3FilePersistenceProviderInitParams) {
    this.client = new SESEmailProviderContext(params);
    this.sendEmail = jest.fn(this.client.sendEmail).mockName('sendEmail');
    this.dispose = jest.fn(this.client.dispose).mockName('close');
  }
}
