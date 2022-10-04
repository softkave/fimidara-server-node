import {ITestEmailProviderContext} from './types';

export default class MockTestEmailProviderContext
  implements ITestEmailProviderContext
{
  sendEmail = jest.fn().mockName('sendEmail');
  close = jest.fn().mockName('close');
}
