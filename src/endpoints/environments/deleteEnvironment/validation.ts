import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deleteEnvironmentJoiSchema = Joi.object()
  .keys({
    environmentId: validationSchemas.nanoid.required(),
  })
  .required();
