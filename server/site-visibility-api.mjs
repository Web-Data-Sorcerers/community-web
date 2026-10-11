import { createVisibilityAdmin } from './site-visibility-admin.mjs';
const handle = createVisibilityAdmin();
export default { fetch: (request) => handle(request) };
