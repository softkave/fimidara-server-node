import {noopAsync} from '../../../utils/fns';
import {IEmailProviderContext} from '../../contexts/EmailProviderContext';

export default class NoopEmailProviderContext implements IEmailProviderContext {
  sendEmail = noopAsync;
  close = noopAsync;
}
