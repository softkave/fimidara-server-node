import Joi from 'joi';
import {UsageRecordCategoryMap} from '../../definitions/usageRecord.js';
import usageRecordValidationSchemas from '../usageRecords/validation.js';

const price = Joi.number().min(0).precision(5);
const usageThreshold = Joi.object().keys({
  price: price.required(),
  category: usageRecordValidationSchemas.category.required(),
});

const usageThresholdMap = Joi.object().keys({
  [UsageRecordCategoryMap.Storage]: usageThreshold,
  [UsageRecordCategoryMap.BandwidthIn]: usageThreshold,
  [UsageRecordCategoryMap.BandwidthOut]: usageThreshold,
  // [UsageRecordCategoryMap.Request]: usageThreshold,
  // [UsageRecordCategoryMap.DatabaseObject]: usageThreshold,
  [UsageRecordCategoryMap.Total]: usageThreshold,
});

const rootname = Joi.string().regex(/[A-Za-z0-9_-]/);

const workspaceValidationSchemas = {
  usageThreshold,
  usageThresholdMap,
  rootname,
};

export default workspaceValidationSchemas;
