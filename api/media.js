import { createPublicMediaHandler } from '../server/cms-public.mjs';

const handle = createPublicMediaHandler();
export default { fetch: (request) => handle(request) };
