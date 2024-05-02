import {ITestEmailProviderContext} from '../types.js';

export default class MockTestEmailProviderContext implements ITestEmailProviderContext {
  sendEmail = jest.fn().mockName('sendEmail');
  dispose = jest.fn().mockName('close');
}
