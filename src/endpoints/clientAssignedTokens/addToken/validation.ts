import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../../presetPermissionsGroups/validation';
import clientAssignedTokenValidationSchemas from '../validation';

export const newClientAssignedTokenJoiSchema = Joi.object().keys({
  expires: validationSchemas.time.allow(null),
  presets:
    presetPermissionsGroupsValidationSchemas.assignedPresetsList.allow(null),
  providedResourceId:
    clientAssignedTokenValidationSchemas.providedResourceId.allow(null),
});

export const addClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
