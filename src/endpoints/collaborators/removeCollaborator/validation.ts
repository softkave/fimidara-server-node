import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const removeCollaboratorJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    collaboratorId: validationSchemas.nanoid.required(),
  })
  .required();
