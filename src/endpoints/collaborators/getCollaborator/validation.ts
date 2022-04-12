import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getCollaboratorJoiSchema = Joi.object()
  .keys({
    collaboratorId: validationSchemas.nanoid.required(),
    workspaceId: validationSchemas.nanoid.required(),
  })
  .required();
