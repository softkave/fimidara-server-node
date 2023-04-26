import {getConsoleLogger} from '../../endpoints/globalUtils';
import {
  renderCollaborationRequestMedia,
  renderCollaborationRequestResponseMedia,
  renderCollaborationRequestRevokedMedia,
  renderConfirmEmailAddressMedia,
  renderForgotPasswordMedia,
} from './renderToFile';

const consoleLogger = getConsoleLogger();
consoleLogger.info('Writing templates');
renderConfirmEmailAddressMedia();
renderForgotPasswordMedia();
renderCollaborationRequestMedia();
renderCollaborationRequestRevokedMedia();
renderCollaborationRequestResponseMedia();
consoleLogger.info('Completed writing templates');
process.exit(0);
