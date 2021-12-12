import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getOrganizationProgramAccessTokenJoiSchema = Joi.object()
  .keys({organizationId: validationSchemas.nanoid.required()})
  .required();
