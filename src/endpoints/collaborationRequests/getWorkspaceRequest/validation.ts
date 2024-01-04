import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';

export const getWorkspaceCollaborationRequestJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    requestId: kValidationSchemas.resourceId.required(),
  })
  .required();
