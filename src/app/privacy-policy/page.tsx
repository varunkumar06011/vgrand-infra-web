import type { ReactNode } from 'react';

export const metadata = {
  title: 'Privacy Policy | V Grand Infra',
  description: 'Privacy policy describing how V Grand Infra collects, uses, and protects your personal information.',
}

const sectionTitle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  color: '#1a1a1a',
  fontWeight: 700,
  marginBottom: 12,
} as const;

const paragraph = {
  color: '#555',
  fontSize: 15,
  lineHeight: 1.85,
  margin: '0 0 12px',
} as const;

const bulletList = {
  color: '#555',
  fontSize: 15,
  lineHeight: 1.85,
  margin: '8px 0 12px',
  paddingLeft: 24,
  listStyleType: 'disc',
} as const;

const subLabel = {
  color: '#1a1a1a',
  fontSize: 15,
  fontWeight: 600,
  margin: '16px 0 4px',
} as const;

const email = 'sales@vgrandgroup.com';

const sections: { title: string; content: ReactNode }[] = [
  {
    title: '1. Information We Collect',
    content: (
      <>
        <p style={paragraph}>We may collect the following types of information:</p>
        <p style={subLabel}>a) Personal Information</p>
        <ul style={bulletList}>
          <li>Name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>City/location</li>
          <li>Any details you submit via forms, ads, or inquiries</li>
        </ul>
        <p style={subLabel}>b) Automatically Collected Data</p>
        <ul style={bulletList}>
          <li>IP address</li>
          <li>Device type and browser</li>
          <li>Pages visited and time spent</li>
          <li>Cookies and tracking data</li>
        </ul>
        <p style={subLabel}>c) Lead Data from Advertisements</p>
        <ul style={bulletList}>
          <li>Information submitted through platforms such as Google Ads, Meta (Facebook/Instagram), landing pages, and third-party campaigns.</li>
        </ul>
      </>
    ),
  },
  {
    title: '2. How We Use Your Information',
    content: (
      <>
        <p style={paragraph}>We use your information for:</p>
        <ul style={bulletList}>
          <li>Contacting you regarding properties, services, or inquiries</li>
          <li>Providing real estate project details and offers</li>
          <li>Lead management and sales follow-ups</li>
          <li>Running marketing campaigns and advertisements</li>
          <li>Improving our Website and user experience</li>
          <li>Compliance with legal obligations</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Consent for Communication',
    content: (
      <>
        <p style={paragraph}>
          By submitting your contact details through our Website, advertisements, landing pages, or other forms, you consent to receive communications from us through calls, SMS, WhatsApp, and email regarding your inquiries, properties, services, and relevant promotional information, subject to applicable laws and telecommunications regulations.
        </p>
        <p style={paragraph}>
          You may withdraw your consent or opt out of marketing communications at any time by contacting us at <a href={`mailto:${email}`} style={{ color: '#C0392B', textDecoration: 'none' }}>{email}</a>.
        </p>
      </>
    ),
  },
  {
    title: '4. Sharing of Information',
    content: (
      <>
        <p style={paragraph}>We may share your information with:</p>
        <ul style={bulletList}>
          <li>Internal sales and marketing teams</li>
          <li>Authorized channel partners and real estate developers</li>
          <li>Third-party service providers (CRM tools, ad platforms, analytics tools)</li>
        </ul>
        <p style={paragraph}>We do not sell your personal data to unauthorized third parties.</p>
      </>
    ),
  },
  {
    title: '5. Data Protection & Security',
    content: (
      <ul style={bulletList}>
        <li>We implement reasonable security measures to protect your data</li>
        <li>Access to personal data is restricted to authorized personnel</li>
        <li>However, no online system is 100% secure, and we cannot guarantee absolute security</li>
      </ul>
    ),
  },
  {
    title: '6. Cookies & Tracking Technologies',
    content: (
      <>
        <p style={paragraph}>We use cookies and similar technologies to:</p>
        <ul style={bulletList}>
          <li>Analyze Website traffic</li>
          <li>Improve user experience</li>
          <li>Track ad performance and remarketing campaigns</li>
        </ul>
        <p style={paragraph}>You can control cookies through your browser settings.</p>
      </>
    ),
  },
  {
    title: '7. Third-Party Platforms',
    content: (
      <>
        <p style={paragraph}>
          Our advertisements and services may be delivered through platforms including Google Ads, Meta (Facebook/Instagram), and other advertising networks.
        </p>
        <p style={paragraph}>
          These third-party platforms may independently collect and process information in accordance with their own privacy policies and terms. We encourage you to review the privacy policies of such platforms when interacting with their services.
        </p>
      </>
    ),
  },
  {
    title: '8. Data Retention',
    content: (
      <>
        <p style={paragraph}>
          We retain personal information only for as long as reasonably necessary to fulfil the purposes described in this Privacy Policy, maintain business records, comply with legal obligations, resolve disputes, and enforce applicable agreements.
        </p>
        <p style={paragraph}>
          Where personal information is no longer required, we will delete or anonymize it, subject to applicable legal and regulatory requirements.
        </p>
        <p style={paragraph}>
          You may request deletion of your personal information by contacting us at <a href={`mailto:${email}`} style={{ color: '#C0392B', textDecoration: 'none' }}>{email}</a>.
        </p>
      </>
    ),
  },
  {
    title: '9. Your Rights',
    content: (
      <>
        <p style={paragraph}>Subject to applicable Indian data protection laws and regulations, you may have rights including:</p>
        <ul style={bulletList}>
          <li>Requesting access to your personal information</li>
          <li>Requesting correction or deletion of your personal information</li>
          <li>Withdrawing consent where processing is based on consent</li>
          <li>Raising a grievance regarding the processing of your personal information</li>
        </ul>
        <p style={paragraph}>
          To exercise your rights or submit a data-related request, contact us at <a href={`mailto:${email}`} style={{ color: '#C0392B', textDecoration: 'none' }}>{email}</a>.
        </p>
      </>
    ),
  },
  {
    title: '10. Children\u2019s Privacy',
    content: (
      <ul style={bulletList}>
        <li>Our services are not intended for individuals under 18 years of age</li>
        <li>We do not knowingly collect data from minors</li>
      </ul>
    ),
  },
  {
    title: '11. Compliance with Indian Laws',
    content: (
      <>
        <p style={paragraph}>
          We seek to operate our Website and services in accordance with applicable Indian laws and regulations, including, where applicable:
        </p>
        <ul style={bulletList}>
          <li>Information Technology Act, 2000</li>
          <li>Digital Personal Data Protection Act, 2023 and applicable rules</li>
          <li>Consumer Protection Act, 2019</li>
          <li>Applicable advertising, telecommunications, and data protection regulations</li>
        </ul>
      </>
    ),
  },
  {
    title: '12. Changes to Privacy Policy',
    content: (
      <ul style={bulletList}>
        <li>We may update this Privacy Policy from time to time</li>
        <li>Updates will be posted on this page with the revised date</li>
        <li>Continued use of the Website indicates acceptance of changes</li>
      </ul>
    ),
  },
  {
    title: '13. Contact Us',
    content: (
      <>
        <p style={paragraph}>For any questions, concerns, or data requests:</p>
        <p style={paragraph}>
          Phone: <a href="tel:+919030143333" style={{ color: '#C0392B', textDecoration: 'none' }}>+91 90301 43333</a>
          <br />
          Email: <a href={`mailto:${email}`} style={{ color: '#C0392B', textDecoration: 'none' }}>{email}</a>
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ background: '#1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)', color: '#fff', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>Privacy Policy</h1>
          <p style={{ color: '#ccc', fontSize: 16, lineHeight: 1.7 }}>Last updated: 10 August 2026</p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: '40px 32px', border: '1px solid #e8d5d5' }}>
          <p style={{ ...paragraph, marginBottom: 32 }}>
            This Privacy Policy describes how Vgrand Infra (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) collects, uses, stores, and protects your information when you visit our website www.vgrandgroup.com (&ldquo;Website&rdquo;) or interact with our advertisements and services across India.
          </p>
          <p style={{ ...paragraph, marginBottom: 40 }}>
            By using our Website or submitting your information, you agree to the practices described in this Policy.
          </p>
          {sections.map((section) => (
            <div key={section.title} style={{ marginBottom: 32 }}>
              <h2 style={sectionTitle}>{section.title}</h2>
              {section.content}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
