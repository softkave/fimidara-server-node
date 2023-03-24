import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {IUpdateCollaborationRequestEndpointParams, IUpdateCollaborationRequestInput} from './types';

export const updateCollaborationRequestInputJoiSchema =
  Joi.object<IUpdateCollaborationRequestInput>().keys({
    message: validationSchemas.description.allow(null),
    expires: validationSchemas.time.allow(null),
    // permissionGroupsOnAccept:
    //   permissionGroupsValidationSchemas.assignedPermissionGroupsList.allow(null),
  });

export const updateCollaborationRequestJoiSchema =
  Joi.object<IUpdateCollaborationRequestEndpointParams>()
    .keys({
      requestId: validationSchemas.resourceId.required(),
      request: updateCollaborationRequestInputJoiSchema.required(),
    })
    .required();
