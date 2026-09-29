export const SITE_NAME = 'SkillMove';
export const SITE_TAGLINE = 'From Learning to Placement';
export const SITE_DESCRIPTION = 'Learn in-demand skills. Build real projects. Prepare for interviews. Access structured placement support.';
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const PRODUCTS = [
  {
    id: 'tech-training',
    code: 'tech_training',
    name: 'Technology Training',
    price: 9999,
    duration: '12 weeks',
    features: [
      'All modules and guided labs',
      'Assignments and two guided projects',
      'Real-world case studies',
      'Lifetime course access',
      'Certificate of completion',
    ],
  },
  {
    id: 'interview-prep',
    code: 'interview_prep',
    name: 'Interview Preparation',
    price: 9999,
    duration: '8 weeks',
    features: [
      'Interview curriculum',
      'AI practice sessions',
      'Three expert mock interviews',
      'Resume optimization',
      'Interview feedback reports',
    ],
  },
  {
    id: 'placement-support',
    code: 'placement_support',
    name: 'Placement Support',
    price: 9999,
    duration: 'On-demand',
    features: [
      'Job matching algorithm',
      'Verified job submissions',
      'Interview coordination',
      'Offer negotiation support',
      'Career counseling',
    ],
  },
  {
    id: 'soft-skills',
    code: 'soft_skills',
    name: 'Corporate Soft Skills',
    price: 5000,
    duration: '4 weeks',
    features: [
      'Communication skills',
      'HR round preparation',
      'Workplace etiquette',
      'Email and presentation skills',
    ],
  },
  {
    id: 'complete-package',
    code: 'complete_package',
    name: 'Complete Package',
    price: 29999,
    duration: '24 weeks',
    features: [
      'All Technology Training modules',
      'All Interview Preparation courses',
      'Full Placement Support access',
      'Corporate Soft Skills training',
      'Priority support',
      'Best value bundle',
    ],
    badge: 'Recommended',
    discount: '15% savings',
  },
];

export const LEARNING_FORMATS = [
  {
    id: 'recorded',
    name: 'Recorded Classes',
    description: 'Learn at your own pace with high-quality video lectures',
    icon: 'Video',
  },
  {
    id: 'live',
    name: 'Live Sessions',
    description: 'Interactive sessions with expert trainers every week',
    icon: 'Users',
  },
  {
    id: 'labs',
    name: 'Guided Labs',
    description: 'Hands-on practice with step-by-step guidance',
    icon: 'Code',
  },
  {
    id: 'projects',
    name: 'Real Projects',
    description: 'Build portfolio-ready projects used by real companies',
    icon: 'Briefcase',
  },
];

export const AI_FEATURES = [
  {
    id: 'doubt-assistant',
    name: 'AI Doubt Assistant',
    description: 'Get instant answers to your coding and conceptual questions',
  },
  {
    id: 'practice',
    name: 'AI Mock Interviews',
    description: 'Unlimited practice with AI-powered mock interviews',
  },
  {
    id: 'feedback',
    name: 'AI Resume Review',
    description: 'Get ATS-optimized resume feedback and suggestions',
  },
  {
    id: 'career-coach',
    name: 'Career Coach AI',
    description: 'Personalized career guidance based on your goals and skills',
  },
];

export const CAREERS_DATA = [
  { role: 'Frontend Developer', salaryMin: 4.5, salaryMax: 8, demand: 'Very High' },
  { role: 'Backend Developer', salaryMin: 5, salaryMax: 9, demand: 'Very High' },
  { role: 'Full Stack Developer', salaryMin: 6, salaryMax: 12, demand: 'High' },
  { role: 'DevOps Engineer', salaryMin: 7, salaryMax: 14, demand: 'High' },
  { role: 'Data Analyst', salaryMin: 4, salaryMax: 8, demand: 'High' },
];

export const SAMPLE_TESTIMONIALS = [
  {
    id: 1,
    name: '[Sample] Ansh Kumar',
    role: '[Sample] Software Engineer @ TechCorp',
    avatar: 'AK',
    text: '[Development Sample] Got placed within 3 months of course completion. The interview prep was really thorough.',
    rating: 5,
    verified: true,
  },
  {
    id: 2,
    name: '[Sample] Priya Sharma',
    role: '[Sample] Product Manager @ StartupXYZ',
    avatar: 'PS',
    text: '[Development Sample] The curriculum is industry-aligned and the trainers are very supportive. Highly recommend!',
    rating: 5,
    verified: true,
  },
];

export const SAMPLE_TRAINERS = [
  {
    id: 1,
    name: '[Sample] Rajesh Kumar',
    expertise: '[Sample] Full Stack Development',
    experience: '[Sample] 8+ years',
    bio: '[Sample] Expert in scalable system design',
  },
  {
    id: 2,
    name: '[Sample] Deepika Patel',
    expertise: '[Sample] Data Science',
    experience: '[Sample] 6+ years',
    bio: '[Sample] ML engineer with startup experience',
  },
];

export const FAQs = [
  {
    id: 1,
    question: 'Is there a money-back guarantee?',
    answer: 'Yes, we offer a 14-day money-back guarantee if you are not satisfied with the course. No questions asked.',
  },
  {
    id: 2,
    question: 'Can I access the course material after completion?',
    answer: 'Yes, you get lifetime access to all course materials, including updates and new content.',
  },
  {
    id: 3,
    question: 'What if I cannot keep up with the pace?',
    answer: 'Our courses are self-paced. You can pause, rewatch, and resume at your own speed. We also offer support sessions.',
  },
  {
    id: 4,
    question: 'Are the certificates recognized by employers?',
    answer: '[Sample] Our certificates showcase completion of rigorous training and are recognized by leading tech companies.',
  },
  {
    id: 5,
    question: 'What job roles does this program prepare me for?',
    answer: 'The program prepares you for roles like Software Developer, Full Stack Engineer, Frontend/Backend Developer, and more.',
  },
  {
    id: 6,
    question: 'Do you offer placement assistance?',
    answer: 'Yes, with our Placement Support package or Complete Package, you get job matching, interview preparation, and offer negotiation support.',
  },
];

export const FOOTER_LINKS = {
  product: [
    { label: 'Courses', href: '/courses' },
    { label: 'Programs', href: '/programs' },
    { label: 'Pricing', href: '/programs' },
    { label: 'Assessment', href: '/assessment' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Trainers', href: '/trainers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  support: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Help Center', href: '/help' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Cookies', href: '/cookies' },
  ],
};
