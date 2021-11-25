import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const removeCollaboratorJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    collaboratorId: validationSchemas.nanoid.required(),
  })
  .required();
