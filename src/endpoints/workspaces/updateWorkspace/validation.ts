import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';

export const workspaceInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  rootname: folderValidationSchemas.folderpath,
  description: validationSchemas.description.allow(null),
  // usageThresholds: workspaceValidationSchemas.usageThresholdMap
});

export const updateWorkspaceJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    workspace: workspaceInputJoiSchema.required(),
  })
  .required();
