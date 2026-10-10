/**
 * Client-side live sync for Data Sorcerers CMS.
 * Fetches fresh content in the background from /api/cms/content
 * and updates DOM cards if admin published changes recently.
 */

let cachedContent = null;
let cachedTime = 0;
let fetchPromise = null;
const CACHE_TTL_MS = 3000;

if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', () => {
    cachedContent = null;
    cachedTime = 0;
  });
  document.addEventListener('astro:after-swap', () => {
    cachedContent = null;
    cachedTime = 0;
  });
}

async function getContent(signal) {
  const now = Date.now();
  if (cachedContent && now - cachedTime < CACHE_TTL_MS) return cachedContent;
  if (!fetchPromise) {
    fetchPromise = fetch(`/api/cms/content?t=${now}`, {
      signal,
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.ok && json.data) {
          cachedContent = json.data;
          cachedTime = Date.now();
          return json.data;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        fetchPromise = null;
      });
  }
  return fetchPromise;
}

export function syncLiveProjects({ stage, onUpdate, signal }) {
  if (!stage) return;
  getContent(signal).then((data) => {
    if (!data?.projects || signal?.aborted) return;
    const cards = [
      ...stage.querySelectorAll('.project-card, .hof-project-card'),
    ];
    let changed = false;

    cards.forEach((card, index) => {
      const proj = data.projects[index];
      if (!proj) return;

      const titleEl = card.querySelector('h3');
      const descEl = card.querySelector('p');
      const imgEl = card.querySelector('.project-image img');
      const tagsEl = card.querySelector('.project-tags');

      if (titleEl && titleEl.textContent !== proj.title) {
        titleEl.textContent = proj.title;
        changed = true;
      }
      if (descEl && descEl.textContent !== proj.description) {
        descEl.textContent = proj.description;
        changed = true;
      }
      if (imgEl && imgEl.getAttribute('src') !== proj.image) {
        imgEl.setAttribute('src', proj.image);
        changed = true;
      }
      if (tagsEl && Array.isArray(proj.tags)) {
        const spanTexts = [...tagsEl.querySelectorAll('span')].map(
          (s) => s.textContent,
        );
        if (
          spanTexts.length !== proj.tags.length ||
          spanTexts.some((t, i) => t !== proj.tags[i])
        ) {
          tagsEl.innerHTML = proj.tags.map((t) => `<span>${t}</span>`).join('');
          changed = true;
        }
      }
    });

    if (changed && typeof onUpdate === 'function') {
      onUpdate();
    }
  });
}

export function syncLiveTeam({ root, signal }) {
  if (!root) return;
  getContent(signal).then((data) => {
    if (!data?.team || signal?.aborted) return;
    const { leaderTeam, hodsTeams } = data.team;

    // 1. Sync leader team
    if (Array.isArray(leaderTeam)) {
      const leaderCards = [
        ...document.querySelectorAll('.team-cards--leader .team-card'),
      ];
      leaderCards.forEach((card, i) => {
        const member = leaderTeam[i];
        if (!member) return;
        updateTeamCard(card, member);
      });
    }

    // 2. Sync House of Data Sorcerers
    if (Array.isArray(hodsTeams)) {
      const panels = [...root.querySelectorAll('[data-hods-panel]')];
      panels.forEach((panel, pIdx) => {
        const group = hodsTeams[pIdx];
        if (!group || !Array.isArray(group.members)) return;
        const cards = [
          ...panel.querySelectorAll('.team-card:not(.team-card--join)'),
        ];
        cards.forEach((card, mIdx) => {
          const member = group.members[mIdx];
          if (!member) return;
          updateTeamCard(card, member);
        });
      });
    }
  });
}

function updateTeamCard(card, member) {
  const nameEl = card.querySelector('.team-name');
  const roleEl = card.querySelector('.team-role');
  const photoEl = card.querySelector('.team-card-photo');

  if (nameEl && nameEl.textContent?.trim() !== member.name) {
    nameEl.textContent = member.name;
    nameEl.setAttribute('title', member.name);
  }
  if (roleEl && roleEl.textContent?.trim() !== member.role) {
    roleEl.textContent = member.role;
    roleEl.setAttribute('title', member.role);
  }
  if (photoEl && member.photo) {
    const uploaded = member.photo.startsWith('/images/cms/team/');
    const targetSrc = uploaded
      ? member.photo
      : `/images/team/${member.photo}.webp`;
    if (photoEl.getAttribute('src') !== targetSrc) {
      photoEl.setAttribute('src', targetSrc);
      if (uploaded) {
        photoEl.removeAttribute('srcset');
        photoEl.className = 'team-card-photo is-uploaded';
      } else {
        photoEl.className = `team-card-photo is-${member.photo}`;
      }
    }
  }
}
