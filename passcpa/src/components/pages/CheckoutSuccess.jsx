import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle, ArrowRight, BookOpen, Sparkles, 
  Calendar, Download, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SUBSCRIPTION_TIERS } from '../../config/subscriptions';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';
  const tier = SUBSCRIPTION_TIERS[planId] || SUBSCRIPTION_TIERS.pro;

  // Trigger confetti on mount
  useEffect(() => {
    // Fire confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const nextSteps = [
    {
      icon: BookOpen,
      title: 'Start Your Study Plan',
      description: 'Take our quick assessment to create a personalized study schedule',
      action: 'Create Plan',
      link: '/onboarding',
    },
    {
      icon: Sparkles,
      title: 'Meet Penny, Your AI Tutor',
      description: 'Ask Penny any CPA exam question and get instant expert guidance',
      action: 'Chat with Penny',
      link: '/ai-tutor',
    },
    {
      icon: Zap,
      title: 'Practice Questions',
      description: 'Jump into practice with 1,200+ CPA exam questions',
      action: 'Start Practicing',
      link: '/practice',
    },
    {
      icon: Download,
      title: 'Install the App',
      description: 'Add PassCPA to your home screen for quick access anywhere',
      action: 'Install PWA',
      link: '#install',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-14 h-14 text-green-600" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Welcome to PassCPA! 🎉
        </h1>
        <p className="text-lg text-slate-600 mb-2">
          Your {tier.name} subscription is now active
        </p>
        <p className="text-slate-500 mb-8">
          Your 7-day free trial has started. You won't be charged until it ends.
        </p>

        {/* Trial countdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-primary-500" />
            <span className="text-lg font-semibold text-slate-900">
              Free Trial: 7 Days Remaining
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
            <div 
              className="bg-primary-500 h-3 rounded-full transition-all duration-500"
              style={{ width: '100%' }}
            ></div>
          </div>
          <p className="text-sm text-slate-500">
            We'll send you a reminder before your trial ends
          </p>
        </div>

        {/* What you get */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            What's Included in {tier.name}
          </h2>
          <div className="grid gap-3">
            {tier.features.slice(0, 6).map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 text-left"
              >
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Get Started
        </h2>
        <div className="grid gap-4 mb-8">
          {nextSteps.map((step, index) => (
            <Link
              key={index}
              to={step.link}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all text-left flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <step.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500">{step.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </Link>

        {/* Support note */}
        <p className="mt-8 text-sm text-slate-500">
          Questions? Email us at{' '}
          <a href="mailto:support@passcpa.com" className="text-primary-600 hover:underline">
            support@passcpa.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
