import {Express} from 'express';
import {IBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import addTag from './addTag/handler';
import deleteTag from './deleteTag/handler';
import getTag from './getTag/handler';
import getWorkspaceTags from './getWorkspaceTags/handler';
import updateTag from './updateTag/handler';

export default function setupTagsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addTag: wrapEndpointREST(addTag, ctx),
    deleteTag: wrapEndpointREST(deleteTag, ctx),
    getWorkspaceTags: wrapEndpointREST(getWorkspaceTags, ctx),
    getTag: wrapEndpointREST(getTag, ctx),
    updateTag: wrapEndpointREST(updateTag, ctx),
  };

  app.post('/tags/addTag', endpoints.addTag);
  app.delete('/tags/deleteTag', endpoints.deleteTag);
  app.post('/tags/getWorkspaceTags', endpoints.getWorkspaceTags);
  app.post('/tags/getTag', endpoints.getTag);
  app.post('/tags/updateTag', endpoints.updateTag);
}
