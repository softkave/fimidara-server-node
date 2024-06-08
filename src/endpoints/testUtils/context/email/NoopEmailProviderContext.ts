import {noopAsync} from '../../../../utils/fns.js';
import {IEmailProviderContext} from '../../../contexts/email/types.js';

export default class NoopEmailProviderContext implements IEmailProviderContext {
  sendEmail = () => Promise.resolve(undefined);
  dispose = noopAsync;
}
