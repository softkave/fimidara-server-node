import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const updateCollaboratorPresetsJoiSchema = Joi.object()
  .keys({})
  .required();
