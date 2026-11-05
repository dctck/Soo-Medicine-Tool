import {r2Config,r2Store} from './r2-media.mjs';
import {getStore} from '@netlify/blobs';
import {digest} from './auth.mjs';
let activeR2=null,activeKey='';
export function stores(env=process.env){const preview=['deploy-preview','branch-deploy'].includes(env.CONTEXT);const suffix=preview?'-preview-'+digest(env.BRANCH??env.CONTEXT).slice(0,12):'';const store=getStore({name:'soo-cms-v1'+suffix,consistency:'strong'}),legacy=getStore({name:'soo-media-v1'+suffix,consistency:'strong'});const config=env.MEDIA_STORAGE==='r2'&&!preview&&env.CONTEXT!=='dev'?r2Config(env):null;if(config){const key=digest(JSON.stringify(config));if(key!==activeKey){activeR2=r2Store(config,{legacy});activeKey=key;}}return {store,media:config?activeR2:legacy};}
