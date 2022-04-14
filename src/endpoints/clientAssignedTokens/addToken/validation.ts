import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetsValidationSchemas from '../../presetPermissionsGroups/validation';
import tagsValidationSchemas from '../../tags/validation';
import clientAssignedTokenValidationSchemas from '../validation';

export const newClientAssignedTokenJoiSchema = Joi.object().keys({
  expires: validationSchemas.time.allow(null),
  providedResourceId:
    clientAssignedTokenValidationSchemas.providedResourceId.allow(null),
  tags: tagsValidationSchemas.assignedTagsList.allow(null),
  presets: presetsValidationSchemas.assignedPresetsList.allow(null),
  name: validationSchemas.name.allow(null),
  description: validationSchemas.description.allow(null),
});

export const addClientAssignedTokenJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid.required(),
    token: newClientAssignedTokenJoiSchema.required(),
  })
  .required();
