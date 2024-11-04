import {startJoiObject} from '../../../utils/validationUtils.js';
import {getPermissionGroupsBaseJoiSchemaParts} from '../getPermissionGroups/validation.js';
import {CountPermissionGroupsEndpointParams} from './types.js';

export const countPermissionGroupsJoiSchema =
  startJoiObject<CountPermissionGroupsEndpointParams>(
    getPermissionGroupsBaseJoiSchemaParts
  ).required();
