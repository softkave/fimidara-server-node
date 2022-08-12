import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getCollaboratorJoiSchema = Joi.object()
  .keys({
    collaboratorId: validationSchemas.resourceId.required(),
    workspaceId: validationSchemas.resourceId,
  })
  .required();
