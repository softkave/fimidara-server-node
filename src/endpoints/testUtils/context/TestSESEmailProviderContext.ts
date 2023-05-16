import {SESEmailProviderContext} from '../../contexts/email/SESEmailProviderContext';
import {ITestEmailProviderContext} from './types';

export default class TestSESEmailProviderContext implements ITestEmailProviderContext {
  private client: SESEmailProviderContext;

  sendEmail: ITestEmailProviderContext['sendEmail'];
  close: ITestEmailProviderContext['close'];

  constructor(region: string) {
    this.client = new SESEmailProviderContext(region);
    this.sendEmail = jest.fn(this.client.sendEmail).mockName('sendEmail');
    this.close = jest.fn(this.client.close).mockName('close');
  }
}
