import {SESEmailProviderContext} from '../../contexts/EmailProviderContext';
import {ITestEmailProviderContext} from './types';

export default class TestSESEmailProviderContext
  extends SESEmailProviderContext
  implements ITestEmailProviderContext
{
  public sendEmail = jest
    .fn(SESEmailProviderContext.prototype.sendEmail)
    .mockName('sendEmail');
}
