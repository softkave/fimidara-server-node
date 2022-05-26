import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import workspaceValidationSchemas from '../validation';

export const workspaceInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name,
  description: validationSchemas.description.allow(null),
  usageThresholds: workspaceValidationSchemas.usageThresholdMap.allow(null),
});

export const updateWorkspaceJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid.required(),
    workspace: workspaceInputJoiSchema.required(),
  })
  .required();
