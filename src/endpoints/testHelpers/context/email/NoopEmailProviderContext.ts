import {IEmailProviderContext} from '../../../../contexts/email/types.js';
import {noopAsync} from '../../../../utils/fns.js';

export default class NoopEmailProviderContext implements IEmailProviderContext {
  sendEmail = () => Promise.resolve(undefined);
  dispose = noopAsync;
}
