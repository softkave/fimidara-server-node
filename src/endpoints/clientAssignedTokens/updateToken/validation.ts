import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {newClientAssignedTokenJoiSchema} from '../addToken/validation';
import {IUpdateClientAssignedTokenEndpointParams} from './types';

export const updateClientAssignedTokenJoiSchema = Joi.object<IUpdateClientAssignedTokenEndpointParams>()
  .keys({
    tokenId: validationSchemas.resourceId.allow(null),
    onReferenced: Joi.boolean().allow(null),
    workspaceId: validationSchemas.resourceId.allow(null),
    providedResourceId: validationSchemas.providedResourceId.allow(null),
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
