import { createVisibilityAdmin } from '../../server/site-visibility-admin.mjs';
const handle = createVisibilityAdmin();
export default { fetch: (request) => handle(request) };
