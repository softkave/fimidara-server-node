import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const workspaceInputJoiSchema = Joi.object().keys({
  name: validationSchemas.name.allow(null),
  description: validationSchemas.description.allow(null),
});

export const updateWorkspaceJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid.required(),
    workspace: workspaceInputJoiSchema.required(),
  })
  .required();
