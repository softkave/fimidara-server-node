import {ITestEmailProviderContext} from './types';

export default class MockTestEmailProviderContext
  implements ITestEmailProviderContext
{
  public sendEmail = jest.fn().mockName('sendEmail');
  public close = jest.fn().mockName('close');
}
