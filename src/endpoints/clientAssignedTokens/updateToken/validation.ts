import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import {newClientAssignedTokenJoiSchema} from '../addToken/validation';
import clientAssignedTokenValidationSchemas from '../validation';

export const updateClientAssignedTokenPermissionGroupsJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.nanoid.allow(null),
    onReferenced: Joi.boolean().allow(null),
    workspaceId: validationSchemas.nanoid.allow(null),
    providedResourceId:
      clientAssignedTokenValidationSchemas.providedResourceId.allow(null),
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
