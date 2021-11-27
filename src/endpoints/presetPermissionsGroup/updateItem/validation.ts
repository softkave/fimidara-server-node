import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const updatePresetPermissionsItemJoiSchema = Joi.object()
  .keys({})
  .required();
