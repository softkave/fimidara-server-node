import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getFoldersJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
  })
  .required();
