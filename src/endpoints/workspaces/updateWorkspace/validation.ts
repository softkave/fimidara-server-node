import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import workspaceValidationSchemas from '../validation';

export const workspaceInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  rootname: folderValidationSchemas.folderpath,
  description: validationSchemas.description.allow(null),
  usageThresholds: workspaceValidationSchemas.usageThresholdMap.allow(null),
});

export const updateWorkspaceJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    workspace: workspaceInputJoiSchema.required(),
  })
  .required();
