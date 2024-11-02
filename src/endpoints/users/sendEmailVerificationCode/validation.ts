import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {SendEmailVerificationCodeEndpointParams} from './types.js';

export const sendEmailVerificationCodeJoiSchema =
  startJoiObject<SendEmailVerificationCodeEndpointParams>({
    userId: kValidationSchemas.resourceId,
    workspaceId: kValidationSchemas.resourceId,
  }).required();
