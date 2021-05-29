import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const newAppointmentJoiSchema = Joi.object().keys({
    customerName: validationSchemas.name.required(),
    customerPhone: validationSchemas.phone.required(),
    description: validationSchemas.description,
    time: validationSchemas.time.required(),
});

export const addAppointmentJoiSchema = Joi.object()
    .keys({
        shopId: validationSchemas.nanoid.required(),
        appointment: newAppointmentJoiSchema.required(),
    })
    .required();
