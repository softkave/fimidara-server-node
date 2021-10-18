import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getEnvironmentJoiSchema = Joi.object()
  .keys({
    environmentId: validationSchemas.nanoid.required(),
  })
  .required();
