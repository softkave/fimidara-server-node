import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {internalConstants} from '../constants';
import {UpgradeWaitlistedUsersEndpointParams} from './types';

export const upgradeWaitlistedUsersJoiSchema =
  Joi.object<UpgradeWaitlistedUsersEndpointParams>().keys({
    userIds: Joi.array()
      .items(validationSchemas.resourceId)
      .max(internalConstants.maxUpgradeWaitlistedUserItems)
      .required(),
  });
