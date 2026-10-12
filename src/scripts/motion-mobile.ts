// Mobile keeps short one-time entrances without the desktop GSAP/parallax
// runtime. Content stays visible when JS/IntersectionObserver is unavailable.
export function initMobileMotion(): () => void {
  const animations = new Set<Animation>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const animation = entry.target.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 200, easing: 'ease-out' },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    },
    { rootMargin: '0px', threshold: 0.05 },
  );
  document
    .querySelectorAll(
      '.philosophy .heading, .philosophy .illustration, .principles > li, ' +
        '.what-we-do .section-heading, .pillar, .domains header, ' +
        '.projects header, .project-stage, .recruitment-panel, ' +
        '.our-team .team-header, .team-card, .footer .top',
    )
    .forEach((element) => observer.observe(element));
  return () => {
    observer.disconnect();
    for (const animation of animations) animation.cancel();
    animations.clear();
  };
}
