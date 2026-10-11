// Code-owned public routes. Preferences never modify CMS content.
const section = (id, label, component, anchor = id) => ({
  id,
  label,
  component,
  anchor,
});
export const DETAIL_IDS = [
  'data',
  'core',
  'language',
  'vision',
  'product',
  'growth',
];
const DETAIL_LABELS = {
  data: 'Data Intelligence',
  core: 'Core AI & Engineering',
  language: 'Language & Reasoning',
  vision: 'Vision & Multimodal',
  product: 'Product & Software',
  growth: 'Growth & Community',
};
export const VISIBILITY_PAGES = [
  {
    id: 'home',
    path: '/',
    label: 'Home',
    protected: true,
    sections: [
      section('philosophy', 'Our Philosophy', 'Philosophy', 'our-philosophy'),
      section('what-we-do', 'What We Do', 'WhatWeDo'),
      section('domains', 'House of Data Sorcerers', 'Domains'),
      section('projects', 'Our Projects', 'Projects'),
      section(
        'recruitment-cta',
        'Recruitment CTA',
        'Recruitment',
        'recruitment',
      ),
    ],
  },
  {
    id: 'about',
    path: '/about/',
    label: 'About Us',
    sections: [
      section('vision-mission', 'Vision & Mission', 'VisiMisi', 'visi-misi'),
      section('philosophy', 'Our Philosophy', 'Philosophy', 'our-philosophy'),
      section('ecosystem', 'Our Ecosystem', 'OurEcosystem', 'our-ecosystem'),
      section('team', 'Our Team', 'OurTeam', null),
    ],
  },
  {
    id: 'hall-of-frames',
    path: '/hall-of-frames/',
    label: 'Hall of Frames',
    sections: [
      section('featured', 'Featured Sorcerers', 'HallOfFramesFeatured', null),
      section('projects', 'Project Highlights', 'HallOfFramesProjects', null),
      section(
        'milestones',
        'Community Milestones',
        'HallOfFramesMilestone',
        null,
      ),
    ],
  },
  {
    id: 'recruitment',
    path: '/recruitment/',
    label: 'Recruitment',
    sections: [
      section('who-should-join', 'Who Should Join', 'WhoShouldJoin'),
      section('what-you-will-do', 'What You Will Do', 'WhatYouWillDo'),
      section('available-roles', 'Available Roles', 'AvailableRoles'),
      section(
        'timeline',
        'Selection Timeline',
        'SelectionTimeline',
        'selection-timeline',
      ),
      section('faq', 'FAQ', 'Faq'),
      section('snippets', 'Snippets', 'Snippets'),
      section('cta', 'Community CTA', 'Cta', null),
    ],
  },
  {
    id: 'partners',
    path: '/partners/',
    label: 'Partners',
    sections: [
      section('partners', 'Our Partners', 'OurPartners', null),
      section('why-partners', 'Why Data Sorcerers', 'WhyPartners', null),
    ],
  },
  { id: 'contact', path: '/contact/', label: 'Contact', sections: [] },
  ...DETAIL_IDS.map((id) => ({
    id: `hods-${id}`,
    path: `/hods/${id}/`,
    label: `HoDS: ${DETAIL_LABELS[id]}`,
    parent: 'home',
    sections: [],
  })),
  ...DETAIL_IDS.map((id) => ({
    id: `role-${id}`,
    path: `/recruitment/roles/${id}/`,
    label: `Role: ${DETAIL_LABELS[id]}`,
    parent: 'recruitment',
    sections: [],
  })),
  {
    id: 'recruitment-apply',
    path: '/recruitment/apply/',
    label: 'Application Form',
    parent: 'recruitment',
    sections: [],
  },
];
export const PAGE_BY_ID = Object.fromEntries(
  VISIBILITY_PAGES.map((p) => [p.id, p]),
);
export function pageForPath(path) {
  const normalized = path === '/' ? '/' : path.replace(/\/+$/, '') + '/';
  return VISIBILITY_PAGES.find((p) => p.path === normalized);
}
export function getPageState(config, id) {
  const page = PAGE_BY_ID[id];
  if (!page || !config?.pages[id]) return false;
  return (
    (page.protected || config.pages[id].enabled) &&
    (!page.parent || getPageState(config, page.parent))
  );
}
export function getSectionState(config, pageId, sectionId) {
  if (
    !getPageState(config, pageId) ||
    config.pages[pageId].sections[sectionId] !== true
  )
    return false;
  if (pageId === 'recruitment' && sectionId === 'available-roles')
    return DETAIL_IDS.some((id) => getPageState(config, `role-${id}`));
  return true;
}
export function canNavigateToTarget(config, pageId, sectionId) {
  return sectionId
    ? getSectionState(config, pageId, sectionId)
    : getPageState(config, pageId);
}
export function developmentDestinations(config, currentId) {
  return ['home', 'recruitment', 'partners', 'contact']
    .filter((id) => id !== currentId && getPageState(config, id))
    .map((id) => ({
      label: id === 'home' ? 'Back to Home' : PAGE_BY_ID[id].label,
      href: PAGE_BY_ID[id].path,
      variant: id === 'home' ? 'community' : 'explore',
    }));
}
export function defaultVisibility(
  revision = '00000000-0000-4000-8000-000000000001',
) {
  return {
    schemaVersion: 1,
    revision,
    pages: Object.fromEntries(
      VISIBILITY_PAGES.map((p) => [
        p.id,
        {
          enabled: !['about', 'hall-of-frames'].includes(p.id),
          sections: Object.fromEntries(p.sections.map((s) => [s.id, true])),
        },
      ]),
    ),
  };
}
