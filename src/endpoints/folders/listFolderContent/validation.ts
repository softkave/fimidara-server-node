import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const listFolderContentJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
  })
  .required();
