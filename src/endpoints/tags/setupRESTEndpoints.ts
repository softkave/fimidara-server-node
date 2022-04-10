import {Express} from 'express';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';
import addTag from './addTag/handler';
import deleteTag from './deleteTag/handler';
import getOrganizationTags from './getOrganizationTags/handler';
import getTag from './getTag/handler';
import updateTag from './updateTag/handler';

export default function setupTagsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addTag: wrapEndpointREST(addTag, ctx),
    deleteTag: wrapEndpointREST(deleteTag, ctx),
    getOrganizationTags: wrapEndpointREST(getOrganizationTags, ctx),
    getTag: wrapEndpointREST(getTag, ctx),
    updateTag: wrapEndpointREST(updateTag, ctx),
  };

  app.post('/tags/addTag', endpoints.addTag);
  app.post('/tags/deleteTag', endpoints.deleteTag);
  app.post('/tags/getOrganizationTags', endpoints.getOrganizationTags);
  app.post('/tags/getTag', endpoints.getTag);
  app.post('/tags/updateTag', endpoints.updateTag);
}
