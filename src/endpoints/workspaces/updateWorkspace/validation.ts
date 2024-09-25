import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import workspaceValidationSchemas from '../validation.js';

export const workspaceInputJoiSchema = Joi.object().keys({
  name: kValidationSchemas.name,
  rootname: workspaceValidationSchemas.rootname,
  description: kValidationSchemas.description.allow(null),
});

export const updateWorkspaceJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    workspace: workspaceInputJoiSchema.required(),
  })
  .required();
