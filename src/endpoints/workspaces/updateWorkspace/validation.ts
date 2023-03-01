import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import {endpointValidationSchemas} from '../../validation';

export const workspaceInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  rootname: folderValidationSchemas.folderpath,
  description: validationSchemas.description.allow(null),
});

export const updateWorkspaceJoiSchema = Joi.object()
  .keys({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    workspace: workspaceInputJoiSchema.required(),
  })
  .required();
