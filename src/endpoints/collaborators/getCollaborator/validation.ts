import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getCollaboratorJoiSchema = Joi.object()
  .keys({
    collaboratorId: validationSchemas.resourceId.required(),
    workspaceId: validationSchemas.resourceId,
  })
  .required();
