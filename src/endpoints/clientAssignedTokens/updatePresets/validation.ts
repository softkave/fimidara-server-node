import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const updateClientAssignedTokenPresetsJoiSchema = Joi.object()
  .keys({})
  .required();
