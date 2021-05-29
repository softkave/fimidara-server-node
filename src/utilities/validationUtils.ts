import * as Joi from 'joi';
import {endpointConstants} from '../endpoints/constants';

const password = /[A-Za-z0-9!()?_`~#$^&*+=]/;
const string = /^[\w ]*$/;
const hexColor = /#([a-f0-9]{3}|[a-f0-9]{4}(?:[a-f0-9]{2}){0,2})\b/;
const zipcodeRegex = /^\d{5}(?:[-\s]\d{4})?$/;
const phoneRegex = /^(?:\+\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

export const regExPatterns = {
    password,
    string,
    hexColor,
    zipcode: zipcodeRegex,
    phone: phoneRegex,
};

export const validationConstants = {
    maxImageURLLength: 300,
    minVerificationCodeLength: 6,
    maxVerificationCodeLength: 6,
};

const uuid = Joi.string().guid().trim();
const color = Joi.string().trim().lowercase().regex(regExPatterns.hexColor);
const URL = Joi.string()
    .uri()
    .trim()
    .max(validationConstants.maxImageURLLength);

const positiveNum = Joi.number().integer().positive();
const name = Joi.string().trim().max(endpointConstants.maxNameLength);
const description = Joi.string()
    .allow(null, '')
    .max(endpointConstants.maxDescriptionLength)
    .trim();

const zipcode = Joi.string().regex(regExPatterns.zipcode);
const phone = Joi.string().regex(regExPatterns.phone);
const time = Joi.date().iso();
const verificationCode = Joi.string()
    .trim()
    .min(validationConstants.minVerificationCodeLength)
    .max(validationConstants.maxVerificationCodeLength);

const nanoid = Joi.string().trim().length(21);

export const validationSchemas = {
    uuid,
    color,
    URL,
    positiveNum,
    name,
    description,
    zipcode,
    phone,
    time,
    verificationCode,
    nanoid,
};

export function stripOnEmpty(schema: Joi.Schema, fieldName: string) {
    return schema.when(fieldName, {
        is: Joi.valid(null),
        then: Joi.any().strip(),
    });
}
