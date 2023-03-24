import Joi = require('joi');
import {UsageRecordCategory} from '../../definitions/usageRecord';
import usageRecordValidationSchemas from '../usageRecords/validation';

const price = Joi.number().min(0).precision(5);
const usageThreshold = Joi.object().keys({
  price: price.required(),
  category: usageRecordValidationSchemas.category.required(),
});

const usageThresholdMap = Joi.object().keys({
  [UsageRecordCategory.Storage]: usageThreshold,
  [UsageRecordCategory.BandwidthIn]: usageThreshold,
  [UsageRecordCategory.BandwidthOut]: usageThreshold,
  // [UsageRecordCategory.Request]: usageThreshold,
  // [UsageRecordCategory.DatabaseObject]: usageThreshold,
  [UsageRecordCategory.Total]: usageThreshold,
});

const rootname = Joi.string().regex(/[A-Za-z0-9_-]/);

const workspaceValidationSchemas = {
  usageThreshold,
  usageThresholdMap,
  rootname,
};

export default workspaceValidationSchemas;
