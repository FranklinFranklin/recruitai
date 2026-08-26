import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

interface CVData {
  id: string;
  fileName: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  summary: string;
  skills: string[];
  languages: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    period: string;
  }[];
}

const candidates: CVData[] = [
  {
    id: 'sanne-van-den-berg',
    fileName: 'CV_Sanne_van_den_Berg_Senior_Corporate_Recruiter.pdf',
    name: 'Sanne van den Berg',
    title: 'Senior Corporate Recruiter & Talent Acquisition Lead',
    email: 'sanne.vandenberg@recruitment-pro.nl',
    phone: '+31 6 1122 3344',
    city: 'Amsterdam, Nederland',
    summary: 'Gedreven en resultaatgerichte Corporate Recruiter met 8+ jaar ervaring in end-to-end talent acquisition binnen scale-ups en multinationals. Gespecialiseerd in tech sourcing, employer branding en het optimaliseren van recruitment workflows.',
    skills: [
      'Campus Recruitment',
      'Talent Sourcing',
      'LinkedIn Recruiter',
      'Stakeholder Management',
      'Applicant Tracking Systems (ATS)'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C2)', 'Duits (Zakelijk B2)'],
    experience: [
      {
        role: 'Senior Corporate Recruiter & Talent Lead',
        company: 'NovaScale Technologies B.V., Amsterdam',
        period: 'jan 2021 – heden',
        highlights: [
          'Verantwoordelijk voor het aannemen van 60+ hooggekwalificeerde software engineers en managers per jaar.',
          'Implementeerde een modern ATS systeem wat leidde tot 35% kortere time-to-hire en hogere kandidaat-tevredenheid.',
          'Leidde het campus recruitment programma en zette strategische partnerships op met universiteiten.'
        ]
      },
      {
        role: 'Corporate Recruiter',
        company: 'TalentHub Nederland, Utrecht',
        period: 'mrt 2018 – dec 2020',
        highlights: [
          'Managede het gehele werving & selectieproces voor commerciële en IT-functies.',
          'Gecoacht van hiring managers op het gebied van gestructureerde interviews en diversiteit in recruitment.'
        ]
      }
    ],
    education: [
      {
        degree: 'MSc Human Resource Management',
        institution: 'Vrije Universiteit Amsterdam',
        period: '2016 – 2018'
      },
      {
        degree: 'BSc Psychologie & Arbeidsorganisatie',
        institution: 'Universiteit Utrecht',
        period: '2013 – 2016'
      }
    ]
  },
  {
    id: 'mark-de-jong',
    fileName: 'CV_Mark_de_Jong_Senior_Full_Stack_Developer.pdf',
    name: 'Mark de Jong',
    title: 'Senior Full Stack Developer',
    email: 'mark.dejong.dev@techmail.nl',
    phone: '+31 6 2233 4455',
    city: 'Utrecht, Nederland',
    summary: 'Ervaren Full Stack Developer met 6+ jaar expertise in moderne webarchitecturen, microservices en high-performance cloud applicaties. Sterke focus op schaalbare Next.js en Node.js oplossingen met TypeScript.',
    skills: [
      'TypeScript',
      'Next.js',
      'Node.js',
      'PostgreSQL',
      'Tailwind CSS'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C1)'],
    experience: [
      {
        role: 'Lead Full Stack Developer',
        company: 'CodeCraft Solutions, Utrecht',
        period: 'apr 2021 – heden',
        highlights: [
          'Architectuur en ontwikkeling van multi-tenant SaaS platformen met Next.js, TypeScript en PostgreSQL.',
          'Optimaliseerde database queries en caching mechanismen, resulterend in 50% lagere response times.',
          'Begeleiding van junior en medior developers door middel van code reviews en technische workshops.'
        ]
      },
      {
        role: 'Full Stack Developer',
        company: 'WebPulse Digital Agency, Hilversum',
        period: 'sep 2019 – mrt 2021',
        highlights: [
          'Bouw van interactieve front-end interfaces en REST APIs voor e-commerce klanten.',
          'Opzetten van geautomatiseerde CI/CD pipelines en unit test suites.'
        ]
      }
    ],
    education: [
      {
        degree: 'BSc Informatica (Computer Science)',
        institution: 'Hogeschool Utrecht',
        period: '2015 – 2019'
      }
    ]
  },
  {
    id: 'anouk-visser',
    fileName: 'CV_Anouk_Visser_HR_Business_Partner.pdf',
    name: 'Anouk Visser',
    title: 'HR Business Partner & Organizational Advisor',
    email: 'anouk.visser@hr-advisory.nl',
    phone: '+31 6 3344 5566',
    city: 'Rotterdam, Nederland',
    summary: 'Strategische HR Business Partner met 9+ jaar ervaring in het adviseren van directies en management over organisatieontwikkeling, veranderprocessen en talent management.',
    skills: [
      'Verandermanagement',
      'Arbeidsrecht',
      'Talent Development',
      'Performance Management',
      'HR Analytics'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C1)', 'Frans (Basis A2)'],
    experience: [
      {
        role: 'Senior HR Business Partner',
        company: 'Haven & Logistics Group, Rotterdam',
        period: 'feb 2020 – heden',
        highlights: [
          'Strategisch sparringpartner voor 5 directieleden over reorganisaties, cultuurverandering en succession planning.',
          'Ontwikkelde en implementeerde een nieuw beoordelings- en beloningssysteem voor 400+ medewerkers.',
          'Verlaagde het ziekteverzuim van 6.8% naar 3.4% door proactief vitaliteitsbeleid.'
        ]
      },
      {
        role: 'HR Adviseur',
        company: 'Delta Retail Services, Den Haag',
        period: 'sep 2016 – jan 2020',
        highlights: [
          'Behandelen van complexe arbeidsrechtelijke dossiers en verzuimtrajecten (Wet Verbetering Poortwachter).',
          'Faciliteren van leiderschapstrainingen voor teamleiders.'
        ]
      }
    ],
    education: [
      {
        degree: 'MSc Beleid, Communicatie en Organisatie',
        institution: 'Erasmus Universiteit Rotterdam',
        period: '2014 – 2016'
      },
      {
        degree: 'BSc Human Resource Management',
        institution: 'Hogeschool Rotterdam',
        period: '2010 – 2014'
      }
    ]
  },
  {
    id: 'bas-meijer',
    fileName: 'CV_Bas_Meijer_Cloud_Solutions_Architect.pdf',
    name: 'Bas Meijer',
    title: 'Cloud Solutions Architect',
    email: 'bas.meijer@cloudinfra.nl',
    phone: '+31 6 4455 6677',
    city: 'Eindhoven, Nederland',
    summary: 'Senior Cloud Architect met 11+ jaar ervaring in het ontwerpen en implementeren van robuuste, veilige AWS en hybrid cloud architecturen voor enterprise ondernemingen.',
    skills: [
      'AWS Cloud',
      'Kubernetes',
      'Terraform',
      'CI/CD Pipelines',
      'Microservices'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C2)'],
    experience: [
      {
        role: 'Principal Cloud Architect',
        company: 'HighTech Solutions B.V., Eindhoven',
        period: 'mei 2019 – heden',
        highlights: [
          'Leidde de migratie van on-premise datacenter naar AWS voor een financieel platform met 99.99% uptime SLA.',
          'Implementeerde Infrastructure as Code (IaC) met Terraform en Kubernetes cluster orchestratie.',
          'Gerealiseerde cloud cost-optimalisatie die de operationele kosten met €180.000 per jaar reduceerde.'
        ]
      },
      {
        role: 'Senior DevOps & Cloud Engineer',
        company: 'Brainport Software, Eindhoven',
        period: 'jan 2015 – apr 2019',
        highlights: [
          'Ontwierp zero-downtime deployment pipelines met GitHub Actions en Docker containerization.',
          'Verantwoordelijk voor security compliance en ISO 27001 certificering.'
        ]
      }
    ],
    education: [
      {
        degree: 'MSc Computer Science & Embedded Systems',
        institution: 'Technische Universiteit Eindhoven (TU/e)',
        period: '2012 – 2014'
      },
      {
        degree: 'BSc Technische Informatica',
        institution: 'Fontys Hogescholen Eindhoven',
        period: '2008 – 2012'
      }
    ]
  },
  {
    id: 'fleur-bakker',
    fileName: 'CV_Fleur_Bakker_Lead_Product_Designer.pdf',
    name: 'Fleur Bakker',
    title: 'Lead Product Designer (UI/UX)',
    email: 'fleur.bakker.design@creativestudio.nl',
    phone: '+31 6 5566 7788',
    city: 'Amsterdam, Nederland',
    summary: 'Creatieve en data-gedreven Product Designer met 7+ jaar ervaring in het ontwerpen van intuïtieve B2B en B2C interfaces. Specialist in design systems en gebruikersgericht ontwerponderzoek.',
    skills: [
      'Figma',
      'Design Systems',
      'User Research',
      'Prototyping',
      'Design Thinking'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C1)'],
    experience: [
      {
        role: 'Lead UI/UX Designer',
        company: 'Studio Digital Flow, Amsterdam',
        period: 'aug 2020 – heden',
        highlights: [
          'Ontwikkelde het complete enterprise Design System in Figma, gebruikt door 35+ developers en designers.',
          'Voerde kwalitatief en kwantitatief gebruikersonderzoek uit wat leidde tot 28% hogere conversie in de checkout flow.',
          'Aansturing en mentoring van een team van 4 UI/UX designers.'
        ]
      },
      {
        role: 'UX Designer',
        company: 'Creative Apps Agency, Utrecht',
        period: 'sep 2017 – jul 2020',
        highlights: [
          'Ontwerpen van interactieve prototypes, wireframes en user journey maps voor fintech klanten.',
          'Faciliteren van Design Thinking workshops met stakeholders en eindgebruikers.'
        ]
      }
    ],
    education: [
      {
        degree: 'BSc Communication and Multimedia Design (CMD)',
        institution: 'Hogeschool van Amsterdam (HvA)',
        period: '2013 – 2017'
      }
    ]
  },
  {
    id: 'wouter-van-dijk',
    fileName: 'CV_Wouter_van_Dijk_Senior_Financieel_Controller.pdf',
    name: 'Wouter van Dijk',
    title: 'Senior Financieel Controller',
    email: 'wouter.vandijk@finance-experts.nl',
    phone: '+31 6 6677 8899',
    city: 'Den Haag, Nederland',
    summary: 'Analytische Senior Controller met 10+ jaar ervaring in planning & control cyclus, IFRS verslaglegging en financiële procesoptimalisatie binnen internationale ondernemingen.',
    skills: [
      'Financiële Rapportage',
      'IFRS',
      'Power BI',
      'SAP S/4HANA',
      'Budgettering'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C1)', 'Duits (Goed B2)'],
    experience: [
      {
        role: 'Senior Group Controller',
        company: 'Global Trade Logistics N.V., Den Haag',
        period: 'nov 2019 – heden',
        highlights: [
          'Verantwoordelijk voor geconsolideerde maandrapportages en jaarrekeningen conform IFRS voor 8 entiteiten.',
          'Implementeerde interactieve Power BI dashboards voor real-time margin tracking en cashflow forecasting.',
          'Begeleidde succesvol het externe audit traject met Big-4 accountantskantoor.'
        ]
      },
      {
        role: 'Business Controller',
        company: 'WestCoast Retail, Rotterdam',
        period: 'mrt 2015 – okt 2019',
        highlights: [
          'Ondersteunen van business unit managers bij business cases, investeringsbeslissingen en kostenbewaking.',
          'Optimalisatie van administratieve processen in SAP.'
        ]
      }
    ],
    education: [
      {
        degree: 'Executive Master of Finance & Control (RC)',
        institution: 'Erasmus School of Accounting & Assurance',
        period: '2016 – 2018'
      },
      {
        degree: 'MSc Accounting & Financial Management',
        institution: 'Erasmus Universiteit Rotterdam',
        period: '2013 – 2015'
      }
    ]
  },
  {
    id: 'lieke-jansen',
    fileName: 'CV_Lieke_Jansen_Operations_Supply_Chain_Manager.pdf',
    name: 'Lieke Jansen',
    title: 'Operations & Supply Chain Manager',
    email: 'lieke.jansen@logistics-chain.nl',
    phone: '+31 6 7788 9900',
    city: 'Breda, Nederland',
    summary: 'Resultaatgerichte Supply Chain Manager met 8+ jaar ervaring in logistieke optimalisatie, voorraadbeheer en magazijnautomatisering. Black Belt gecertificeerd in Lean Six Sigma.',
    skills: [
      'Lean Six Sigma',
      'Supply Chain Optimization',
      'Voorraadbeheer (WMS)',
      'Vendor Management',
      'ERP Implementatie'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C1)'],
    experience: [
      {
        role: 'Operations & Supply Chain Manager',
        company: 'DistriHub Brabant B.V., Breda',
        period: 'jun 2020 – heden',
        highlights: [
          'Leidinggevende over de complete operatie van 2 distributiecentra (80+ FTE operationeel personeel).',
          'Implementeerde Lean principes wat leidde tot 22% hogere orderpick efficiëntie en 15% minder inslagfouten.',
          'Onderhandelde strategische contracten met internationale vervoerders met een besparing van €250.000.'
        ]
      },
      {
        role: 'Supply Chain Specialist',
        company: 'CargoDirect Logistics, Tilburg',
        period: 'jan 2017 – mei 2020',
        highlights: [
          'Beheer van supply chain planning, voorraadniveaus en leveranciersprestaties.',
          'Mede-verantwoordelijk voor de succesvolle uitrol van een nieuw WMS systeem.'
        ]
      }
    ],
    education: [
      {
        degree: 'BSc Logistiek Management (Supply Chain)',
        institution: 'Breda University of Applied Sciences (BUas)',
        period: '2012 – 2016'
      }
    ]
  },
  {
    id: 'thomas-smit',
    fileName: 'CV_Thomas_Smit_DevOps_Security_Engineer.pdf',
    name: 'Thomas Smit',
    title: 'DevOps & Security Engineer',
    email: 'thomas.smit.sec@devops-infra.nl',
    phone: '+31 6 8899 0011',
    city: 'Groningen, Nederland',
    summary: 'Gepassioneerde DevOps & Security Engineer met 5+ jaar ervaring in geautomatiseerde deployment infrastructuren, Linux server beheer en zero-trust security architecturen.',
    skills: [
      'Docker',
      'Cybersecurity (ISO 27001)',
      'Linux',
      'Prometheus',
      'Ansible'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C1)'],
    experience: [
      {
        role: 'Senior DevOps & Security Engineer',
        company: 'Nordic Cloud Systems, Groningen',
        period: 'mrt 2022 – heden',
        highlights: [
          'Opzetten en beheren van containerized infrastructuur met Docker en Ansible automation.',
          'Implementatie van 24/7 monitoring en alerting met Prometheus en Grafana.',
          'Uitvoeren van vulnerability assessments en penetration tests conform ISO 27001 normen.'
        ]
      },
      {
        role: 'DevOps Engineer',
        company: 'InnoTech Noord, Assen',
        period: 'feb 2020 – feb 2022',
        highlights: [
          'Beheer van Linux webservers en CI/CD pipeline configuratie.',
          'Automatiseren van back-up en disaster recovery procedures.'
        ]
      }
    ],
    education: [
      {
        degree: 'BSc HBO-ICT (Netwerk & Security Engineering)',
        institution: 'Hanzehogeschool Groningen',
        period: '2016 – 2020'
      }
    ]
  },
  {
    id: 'sophie-hendriks',
    fileName: 'CV_Sophie_Hendriks_Senior_Marketing_Specialist.pdf',
    name: 'Sophie Hendriks',
    title: 'Senior Marketing & Growth Specialist',
    email: 'sophie.hendriks@growth-marketing.nl',
    phone: '+31 6 9900 1122',
    city: 'Utrecht, Nederland',
    summary: 'Creatieve en data-driven Growth Marketeer met 6+ jaar ervaring in B2B inbound marketing, SEA/SEO optimalisatie en marketing automation met HubSpot.',
    skills: [
      'Growth Marketing',
      'Google Analytics 4',
      'SEO / SEA',
      'HubSpot',
      'Content Strategy'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C1)', 'Spaans (Basis A2)'],
    experience: [
      {
        role: 'Senior Growth & Performance Marketeer',
        company: 'ScaleUp Marketing Group, Utrecht',
        period: 'sep 2021 – heden',
        highlights: [
          'Verantwoordelijk voor inbound leadgeneratie campagnes resulterend in +45% gekwalificeerde MQLs.',
          'Beheer van €400k+ jaarlijks Google Ads en LinkedIn Ads budget met een gemiddelde ROAS van 3.8x.',
          'Opzetten van geautomatiseerde lead nurturing workflows en email sequences in HubSpot.'
        ]
      },
      {
        role: 'Digital Marketing Specialist',
        company: 'Creative Media Works, Hilversum',
        period: 'sep 2019 – aug 2021',
        highlights: [
          'Organische vindbaarheid (SEO) verbeterd met +80% toename in organisch zoekverkeer.',
          'Contentcreatie voor whitepapers, case studies en thought leadership artikelen.'
        ]
      }
    ],
    education: [
      {
        degree: 'BSc Commerciële Economie & Digitale Marketing',
        institution: 'Hogeschool Utrecht',
        period: '2015 – 2019'
      }
    ]
  },
  {
    id: 'bram-verhoeven',
    fileName: 'CV_Bram_Verhoeven_Customer_Success_Manager.pdf',
    name: 'Bram Verhoeven',
    title: 'Senior Customer Success & Account Manager',
    email: 'bram.verhoeven@saas-success.nl',
    phone: '+31 6 1234 9876',
    city: 'Rotterdam, Nederland',
    summary: 'Klantgerichte en empathische Customer Success Manager met 7+ jaar ervaring in enterprise SaaS relatiebeheer, onboarding programma\'s en churn reductie.',
    skills: [
      'Key Account Management',
      'SaaS Customer Success',
      'Churn Reduction',
      'Salesforce CRM',
      'Client Onboarding'
    ],
    languages: ['Nederlands (Moedertaal)', 'Engels (Vloeiend C2)'],
    experience: [
      {
        role: 'Senior Customer Success Manager',
        company: 'Enterprise SaaS Solutions, Rotterdam',
        period: 'jan 2021 – heden',
        highlights: [
          'Beheer van strategische portfolio met €3.5M ARR verdeeld over 45 enterprise accounts.',
          'Verlaagde de jaarlijkse gross churn rate van 7.2% naar 2.1% door proactief customer health score monitoring.',
          'Gerealiseerde 125% Net Revenue Retention (NRR) door succesvolle cross-sell en upsell initiatieven.'
        ]
      },
      {
        role: 'Customer Onboarding Specialist',
        company: 'CloudWorks Nederland, Den Haag',
        period: 'okt 2018 – dec 2020',
        highlights: [
          'Begeleiden van nieuwe klanten tijdens het technische en functionele onboarding traject.',
          'Ontwikkelde trainingsmodules en best-practice documentatie in Salesforce.'
        ]
      }
    ],
    education: [
      {
        degree: 'BSc International Business and Management',
        institution: 'Rotterdam University of Applied Sciences',
        period: '2014 – 2018'
      }
    ]
  }
];

