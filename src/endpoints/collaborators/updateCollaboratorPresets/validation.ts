import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../../presetPermissionsGroup/validation';

export const updateCollaboratorPresetsJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    collaboratorId: validationSchemas.nanoid.required(),
    presets: presetPermissionsGroupsValidationSchemas.assignedPresetsList.required(),
  })
  .required();
