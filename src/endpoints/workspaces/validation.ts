import Joi from 'joi';
import {kUsageRecordCategory} from '../../definitions/usageRecord.js';
import usageRecordValidationSchemas from '../usageRecords/validation.js';

const price = Joi.number().min(0).precision(5);
const usageThreshold = Joi.object().keys({
  price: price.required(),
  category: usageRecordValidationSchemas.category.required(),
});

const usageThresholdMap = Joi.object().keys({
  [kUsageRecordCategory.storage]: usageThreshold,
  [kUsageRecordCategory.bandwidthIn]: usageThreshold,
  [kUsageRecordCategory.bandwidthOut]: usageThreshold,
  // [UsageRecordCategoryMap.Request]: usageThreshold,
  // [UsageRecordCategoryMap.DatabaseObject]: usageThreshold,
  [kUsageRecordCategory.total]: usageThreshold,
});

const rootname = Joi.string().regex(/[A-Za-z0-9_-]/);

const workspaceValidationSchemas = {
  usageThreshold,
  usageThresholdMap,
  rootname,
};

export default workspaceValidationSchemas;
