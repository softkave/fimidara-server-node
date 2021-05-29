import {nanoid} from 'nanoid';

// TODO: use uuid instead or write Joi schema
export default function getNewId(size?: number) {
    return nanoid(size);
}
