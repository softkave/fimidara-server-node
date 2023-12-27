import * as Joi from 'joi';
import {kPermissionsMap} from '../definitions/permissionItem';
import {kAppResourceTypeList as systemAppResourceTypesList} from '../definitions/system';
import {endpointConstants} from '../endpoints/constants';

const password = /[A-Za-z0-9!()?_`~#$^&*+=]/;
const str = /^[\w ]*$/;
const hexColor = /#([a-f0-9]{3}|[a-f0-9]{4}(?:[a-f0-9]{2}){0,2})\b/;
const zipcodeRegex = /^\d{5}(?:[-\s]\d{4})?$/;
const phoneRegex = /^(?:\+\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const awsSecretAccessKey = /^[A-Za-z0-9+/]$/;

export const ValidationRegExPatterns = {
  password,
  str,
  hexColor,
  awsSecretAccessKey,
  zipcode: zipcodeRegex,
  phone: phoneRegex,
};

export const validationConstants = {
  maxImageURLLength: 300,
  minVerificationCodeLength: 6,
  maxVerificationCodeLength: 6,
  maxResourceIdInputLength: 1000,
  awsAccessKeyIdLength: 20,
  awsSecretAccessKeyLength: 40,
};

const uuid = Joi.string().guid().trim();
const color = Joi.string().trim().lowercase().regex(ValidationRegExPatterns.hexColor);
const alphanum = Joi.string().regex(str);
const URL = Joi.string().uri().trim().max(validationConstants.maxImageURLLength);
const positiveNum = Joi.number().integer().positive();
const name = Joi.string().trim().max(endpointConstants.maxNameLength);
const description = Joi.string()
  .allow(null, '')
  .max(endpointConstants.maxDescriptionLength)
  .trim();
const zipcode = Joi.string().regex(ValidationRegExPatterns.zipcode);
const phone = Joi.string().regex(ValidationRegExPatterns.phone);
const time = Joi.date().timestamp().cast('number');
const verificationCode = Joi.string()
  .trim()
  .min(validationConstants.minVerificationCodeLength)
  .max(validationConstants.maxVerificationCodeLength);
const resourceId = Joi.string().trim().max(50);
const resourceIdList = Joi.array()
  .items(resourceId)
  .min(1)
  .max(validationConstants.maxResourceIdInputLength);
const resourceIdOrResourceIdList = Joi.alternatives().try(resourceId, resourceIdList);
const fromNowMs = Joi.number().integer().min(0);
const fromNowSecs = Joi.number().integer().min(0);
const resourceType = Joi.string().valid(...systemAppResourceTypesList);
const crudAction = Joi.string().valid(...Object.keys(kPermissionsMap));
const crudActionList = Joi.array()
  .items(crudAction)
  .max(Object.keys(kPermissionsMap).length);
const providedResourceId = Joi.string().max(
  endpointConstants.providedResourceIdMaxLength
);
const crudActionOrList = Joi.alternatives().try(crudAction, crudActionList);

export const validationSchemas = {
  resourceId,
  resourceIdList,
  resourceIdOrResourceIdList,
  color,
  URL,
  positiveNum,
  name,
  description,
  zipcode,
  phone,
  time,
  verificationCode,
  fromNowMs,
  fromNowSecs,
  alphanum,
  resourceType,
  crudAction,
  crudActionList,
  crudActionOrList,
  providedResourceId,
  uuid,
};

export function stripOnEmpty(schema: Joi.Schema, fieldName: string) {
  return schema.when(fieldName, {
    is: Joi.valid(null),
    then: Joi.any().strip(),
  });
}
