import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../../presetPermissionsGroups/validation';

export const newClientAssignedTokenJoiSchema = Joi.object().keys({
  expires: validationSchemas.fromNowMs,
  presets: presetPermissionsGroupsValidationSchemas.assignedPresetsList,
});

export const addClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
