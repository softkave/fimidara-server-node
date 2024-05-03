import {vi} from 'vitest';
import {TestEmailProviderContext} from '../types.js';

export default class MockTestEmailProviderContext
  implements TestEmailProviderContext
{
  sendEmail = vi.fn().mockName('sendEmail');
  dispose = vi.fn().mockName('close');
}
