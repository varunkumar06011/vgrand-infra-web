export const metadata = {
  title: 'Terms & Conditions | V Grand Infra',
  description: 'Terms and conditions for using the V Grand Infra website and services.',
}

type BulletItem = string | { text: string; subItems: string[] };
type ContentItem = { type: 'paragraph'; text: string } | { type: 'bullets'; items: BulletItem[] };
type Section = { title: string; content: ContentItem[] };

const sections: Section[] = [
  {
    title: '1. Company Information',
    content: [
      { type: 'paragraph', text: 'Company Name: Vgrand Infra' },
      { type: 'paragraph', text: 'Operating Region: All India' },
      { type: 'paragraph', text: 'Phone: +91 90301 43333' },
      { type: 'paragraph', text: 'Email: sales@vgrandgroup.com' },
    ],
  },
  {
    title: '2. Use of Website',
    content: [
      { type: 'bullets', items: [
        'The content on this Website is for general informational and marketing purposes only.',
        'You agree to use this Website only for lawful purposes and in compliance with all applicable laws of India.',
        'You must not misuse this Website by introducing viruses, attempting unauthorized access, or engaging in fraudulent or illegal activities.',
      ]},
    ],
  },
  {
    title: '3. Services',
    content: [
      { type: 'paragraph', text: 'Vgrand Infra provides services across India including:' },
      { type: 'bullets', items: [
        'Real estate promotions and marketing',
        'Property listings and project information',
        'Lead generation via digital and offline campaigns',
        'Advertising across platforms (Google, Meta, and other networks)',
      ]},
      { type: 'paragraph', text: 'All services are subject to availability and may be modified without prior notice.' },
    ],
  },
  {
    title: '4. Lead Collection & User Consent',
    content: [
      { type: 'paragraph', text: 'By submitting your contact details, including your name, phone number, email address, or other information, through our Website, landing pages, advertisements, or other forms, you consent to us contacting you regarding your inquiry, properties, services, and relevant promotional information through calls, SMS, WhatsApp, or email, subject to applicable laws and telecommunications regulations.' },
      { type: 'paragraph', text: 'Your information may be shared with our internal teams and authorized service providers or partners where reasonably necessary to respond to your inquiry or provide relevant services.' },
      { type: 'paragraph', text: 'You may withdraw your consent or opt out of marketing communications at any time by contacting sales@vgrandgroup.com.' },
    ],
  },
  {
    title: '5. Advertising & Third-Party Platforms',
    content: [
      { type: 'bullets', items: [
        'We run advertisements across India on platforms including Google, Meta (Facebook/Instagram), and other advertising networks.',
        'Information submitted via advertisements is governed by these Terms and our Privacy Policy.',
        { text: 'We are not responsible for:', subItems: [
          'Platform outages or disruptions',
          'Ad delivery issues',
          'Changes in third-party platform policies',
        ]},
      ]},
    ],
  },
  {
    title: '6. Property Information Disclaimer',
    content: [
      { type: 'bullets', items: [
        { text: 'All project details, pricing, availability, and specifications:', subItems: [
          'Are subject to change without prior notice',
          'Are provided by developers/builders or internal sources',
          'May vary across locations and market conditions in India',
        ]},
        { text: 'We do not guarantee:', subItems: [
          'Exact pricing',
          'Availability of units',
          'Investment returns',
        ]},
      ]},
      { type: 'paragraph', text: 'Users are strongly advised to independently verify all details before making decisions.' },
    ],
  },
  {
    title: '7. RERA',
    content: [
      { type: 'paragraph', text: 'Where applicable, property and project information may be subject to the Real Estate (Regulation and Development) Act, 2016 (RERA) and applicable state regulations. Users are advised to independently verify the project\'s registration, approvals, pricing, availability, and other relevant details with the concerned developer/promoter and applicable regulatory authority before making any decision.' },
    ],
  },
  {
    title: '8. Intellectual Property',
    content: [
      { type: 'bullets', items: [
        'All content on this Website (text, images, logos, graphics, design) is owned by Vgrand Infra unless stated otherwise.',
        'Unauthorized use, reproduction, or distribution is strictly prohibited.',
      ]},
    ],
  },
  {
    title: '9. Limitation of Liability',
    content: [
      { type: 'bullets', items: [
        { text: 'Vgrand Infra shall not be liable for:', subItems: [
          'Any direct or indirect loss arising from use of the Website',
          'Errors or omissions in content',
          'Decisions taken based on Website or advertisement information',
        ]},
      ]},
      { type: 'paragraph', text: 'Use of the Website is at your own risk.' },
    ],
  },
  {
    title: '10. Third-Party Links',
    content: [
      { type: 'bullets', items: [
        'Our Website may include links to third-party websites.',
        'We are not responsible for their content, policies, or practices.',
      ]},
    ],
  },
  {
    title: '11. Payments (If Applicable)',
    content: [
      { type: 'bullets', items: [
        { text: 'Any payments made for services or bookings:', subItems: [
          'Are subject to separate agreements or invoices',
          'May be non-refundable unless explicitly stated',
        ]},
        'We do not process or accept payments without proper authorization and documentation.',
      ]},
    ],
  },
  {
    title: '12. Privacy',
    content: [
      { type: 'bullets', items: [
        'Your use of this Website is also governed by our Privacy Policy.',
        'While we take reasonable steps to protect data, we do not guarantee absolute security.',
      ]},
    ],
  },
  {
    title: '13. Compliance with Indian Laws',
    content: [
      { type: 'paragraph', text: 'We operate across India and comply with applicable laws including:' },
      { type: 'bullets', items: [
        'Information Technology Act, 2000',
        'Digital Personal Data Protection Act, 2023',
        'Consumer Protection Act, 2019',
        'Advertising Standards Council of India (ASCI) Guidelines',
      ]},
    ],
  },
  {
    title: '14. Termination',
    content: [
      { type: 'paragraph', text: 'We reserve the right to:' },
      { type: 'bullets', items: [
        'Restrict or terminate access to the Website',
        'Remove content or user data',
        'Take appropriate legal action in case of misuse',
      ]},
    ],
  },
  {
    title: '15. Changes to Terms',
    content: [
      { type: 'bullets', items: [
        'These Terms may be updated at any time without prior notice.',
        'Continued use of the Website constitutes acceptance of updated Terms.',
      ]},
    ],
  },
  {
    title: '16. Governing Law & Jurisdiction',
    content: [
      { type: 'bullets', items: [
        'These Terms shall be governed by the laws of India.',
        'Any disputes shall be subject to the jurisdiction of courts in Telangana / Andhra Pradesh, as applicable.',
      ]},
    ],
  },
  {
    title: '17. Contact Us',
    content: [
      { type: 'paragraph', text: 'For any questions regarding these Terms:' },
      { type: 'paragraph', text: 'Phone: +91 90301 43333' },
      { type: 'paragraph', text: 'Email: sales@vgrandgroup.com' },
    ],
  },
];

