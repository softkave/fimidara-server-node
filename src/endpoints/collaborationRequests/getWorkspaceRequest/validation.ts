import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';

export const getWorkspaceCollaborationRequestJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    requestId: kValidationSchemas.resourceId.required(),
  })
  .required();
