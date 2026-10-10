import { createPublicContentHandler } from '../../server/cms-public.mjs';

const handle = createPublicContentHandler();
export default { fetch: (request) => handle(request) };
