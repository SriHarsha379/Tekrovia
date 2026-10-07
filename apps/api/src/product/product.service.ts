import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  private products = [
    {
      id: 'tech-training',
      name: 'Technology Training',
      price: 9999,
      currency: 'INR',
      duration: '12 weeks',
      description: 'All modules, guided labs, assignments and two guided projects',
      features: [
        'Recorded + Live Sessions',
        '10+ Guided Labs',
        'Real-world Projects',
        'Assignment Reviews',
        'Lifetime Access'
      ],
      icon: 'Code',
      badge: null
    },
    {
      id: 'interview-prep',
      name: 'Interview Preparation',
      price: 9999,
      currency: 'INR',
      duration: '8 weeks',
      description: 'Interview curriculum, AI practice, three expert mocks and resume preparation',
      features: [
        '3 Expert Mock Interviews',
        'AI Practice Unlimited',
        'Resume Optimization',
        'ATS Review',
        'Real-time Feedback'
      ],
      icon: 'Briefcase',
      badge: null
    },
    {
      id: 'placement-support',
      name: 'Placement Support',
      price: 9999,
      currency: 'INR',
      duration: '3-6 months',
      description: 'Job matching, verified submissions, interview coordination and feedback tracking',
      features: [
        'Job Matching Algorithm',
        'Verified Submissions',
        'Interview Coordination',
        'Feedback Tracking',
        'Placement Assistance'
      ],
      icon: 'Target',
      badge: null
    },
    {
      id: 'soft-skills',
      name: 'Corporate Soft Skills',
      price: 5000,
      currency: 'INR',
      duration: '4 weeks',
      description: 'Communication, HR rounds, workplace skills, email and presentation',
      features: [
        'Communication Skills',
        'HR Interview Prep',
        'Group Discussion',
        'Presentation Skills',
        'Business Email'
      ],
      icon: 'Users',
      badge: null
    },
    {
      id: 'complete-bundle',
      name: 'Complete Package',
      price: 29999,
      currency: 'INR',
      duration: '6 months',
      description: 'All services; suggested introductory bundle',
      features: [
        'All Above Services',
        'Priority Support',
        'Personal Mentor',
        '1-on-1 Guidance',
        'Guaranteed Interviews'
      ],
      icon: 'Crown',
      badge: 'Most Popular'
    }
  ];

  getAllProducts() {
    return this.products;
  }

  getProductById(id: string) {
    return this.products.find(p => p.id === id);
  }
}
