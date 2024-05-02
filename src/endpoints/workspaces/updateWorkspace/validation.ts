import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../../folders/validation.js';
import {endpointValidationSchemas} from '../../validation.js';

export const workspaceInputJoiSchema = Joi.object().keys({
  name: kValidationSchemas.name,
  rootname: folderValidationSchemas.folderpath,
  description: kValidationSchemas.description.allow(null),
});

export const updateWorkspaceJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    workspace: workspaceInputJoiSchema.required(),
  })
  .required();
