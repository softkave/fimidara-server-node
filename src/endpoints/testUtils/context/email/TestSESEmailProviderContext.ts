import {vi} from 'vitest';
import {SESEmailProviderContext} from '../../../../contexts/email/SESEmailProviderContext.js';
import {S3FilePersistenceProviderInitParams} from '../../../../contexts/file/S3FilePersistenceProvider.js';
import {mockWith} from '../../helpers/mock.js';
import {TestEmailProviderContext} from '../types.js';

export default class TestSESEmailProviderContext
  implements TestEmailProviderContext
{
  private client: SESEmailProviderContext;

  sendEmail: TestEmailProviderContext['sendEmail'];
  dispose: TestEmailProviderContext['dispose'];

  constructor(params: S3FilePersistenceProviderInitParams) {
    this.client = new SESEmailProviderContext(params);
    this.sendEmail = vi.fn(this.client.sendEmail).mockName('sendEmail');
    this.dispose = vi.fn(this.client.dispose).mockName('close');

    mockWith(this.client, this);
  }
}
