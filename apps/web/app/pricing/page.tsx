'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`);
        setProducts(await res.json());
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-12 p-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600">
          Choose the plan that's right for you. Start from ₹5,000 and upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {products.map(product => (
          <Card 
            key={product.id} 
            className={`relative transition-all hover:shadow-lg ${
              product.badge ? 'md:scale-105 border-2 border-blue-500' : ''
            }`}
          >
            {product.badge && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                {product.badge}
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">₹{product.price.toLocaleString()}</span>
                  <span className="text-gray-500">{product.currency}</span>
                </div>
                <p className="text-sm text-gray-500">Duration: {product.duration}</p>
              </div>

              <Button 
                className="w-full" 
                variant={product.badge ? 'default' : 'outline'}
              >
                Get Started
              </Button>

              <div className="space-y-3">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {[
            {
              q: 'Can I upgrade from one plan to another?',
              a: 'Yes! You can upgrade anytime. We will credit the difference to your account.'
            },
            {
              q: 'Is there a refund policy?',
              a: '30-day money-back guarantee. No questions asked if you are not satisfied.'
            },
            {
              q: 'Do I get lifetime access?',
              a: 'Yes, all course materials are yours forever. Stay updated with new content.'
            },
            {
              q: 'What if I need help choosing?',
              a: 'Book a free 15-min consultation with our counselors. They will recommend the best plan.'
            }
          ].map((faq, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Still unsure? Start with a free assessment</h2>
        <p className="text-gray-600">Get a personalized roadmap based on your current skill level</p>
        <Link href="/assessment"><Button size="lg">Take Free Assessment</Button></Link>
      </div>
    </div>
  );
}
