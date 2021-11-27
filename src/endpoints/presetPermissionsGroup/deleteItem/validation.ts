import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deletePresetPermissionsItemJoiSchema = Joi.object()
  .keys({
    itemId: validationSchemas.nanoid.required(),
  })
  .required();
