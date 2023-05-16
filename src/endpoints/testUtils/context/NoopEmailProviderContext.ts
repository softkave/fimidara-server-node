import {noopAsync} from '../../../utils/fns';
import {IEmailProviderContext} from '../../contexts/email/types';

export default class NoopEmailProviderContext implements IEmailProviderContext {
  sendEmail = noopAsync;
  close = noopAsync;
}
