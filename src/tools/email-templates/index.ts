import {consoleLogger} from '../../utils/logger/logger';
import {
  renderCollaborationRequestMedia,
  renderCollaborationRequestResponseMedia,
  renderCollaborationRequestRevokedMedia,
  renderConfirmEmailAddressMedia,
  renderForgotPasswordMedia,
} from './renderToFile';

consoleLogger.info('Writing templates');
renderConfirmEmailAddressMedia();
renderForgotPasswordMedia();
renderCollaborationRequestMedia();
renderCollaborationRequestRevokedMedia();
renderCollaborationRequestResponseMedia();
consoleLogger.info('Completed writing templates');
process.exit(0);
