import Joi = require('joi');
import {validationSchemas} from '../../../utilities/validationUtils';

export const confirmEmailAddressJoiSchema = Joi.object()
  .keys({
    code: validationSchemas.verificationCode.required(),
  })
  .required();
