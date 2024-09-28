import Joi from 'joi';
import {kValidationSchemas} from '../../utils/validationUtils.js';
import {kEndpointConstants} from '../constants.js';

const assignedPermissionGroup = Joi.object().keys({
  permissionGroupId: kValidationSchemas.resourceId.required(),
  order: Joi.number(),
});

const pgIdOrList = Joi.alternatives().try(
  kValidationSchemas.resourceId,
  Joi.array()
    .items(kValidationSchemas.resourceId)
    .unique()
    .max(kEndpointConstants.inputListMax)
);

const permissionGroupsValidationSchemas = {
  assignedPermissionGroup,
  pgIdOrList,
};

export default permissionGroupsValidationSchemas;
