import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getCollaboratorJoiSchema = Joi.object()
  .keys({
    collaboratorId: validationSchemas.nanoid.required(),
    organizationId: validationSchemas.nanoid.required(),
  })
  .required();
