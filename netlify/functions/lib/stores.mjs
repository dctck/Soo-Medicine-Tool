import {getStore} from '@netlify/blobs';
import {digest} from './auth.mjs';
export function stores(env=process.env){const preview=['deploy-preview','branch-deploy'].includes(env.CONTEXT);const suffix=preview?'-preview-'+digest(env.BRANCH??env.CONTEXT).slice(0,12):'';return {store:getStore({name:'soo-cms-v1'+suffix,consistency:'strong'}),media:getStore({name:'soo-media-v1'+suffix,consistency:'strong'})};}
