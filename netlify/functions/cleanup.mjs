import {stores} from './lib/stores.mjs';
import {cleanup} from './lib/cleanup.mjs';
export default async()=>{await cleanup(stores().store);return new Response(null,{status:204});};
export const config={schedule:'17 4 * * *'};
