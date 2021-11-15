import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const deleteBucketJoiSchema = Joi.object()
  .keys({bucketId: validationSchemas.nanoid.required()})
  .required();
