import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.nanoid.allow(null),
    onReferenced: Joi.boolean().allow(null),
  })
  .required();
