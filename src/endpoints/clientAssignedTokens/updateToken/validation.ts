import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import {newClientAssignedTokenJoiSchema} from '../addToken/validation';
import clientAssignedTokenValidationSchemas from '../validation';

export const updateClientAssignedTokenPermissionGroupsJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.resourceId.allow(null),
    onReferenced: Joi.boolean().allow(null),
    workspaceId: validationSchemas.resourceId.allow(null),
    providedResourceId:
      clientAssignedTokenValidationSchemas.providedResourceId.allow(null),
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