function renderContent(content: ContentItem[]) {
  return content.map((item, i) => {
    if (item.type === 'paragraph') {
      return (
        <p key={i} style={{ color: '#555', fontSize: 15, lineHeight: 1.85, margin: '0 0 12px 0' }}>
          {item.text}
        </p>
      );
    }
    return (
      <ul key={i} style={{ color: '#555', fontSize: 15, lineHeight: 1.85, margin: '0 0 12px 0', paddingLeft: 24, listStyleType: 'disc' }}>
        {item.items.map((bullet, j) => {
          if (typeof bullet === 'string') {
            return <li key={j} style={{ marginBottom: 6 }}>{bullet}</li>;
          }
          return (
            <li key={j} style={{ marginBottom: 6 }}>
              {bullet.text}
              <ul style={{ marginTop: 6, paddingLeft: 24, listStyleType: 'circle' }}>
                {bullet.subItems.map((sub, k) => (
                  <li key={k} style={{ marginBottom: 4 }}>{sub}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  });
}

export default function TermsAndConditionsPage() {
  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ background: '#1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)', color: '#fff', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>Terms &amp; Conditions</h1>
          <p style={{ color: '#ccc', fontSize: 16, lineHeight: 1.7 }}>Last updated: 10 August 2026</p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: '40px 32px', border: '1px solid #e8d5d5' }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.85, margin: '0 0 12px 0' }}>
              Welcome to Vgrand Infra (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;). These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of our website www.vgrandgroup.com (&ldquo;Website&rdquo;) and our services across India.
            </p>
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.85, margin: 0 }}>
              By accessing or using this Website, you agree to comply with and be bound by these Terms. If you do not agree, please do not use this Website.
            </p>
          </div>
          {sections.map((section) => (
            <div key={section.title} style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#1a1a1a', fontWeight: 700, marginBottom: 12 }}>{section.title}</h2>
              {renderContent(section.content)}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
