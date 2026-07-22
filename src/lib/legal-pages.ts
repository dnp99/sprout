export type LegalPageKey = "privacy" | "terms" | "security" | "data";

export interface LegalPageSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalPageContent {
  slug: LegalPageKey;
  title: string;
  summary: string;
  lastUpdated: string;
  contactBlurb: string;
  sections: LegalPageSection[];
}

export const SUPPORT_EMAIL = "support@sprout-money.ca";

/** Static v1 legal/trust content. Centralizing it keeps the wording consistent
 *  across page metadata, reading layout, and future footer/settings reuse. */
export const LEGAL_PAGES: Record<LegalPageKey, LegalPageContent> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "Sprout is built to help you budget without pretending your data is a product.",
    lastUpdated: "July 13, 2026",
    contactBlurb: "Questions about privacy or personal information requests",
    sections: [
      {
        heading: "What we collect",
        paragraphs: [
          "Sprout collects the information you use to create and run your account, such as your name, email address, budget settings, categories, recurring items, goals, and the transactions or statements you add to the product.",
          "If you use connected features like Smart Import, WhatsApp capture, Siri shortcuts, or API tokens, Sprout also stores the data needed to make those features work, including uploaded statements, linked channel details, and token metadata.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "We use your data to operate Sprout, sync your account across devices, calculate your budget views, support imports and connected channels, and help you recover access if something goes wrong.",
          "We may also use limited diagnostics and product analytics to understand reliability and improve the app. That information is used to operate Sprout, not to build advertising profiles.",
        ],
      },
      {
        heading: "What we do not do",
        bullets: [
          "We do not sell your personal data.",
          "We do not turn your transaction history into ad targeting.",
          "We do not claim bank-style data access that Sprout does not actually have.",
        ],
      },
      {
        heading: "Service providers",
        paragraphs: [
          "Like most software products, Sprout relies on a small set of service providers to host the app, store account data, and run specific features. Those providers only get the access needed to perform their role for Sprout.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can export your data from inside Sprout and you can request deletion of your account data by contacting support. More detail about export and deletion lives on the Data & Deletion page.",
        ],
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    summary:
      "These terms describe the basic rules for using Sprout and the limits of what the product promises.",
    lastUpdated: "July 13, 2026",
    contactBlurb: "Questions about these terms or how they apply",
    sections: [
      {
        heading: "Using Sprout",
        paragraphs: [
          "You may use Sprout only in a lawful way and only for your own budgeting, planning, or related personal finance workflows unless we explicitly agree otherwise.",
          "You are responsible for the accuracy of the data you add and for keeping your account credentials secure.",
        ],
      },
      {
        heading: "What Sprout provides",
        paragraphs: [
          "Sprout provides software for tracking budgets, logging transactions, importing statements, managing recurring items, and reviewing spending. Features may change over time as the product evolves.",
          "We may suspend or limit access if we need to protect the service, investigate abuse, or comply with legal obligations.",
        ],
      },
      {
        heading: "Your data and content",
        paragraphs: [
          "You keep ownership of the information you submit to Sprout. By using the service, you give us permission to store, process, and display that data only as needed to operate and support the product.",
        ],
      },
      {
        heading: "No financial, tax, or legal advice",
        paragraphs: [
          "Sprout is a budgeting tool. It does not provide financial planning, investment, tax, accounting, or legal advice, and nothing in the app should be treated as a substitute for a qualified professional.",
        ],
      },
      {
        heading: "Limits of liability",
        paragraphs: [
          "We work to keep Sprout reliable, but the service is provided on an as-available basis. To the extent allowed by law, Sprout is not liable for indirect, incidental, or consequential losses resulting from your use of the product.",
        ],
      },
    ],
  },
  security: {
    slug: "security",
    title: "Security Overview",
    summary:
      "Security at Sprout is about clear, limited claims: protecting accounts, protecting transport, and keeping operational access narrow.",
    lastUpdated: "July 13, 2026",
    contactBlurb: "Security questions or responsible disclosure reports",
    sections: [
      {
        heading: "Account protection",
        paragraphs: [
          "Sprout uses authenticated accounts and standard session controls so users can access only their own data. We keep security claims narrow and do not describe controls we have not verified and documented.",
        ],
      },
      {
        heading: "Protected transport",
        paragraphs: [
          "Traffic to Sprout is served over HTTPS. That helps protect data in transit between your device and the service.",
        ],
      },
      {
        heading: "Operational posture",
        paragraphs: [
          "We aim to keep operational access limited and use only the infrastructure and connected services required to run the product. Sprout is privacy-first, which means we prefer simpler system boundaries over broad data collection.",
        ],
      },
      {
        heading: "Connected features",
        paragraphs: [
          "Features like CSV import, WhatsApp capture, Siri shortcuts, and API tokens expand what Sprout can do. They also expand the surface area of the product, so we treat them as optional integrations and document them plainly rather than implying bank-grade sync or compliance programs that do not exist.",
        ],
      },
      {
        heading: "Reporting an issue",
        paragraphs: [
          "If you believe you found a security issue, please email support with as much detail as you can provide, including reproduction steps and the account email involved if relevant. Use the same support address for security reports in v1.",
        ],
      },
    ],
  },
  data: {
    slug: "data",
    title: "Data & Deletion",
    summary:
      "This page explains what account data exists in Sprout, how export works, and how to request deletion.",
    lastUpdated: "July 13, 2026",
    contactBlurb: "Export, deletion, or connected-data questions",
    sections: [
      {
        heading: "What data exists in Sprout",
        paragraphs: [
          "Your account may include profile information, transactions, imports, categories, recurring items, goals, budget settings, linked channel details, and other product settings tied to your login.",
        ],
      },
      {
        heading: "Exporting your data",
        paragraphs: [
          "Sprout includes export functionality so you can download your transaction history. If you need help exporting additional information tied to your account, contact support.",
        ],
      },
      {
        heading: "Deleting your account",
        paragraphs: [
          "You can delete your account yourself from Settings → Security → Delete account. For your protection, deletion requires re-entering your password and typing a confirmation, and it is permanent: it immediately removes your account and its data — transactions, imports, categories, budget, goals, recurring items, connected apps, and API tokens — from active product use, and signs you out everywhere.",
          "If you can't sign in for some reason, you can still email support from the address associated with your Sprout account to request deletion; we may need to confirm ownership first.",
        ],
      },
      {
        heading: "Connected-service caveat",
        paragraphs: [
          "If you used optional connected features, some data may also have existed in those service flows while they were active. Deleting data from Sprout does not automatically delete information held by third-party services outside Sprout's control.",
        ],
      },
      {
        heading: "Retention in plain language",
        paragraphs: [
          "We do not promise retention periods we have not formally operationalized. Our goal is to remove account data from active product use when a valid deletion request is processed and to avoid keeping more data than the product needs.",
        ],
      },
    ],
  },
};

export const LEGAL_RELATED_LINKS: { href: string; label: string }[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/security", label: "Security Overview" },
  { href: "/data", label: "Data & Deletion" },
];
