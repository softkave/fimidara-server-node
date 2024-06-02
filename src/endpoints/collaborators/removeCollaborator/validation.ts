import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const removeCollaboratorJoiSchema = Joi.object()
  .keys({
    workspaceId: kValidationSchemas.resourceId,
    collaboratorId: kValidationSchemas.resourceId.required(),
  })
  .required();
