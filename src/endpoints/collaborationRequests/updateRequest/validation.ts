import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {UpdateCollaborationRequestEndpointParams, UpdateCollaborationRequestInput} from './types';

export const updateCollaborationRequestInputJoiSchema =
  Joi.object<UpdateCollaborationRequestInput>().keys({
    message: validationSchemas.description.allow(null),
    expires: validationSchemas.time.allow(null),
    // permissionGroupsOnAccept:
    //   permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
  });

export const updateCollaborationRequestJoiSchema =
  Joi.object<UpdateCollaborationRequestEndpointParams>()
    .keys({
      requestId: validationSchemas.resourceId.required(),
      request: updateCollaborationRequestInputJoiSchema.required(),
    })
    .required();
