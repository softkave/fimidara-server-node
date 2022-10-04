import {noopAsync} from '../../../utilities/fns';
import {IEmailProviderContext} from '../../contexts/EmailProviderContext';

export default class NoopEmailProviderContext implements IEmailProviderContext {
  sendEmail = noopAsync;
  close = noopAsync;
}
