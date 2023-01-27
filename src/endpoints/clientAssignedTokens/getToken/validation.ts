import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.resourceId.allow(null),
    onReferenced: Joi.boolean().allow(null),
  })
  .required();
