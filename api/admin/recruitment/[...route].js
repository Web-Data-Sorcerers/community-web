import { createRecruitmentAdminHandler } from '../../../server/recruitment-admin.mjs';
import { recruitmentAdminRoute } from '../../../server/recruitment-admin-route.mjs';

const handle = createRecruitmentAdminHandler();

// Single catch-all function: the Hobby plan caps a deployment at 12 serverless
// functions, so the recruitment admin routes share one handler instead of one
// file per route (mirrors the sub-path dispatch without extra functions).
export default {
  fetch: (request) => {
    const routed = recruitmentAdminRoute(request);
    return handle(routed.request, routed.route);
  },
};
