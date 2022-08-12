import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const removeCollaboratorJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    collaboratorId: validationSchemas.resourceId.required(),
  })
  .required();
