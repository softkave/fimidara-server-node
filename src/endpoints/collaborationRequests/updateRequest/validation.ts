import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestInput,
} from './types.js';

export const updateCollaborationRequestInputJoiSchema =
  Joi.object<UpdateCollaborationRequestInput>().keys({
    message: kValidationSchemas.description.allow(null),
    expires: kValidationSchemas.time.allow(null),
    // permissionGroupsOnAccept:
    //   permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
  });

export const updateCollaborationRequestJoiSchema =
  Joi.object<UpdateCollaborationRequestEndpointParams>()
    .keys({
      requestId: kValidationSchemas.resourceId.required(),
      request: updateCollaborationRequestInputJoiSchema.required(),
    })
    .required();
