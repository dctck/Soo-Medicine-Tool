import {createAPI} from './lib/api.mjs';
import {stores} from './lib/stores.mjs';
export default async(request,context)=>createAPI(stores())(request,context);
export const config={rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};
