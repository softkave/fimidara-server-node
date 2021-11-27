import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getPresetPermissionsItemJoiSchema = Joi.object()
  .keys({
    itemId: validationSchemas.nanoid.required(),
  })
  .required();
