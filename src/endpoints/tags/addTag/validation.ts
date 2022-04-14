import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const addTagJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    tag: Joi.object()
      .keys({
        name: validationSchemas.name.required(),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