async function createCVPdf(candidate: CVData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 format
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette
  const primaryBlue = rgb(0.11, 0.23, 0.44); // #1c3a70
  const accentBlue = rgb(0.18, 0.42, 0.76);  // #2e6bc2
  const textDark = rgb(0.12, 0.15, 0.2);     // #1f2633
  const textMuted = rgb(0.38, 0.44, 0.52);   // #617085
  const bgLight = rgb(0.95, 0.97, 1.0);      // #f2f7ff
  const borderCol = rgb(0.85, 0.89, 0.94);   // #d9e3f0

  // 1. Top Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 110,
    width: width,
    height: 110,
    color: primaryBlue
  });

  // Candidate Name
  page.drawText(candidate.name, {
    x: 40,
    y: height - 45,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // Function Title
  page.drawText(candidate.title, {
    x: 40,
    y: height - 68,
    size: 13,
    font: fontRegular,
    color: rgb(0.78, 0.88, 1.0)
  });

  // Contact Info bar
  const contactText = `${candidate.email}   |   ${candidate.phone}   |   ${candidate.city}`;
  page.drawText(contactText, {
    x: 40,
    y: height - 92,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.9, 0.93, 0.98)
  });

  // Layout: Left Column (width 165), Right Column (width 320)
  const leftX = 40;
  const rightX = 225;
  let leftY = height - 135;
  let rightY = height - 135;

  // --- LEFT COLUMN ---

  // Section: VAARDIGHEDEN
  page.drawText('VAARDIGHEDEN', {
    x: leftX,
    y: leftY,
    size: 11,
    font: fontBold,
    color: primaryBlue
  });
  leftY -= 6;
  page.drawLine({
    start: { x: leftX, y: leftY },
    end: { x: leftX + 155, y: leftY },
    thickness: 1.5,
    color: accentBlue
  });
  leftY -= 16;

  for (const skill of candidate.skills) {
    page.drawRectangle({
      x: leftX,
      y: leftY - 4,
      width: 155,
      height: 18,
      color: bgLight,
      borderColor: borderCol,
      borderWidth: 1
    });
    page.drawText(`•  ${skill}`, {
      x: leftX + 8,
      y: leftY + 1,
      size: 8.5,
      font: fontBold,
      color: textDark
    });
    leftY -= 22;
  }

  leftY -= 15;

  // Section: TALEN
  page.drawText('TALEN', {
    x: leftX,
    y: leftY,
    size: 11,
    font: fontBold,
    color: primaryBlue
  });
  leftY -= 6;
  page.drawLine({
    start: { x: leftX, y: leftY },
    end: { x: leftX + 155, y: leftY },
    thickness: 1.5,
    color: accentBlue
  });
  leftY -= 16;

  for (const lang of candidate.languages) {
    page.drawText(`•  ${lang}`, {
      x: leftX + 4,
      y: leftY,
      size: 8.5,
      font: fontRegular,
      color: textDark
    });
    leftY -= 16;
  }

  leftY -= 15;

  // Section: OPLEIDING
  page.drawText('OPLEIDING', {
    x: leftX,
    y: leftY,
    size: 11,
    font: fontBold,
    color: primaryBlue
  });
  leftY -= 6;
  page.drawLine({
    start: { x: leftX, y: leftY },
    end: { x: leftX + 155, y: leftY },
    thickness: 1.5,
    color: accentBlue
  });
  leftY -= 16;

  for (const edu of candidate.education) {
    page.drawText(edu.degree, {
      x: leftX + 2,
      y: leftY,
      size: 8.5,
      font: fontBold,
      color: textDark
    });
    leftY -= 12;
    page.drawText(edu.institution, {
      x: leftX + 2,
      y: leftY,
      size: 8,
      font: fontRegular,
      color: textMuted
    });
    leftY -= 11;
    page.drawText(edu.period, {
      x: leftX + 2,
      y: leftY,
      size: 7.5,
      font: fontOblique,
      color: accentBlue
    });
    leftY -= 16;
  }

  // --- RIGHT COLUMN ---

  // Section: PERSOONLIJK PROFIEL
  page.drawText('PERSOONLIJK PROFIEL', {
    x: rightX,
    y: rightY,
    size: 11,
    font: fontBold,
    color: primaryBlue
  });
  rightY -= 6;
  page.drawLine({
    start: { x: rightX, y: rightY },
    end: { x: width - 40, y: rightY },
    thickness: 1.5,
    color: accentBlue
  });
  rightY -= 16;

  // Word wrap profile summary
  const summaryWords = candidate.summary.split(' ');
  let currentLine = '';
  const maxLineLen = 65;
  for (const word of summaryWords) {
    if ((currentLine + word).length > maxLineLen) {
      page.drawText(currentLine.trim(), {
        x: rightX,
        y: rightY,
        size: 9,
        font: fontRegular,
        color: textDark
      });
      rightY -= 13;
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine.trim()) {
    page.drawText(currentLine.trim(), {
      x: rightX,
      y: rightY,
      size: 9,
      font: fontRegular,
      color: textDark
    });
    rightY -= 13;
  }

  rightY -= 15;

  // Section: WERKERVARING
  page.drawText('WERKERVARING', {
    x: rightX,
    y: rightY,
    size: 11,
    font: fontBold,
    color: primaryBlue
  });
  rightY -= 6;
  page.drawLine({
    start: { x: rightX, y: rightY },
    end: { x: width - 40, y: rightY },
    thickness: 1.5,
    color: accentBlue
  });
  rightY -= 18;

  for (const job of candidate.experience) {
    // Role Title
    page.drawText(job.role, {
      x: rightX,
      y: rightY,
      size: 10.5,
      font: fontBold,
      color: primaryBlue
    });
    rightY -= 14;

    // Company & Period
    page.drawText(`${job.company}   |   ${job.period}`, {
      x: rightX,
      y: rightY,
      size: 9,
      font: fontOblique,
      color: textMuted
    });
    rightY -= 14;

    // Highlights / bullets
    for (const bullet of job.highlights) {
      const words = bullet.split(' ');
      let bLine = '• ';
      const bMaxLen = 62;
      for (const w of words) {
        if ((bLine + w).length > bMaxLen) {
          page.drawText(bLine.trim(), {
            x: rightX + 6,
            y: rightY,
            size: 8.5,
            font: fontRegular,
            color: textDark
          });
          rightY -= 12;
          bLine = '    ' + w + ' ';
        } else {
          bLine += w + ' ';
        }
      }
      if (bLine.trim()) {
        page.drawText(bLine.trim(), {
          x: rightX + 6,
          y: rightY,
          size: 8.5,
          font: fontRegular,
          color: textDark
        });
        rightY -= 13;
      }
    }
    rightY -= 10;
  }

  // Footer note
  page.drawText('Referenties en portfolio beschikbaar op aanvraag.', {
    x: 40,
    y: 25,
    size: 8,
    font: fontOblique,
    color: textMuted
  });

  return await pdfDoc.save();
}

async function main() {
  const outputDir = path.join(process.cwd(), 'public', 'downloads', 'dummy_cvs');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Generating ${candidates.length} realistic Dutch CVs in PDF format...`);

  const generatedFiles: string[] = [];

  for (const candidate of candidates) {
    const pdfBytes = await createCVPdf(candidate);
    const filePath = path.join(outputDir, candidate.fileName);
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));
    generatedFiles.push(filePath);
    console.log(`✓ Generated: ${candidate.fileName}`);
  }

  // Also create a zip archive
  const zipPath = path.join(process.cwd(), 'public', 'downloads', 'corporate_recruiter_dummy_cvs.zip');
  const zipOutput = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  await new Promise<void>((resolve, reject) => {
    zipOutput.on('close', () => {
      console.log(`✓ Zip package created successfully: ${zipPath} (${archive.pointer()} total bytes)`);
      resolve();
    });
    archive.on('error', (err: unknown) => reject(err));
    archive.pipe(zipOutput);

    for (const filePath of generatedFiles) {
      archive.file(filePath, { name: path.basename(filePath) });
    }
    archive.finalize();
  });

  console.log('All CVs generated and packed successfully!');
}

main().catch(console.error);
