// VPAT Accessibility Middleware
const addAriaLabels = (req, res, next) => {
  res.locals.aria = {
    label: (text) => `aria-label="${text}"`,
    describedBy: (id) => `aria-describedby="${id}"`,
    expanded: (state) => `aria-expanded="${state}"`,
    hidden: (state) => `aria-hidden="${state}"`,
  };
  next();
};

const addSkipLinks = (req, res, next) => {
  res.locals.skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#footer', text: 'Skip to footer' },
  ];
  next();
};

module.exports = {
  addAriaLabels,
  addSkipLinks,
};
