import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getOrganizationTagJoiSchema = Joi.object()
  .keys({organizationId: validationSchemas.nanoid})
  .required();
