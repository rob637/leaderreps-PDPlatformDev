import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Sparkles, 
  Shield, 
  Zap, 
  Crown,
  ArrowRight,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SUBSCRIPTION_TIERS, PROMOTIONS, calculatePrice } from '../../config/subscriptions';
import clsx from 'clsx';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [showFaq, setShowFaq] = useState(null);

  const handleSelectPlan = (tierId) => {
    if (!user) {
      navigate('/register', { state: { selectedPlan: tierId, billingCycle } });
    } else {
      navigate('/checkout', { state: { plan: tierId, billingCycle, promo: promoApplied } });
    }
  };

  const applyPromoCode = () => {
    const promo = Object.values(PROMOTIONS).find(p => p.code === promoCode.toUpperCase());
    if (promo) {
      setPromoApplied(promo);
    } else {
      setPromoApplied(null);
      alert('Invalid promo code');
    }
  };

  const tiers = [
    { ...SUBSCRIPTION_TIERS.free, icon: HelpCircle },
    { ...SUBSCRIPTION_TIERS.starter, icon: Zap },
    { ...SUBSCRIPTION_TIERS.pro, icon: Sparkles },
    { ...SUBSCRIPTION_TIERS.ultimate, icon: Crown },
  ];

  const faqs = [
    {
      question: 'Can I switch plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, your new rate takes effect at the next billing cycle.'
    },
    {
      question: 'Is there a money-back guarantee?',
      answer: 'Absolutely. We offer a 30-day money-back guarantee. If PassCPA isn\'t helping you prepare for the CPA exam, just contact us for a full refund.'
    },
    {
      question: 'What does the Pass Guarantee include?',
      answer: 'Ultimate plan members who don\'t pass their exam section after completing at least 80% of the material get an extended subscription at no extra cost. Terms apply.'
    },
    {
      question: 'Can I use PassCPA on multiple devices?',
      answer: 'Yes! Your subscription works on any device - phone, tablet, or computer. Your progress syncs automatically across all devices.'
    },
    {
      question: 'How long do I have access?',
      answer: 'Monthly subscribers have access as long as their subscription is active. Annual subscribers get 12 months of access. Ultimate members get 24 months.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="pt-16 pb-12 px-4 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Pass the CPA Exam. <span className="text-primary-600">Guaranteed.</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          Join thousands of candidates who passed with PassCPA. 
          AI-powered prep at a fraction of the cost.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 bg-white rounded-full p-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={clsx(
              "px-6 py-2 rounded-full text-sm font-medium transition-all",
              billingCycle === 'monthly'
                ? "bg-primary-500 text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={clsx(
              "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              billingCycle === 'annual'
                ? "bg-primary-500 text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Annual
            <span className={clsx(
              "text-xs px-2 py-0.5 rounded-full",
              billingCycle === 'annual' 
                ? "bg-white/20 text-white" 
                : "bg-accent-100 text-accent-700"
            )}>
              Save 40%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const price = billingCycle === 'annual' 
              ? tier.priceAnnual 
              : tier.priceMonthly;
            const monthlyEquivalent = billingCycle === 'annual' && tier.priceAnnual
              ? Math.round(tier.priceAnnual / 12)
              : tier.priceMonthly;
            const Icon = tier.icon;

            return (
              <div
                key={tier.id}
                className={clsx(
                  "relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg",
                  tier.popular 
                    ? "border-primary-500 shadow-lg scale-105 lg:scale-110 z-10" 
                    : "border-slate-200"
                )}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Tier Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      tier.id === 'free' && "bg-slate-100",
                      tier.id === 'starter' && "bg-amber-100",
                      tier.id === 'pro' && "bg-primary-100",
                      tier.id === 'ultimate' && "bg-violet-100",
                    )}>
                      <Icon className={clsx(
                        "w-5 h-5",
                        tier.id === 'free' && "text-slate-600",
                        tier.id === 'starter' && "text-amber-600",
                        tier.id === 'pro' && "text-primary-600",
                        tier.id === 'ultimate' && "text-violet-600",
                      )} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{tier.name}</h3>
                      {tier.perSection && (
                        <span className="text-xs text-slate-500">per section</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {tier.price > 0 ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-slate-900">
                            ${monthlyEquivalent}
                          </span>
                          <span className="text-slate-500">/mo</span>
                        </div>
                        {billingCycle === 'annual' && tier.priceAnnual > 0 && (
                          <p className="text-sm text-slate-500 mt-1">
                            ${price} billed annually
                            {tier.savings && (
                              <span className="text-accent-600 font-medium ml-1">
                                (Save ${tier.savings})
                              </span>
                            )}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-slate-900">Free</div>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-6">{tier.description}</p>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(tier.id)}
                    className={clsx(
                      "w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                      tier.popular
                        ? "bg-primary-500 text-white hover:bg-primary-600"
                        : tier.id === 'free'
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                  >
                    {tier.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Features */}
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <Check className={clsx(
                          "w-5 h-5 flex-shrink-0 mt-0.5",
                          tier.popular ? "text-primary-500" : "text-accent-500"
                        )} />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Promo Code */}
        <div className="max-w-md mx-auto mt-12 text-center">
          <p className="text-sm text-slate-500 mb-3">Have a promo code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={applyPromoCode}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
            >
              Apply
            </button>
          </div>
          {promoApplied && (
            <p className="mt-2 text-sm text-accent-600 font-medium">
              ✓ {promoApplied.description}
            </p>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Compare Plans
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4 text-slate-600 font-medium">Feature</th>
                  <th className="p-4 text-center text-slate-600 font-medium">Free</th>
                  <th className="p-4 text-center text-slate-600 font-medium">Starter</th>
                  <th className="p-4 text-center text-primary-600 font-medium bg-primary-50">Pro</th>
                  <th className="p-4 text-center text-slate-600 font-medium">Ultimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Practice Questions', free: '50/section', starter: '1,200+', pro: '7,700+', ultimate: '7,700+' },
                  { feature: 'Video Lessons', free: '5/section', starter: '40+', pro: '450+', ultimate: '450+' },
                  { feature: 'Simulations', free: false, starter: '15', pro: '410+', ultimate: '410+' },
                  { feature: 'Exam Sections', free: 'Limited', starter: '1', pro: 'All 6', ultimate: 'All 6' },
                  { feature: 'Penny AI Tutor', free: '3/day', starter: true, pro: true, ultimate: 'Priority' },
                  { feature: 'Offline Access', free: false, starter: true, pro: true, ultimate: true },
                  { feature: 'Simulated Exams', free: false, starter: false, pro: true, ultimate: true },
                  { feature: '1-on-1 Coaching', free: false, starter: false, pro: false, ultimate: '4 sessions' },
                  { feature: 'Pass Guarantee', free: false, starter: false, pro: false, ultimate: true },
                  { feature: 'Access Duration', free: 'Forever', starter: '12 mo', pro: '12 mo', ultimate: '24 mo' },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="p-4 text-slate-700 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <Check className="w-5 h-5 text-accent-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-slate-600 text-sm">{row.free}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? <Check className="w-5 h-5 text-accent-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-slate-600 text-sm">{row.starter}</span>
                      )}
                    </td>
                    <td className="p-4 text-center bg-primary-50">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? <Check className="w-5 h-5 text-primary-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-primary-700 font-medium text-sm">{row.pro}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.ultimate === 'boolean' ? (
                        row.ultimate ? <Check className="w-5 h-5 text-accent-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-slate-600 text-sm">{row.ultimate}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setShowFaq(showFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-slate-900">{faq.question}</span>
                  <ChevronDown className={clsx(
                    "w-5 h-5 text-slate-400 transition-transform",
                    showFaq === index && "rotate-180"
                  )} />
                </button>
                {showFaq === index && (
                  <div className="px-4 pb-4 text-slate-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-600 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Pass the CPA Exam?
        </h2>
        <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
          Start your free trial today. No credit card required.
        </p>
        <button
          onClick={() => handleSelectPlan('pro')}
          className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors inline-flex items-center gap-2"
        >
          Start Free 7-Day Trial
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pricing;
