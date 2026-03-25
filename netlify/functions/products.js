// Single source of truth for all product definitions.
// Used by: create-checkout, stripe-webhook, download, get-downloads.

var PRODUCTS = {
  'start-book': {
    name: 'Start Ready Book',
    description: 'The personal finance playbook for your first decade of adult life.',
    price: 999,
    file: '/products/a7e2f19d3b064c81/Start_Ready_Book.pdf',
    mime: 'application/pdf'
  },
  'book': {
    name: 'Raise Ready Book',
    description: 'The operator-led guide to building a financial model that closes rounds.',
    price: 999,
    file: '/products/8330624caf17f4c6/Raise_Ready_Book.pdf',
    mime: 'application/pdf'
  },
  'exit-book': {
    name: 'Exit Ready Book',
    description: 'The systematic playbook for maximizing your exit.',
    price: 999,
    file: '/products/f83d3651800e29cf/Exit_Ready_Book.pdf',
    mime: 'application/pdf'
  },
  'tpl-complete': {
    name: 'Complete Financial Model',
    description: '15-sheet investor-ready model: Revenue, Headcount, P&L, Cash Flow, Balance Sheet, KPI Dashboard, Cap Table, Fundraise Scenarios, Sensitivity, Cohort Analysis, Monthly Dashboard, Scenarios, Data Room.',
    price: 4900,
    file: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  'tpl-personal-finance': {
    name: 'Personal Finance Workbook',
    description: '9-sheet workbook: Setup, Budget 50/30/20, Debt Payoff, Housing Rent vs Buy, Investment Projections, Retirement Planning, Wealth Dashboard, Financial Health Summary. 141 formulas.',
    price: 4900,
    file: '/products/pf001/Personal_Finance_Workbook.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  'tpl-complete-support': {
    name: 'Complete Financial Model + 1hr Video Support',
    description: '15-sheet model with 17 charts plus a 1-hour video walkthrough session.',
    price: 29900,
    file: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    service: true
  },
  'audit-990': {
    name: 'Fundraising Readiness Audit',
    description: '2-3 hour deep-dive reviewing your model, deck, data room, and plan.',
    price: 99000,
    service: true
  },
  'advisory-2000': {
    name: 'Fractional Fundraise Advisory (1 month)',
    description: 'Ongoing advisory through an active fundraise.',
    price: 200000,
    service: true
  },
  'model-build-5000': {
    name: 'Model Build',
    description: 'Complete financial model build with 8 hours of support.',
    price: 500000,
    service: true
  },
  'investor-pkg-8000': {
    name: 'Investor Materials Package',
    description: 'Pitch deck + model + data room + investor list.',
    price: 800000,
    service: true
  },
  'model-session-299': {
    name: 'Complete Model + 1hr Video Session',
    description: 'Complete financial model template plus a 1-hour video walkthrough.',
    price: 29900,
    service: true
  },
  'preseed-modeling-1000': {
    name: 'Pre-Seed Modeling',
    description: 'Foundation model built with your assumptions.',
    price: 100000,
    service: true
  },
  'seed-modeling-2000': {
    name: 'Seed Modeling',
    description: 'Full cohort-based model with channel economics and scenarios.',
    price: 200000,
    service: true
  },
  'seriesa-modeling-4000': {
    name: 'Series A Modeling',
    description: 'Multi-product model with departmental headcount planning.',
    price: 400000,
    service: true
  },
  'seriesb-modeling-8000': {
    name: 'Series B Modeling',
    description: 'Enterprise-grade model with multi-geography and balance sheet.',
    price: 800000,
    service: true
  },
  'consultation-50': {
    name: '30-Minute Strategy Call',
    description: '30-minute call to discuss your needs. Fee is deducted from any service you purchase.',
    price: 5000,
    service: true
  },
  'job-posting-99': {
    name: 'Job Board Listing (3 months)',
    description: 'Featured job listing on the Raise Ready finance job board for 3 months.',
    price: 9900,
    service: true
  },
  'fm-pro-export': {
    name: 'Financial Model Builder Export',
    description: 'Excel with live formulas and PDF with charts.',
    price: 1000,
    digital: true
  }
};

var SITE_URL = 'https://www.raisereadybook.com';
var ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'papoutsis89@gmail.com';
var CALENDLY_URL = 'https://calendly.com/yannipapoutsi';

// HTML-escape a string to prevent XSS in email templates
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Validate email format (stricter than bare minimum)
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Must have local@domain.tld, no consecutive dots, reasonable length
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email)
    && email.length <= 254;
}

// Validate URL is on our domain or an allowed external domain (safe against substring attacks)
var ALLOWED_REDIRECT_HOSTS = ['www.raisereadybook.com', 'raisereadybook.com', 'calendly.com'];
function isOurUrl(url) {
  try {
    var parsed = new URL(url);
    return ALLOWED_REDIRECT_HOSTS.indexOf(parsed.hostname) !== -1;
  } catch (e) {
    return false;
  }
}

module.exports = {
  PRODUCTS: PRODUCTS,
  SITE_URL: SITE_URL,
  ADMIN_EMAIL: ADMIN_EMAIL,
  CALENDLY_URL: CALENDLY_URL,
  escapeHtml: escapeHtml,
  isValidEmail: isValidEmail,
  isOurUrl: isOurUrl
};
