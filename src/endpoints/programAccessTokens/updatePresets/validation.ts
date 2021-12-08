import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const updateProgramAccessTokenPresetsJoiSchema = Joi.object()
  .keys({})
  .required();
