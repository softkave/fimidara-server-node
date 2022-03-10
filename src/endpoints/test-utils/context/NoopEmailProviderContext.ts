import {noopAsync} from '../../../utilities/fns';
import {IEmailProviderContext} from '../../contexts/EmailProviderContext';

export default class NoopEmailProviderContext implements IEmailProviderContext {
  public sendEmail = noopAsync;
  public close = noopAsync;
}
