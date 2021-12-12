import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deletePresetPermissionsGroupJoiSchema = Joi.object()
  .keys({
    presetId: validationSchemas.nanoid.required(),
  })
  .required();
