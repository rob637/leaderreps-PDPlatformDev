import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  CreditCard, Lock, Check, Shield, ArrowLeft, 
  Gift, Clock, AlertCircle, Sparkles, Loader
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SUBSCRIPTION_TIERS, PROMOTIONS, applyPromoCode } from '../../config/subscriptions';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  // Get plan from URL params
  const tierId = searchParams.get('plan') || 'pro';
  const billingCycle = searchParams.get('billing') || 'monthly';
  const promoCodeFromUrl = searchParams.get('promo') || '';
  
  const [promoCode, setPromoCode] = useState(promoCodeFromUrl);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});

  const tier = SUBSCRIPTION_TIERS[tierId] || SUBSCRIPTION_TIERS.pro;
  const isAnnual = billingCycle === 'annual';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?redirect=/checkout?plan=${tierId}&billing=${billingCycle}`);
    }
  }, [user, authLoading, navigate, tierId, billingCycle]);

  // Apply promo from URL on mount
  useEffect(() => {
    if (promoCodeFromUrl) {
      handleApplyPromo();
    }
  }, []);

  // Calculate pricing
  const basePrice = isAnnual ? tier.pricing.annual : tier.pricing.monthly;
  const annualSavings = isAnnual ? (tier.pricing.monthly * 12 - tier.pricing.annual) : 0;
  
  // Apply promo discount
  let finalPrice = basePrice;
  let promoDiscount = 0;
  if (appliedPromo) {
    promoDiscount = Math.round(basePrice * appliedPromo.discount);
    finalPrice = basePrice - promoDiscount;
  }

  const handleApplyPromo = () => {
    setPromoError('');
    const promo = applyPromoCode(promoCode.trim().toUpperCase());
    if (promo) {
      setAppliedPromo(promo);
    } else {
      setPromoError('Invalid or expired promo code');
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setPromoError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    // Card validation (basic)
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardNumber)) {
      newErrors.cardNumber = 'Invalid card number';
    }
    
    if (!formData.expiry) {
      newErrors.expiry = 'Expiry is required';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = 'Use MM/YY format';
    }
    
    if (!formData.cvc) {
      newErrors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(formData.cvc)) {
      newErrors.cvc = 'Invalid CVC';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      // TODO: Integrate with Stripe
      // 1. Create Stripe PaymentIntent on backend
      // 2. Confirm payment with card details
      // 3. Create subscription in Firestore
      // 4. Update user's subscription status
      
      // Simulating payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, redirect to success page
      navigate('/checkout/success?plan=' + tierId);
    } catch (error) {
      console.error('Payment failed:', error);
      setErrors({ submit: 'Payment failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substr(0, 19) : '';
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2);
    }
    return cleaned;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          to="/pricing" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to plans
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-6">
                Complete Your Purchase
              </h1>

              {/* Trial Badge */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">7-Day Free Trial</p>
                    <p className="text-sm text-green-700">
                      You won't be charged until your trial ends
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Account Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.name ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.email ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Payment Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            cardNumber: formatCardNumber(e.target.value) 
                          })}
                          className={`w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.cardNumber ? 'border-red-300' : 'border-slate-300'
                          }`}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                        <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      </div>
                      {errors.cardNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={formData.expiry}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            expiry: formatExpiry(e.target.value) 
                          })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.expiry ? 'border-red-300' : 'border-slate-300'
                          }`}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                        {errors.expiry && (
                          <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          value={formData.cvc}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            cvc: e.target.value.replace(/\D/g, '').substr(0, 4) 
                          })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors.cvc ? 'border-red-300' : 'border-slate-300'
                          }`}
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cvc && (
                          <p className="mt-1 text-sm text-red-600">{errors.cvc}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Promo Code (Optional)
                  </label>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">
                          {appliedPromo.code} - {appliedPromo.discount * 100}% off
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter code"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="mt-1 text-sm text-red-600">{promoError}</p>
                  )}
                </div>

                {/* Error message */}
                {errors.submit && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{errors.submit}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Start 7-Day Free Trial
                    </>
                  )}
                </button>

                {/* Security badges */}
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Secure Payment</span>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Order Summary
              </h2>

              {/* Plan Details */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white`}
                    style={{ backgroundColor: tier.color }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{tier.name}</p>
                    <p className="text-sm text-slate-500">
                      {isAnnual ? 'Annual' : 'Monthly'} billing
                    </p>
                  </div>
                </div>

                {/* Features preview */}
                <div className="space-y-2">
                  {tier.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {tier.features.length > 4 && (
                    <p className="text-sm text-slate-500">
                      + {tier.features.length - 4} more features
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>{tier.name} ({isAnnual ? 'Annual' : 'Monthly'})</span>
                  <span>${basePrice.toLocaleString()}</span>
                </div>
                
                {isAnnual && annualSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Annual savings</span>
                    <span>-${annualSavings.toLocaleString()}</span>
                  </div>
                )}
                
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo ({appliedPromo.code})</span>
                    <span>-${promoDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-slate-900">Total today</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">$0.00</p>
                    <p className="text-sm text-slate-500">7-day free trial</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-baseline text-slate-600 mb-6">
                <span>Then {isAnnual ? 'annually' : 'monthly'}</span>
                <span className="font-semibold">${finalPrice.toLocaleString()}</span>
              </div>

              {/* Guarantee */}
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary-600" />
                  <div>
                    <p className="font-semibold text-primary-900">30-Day Guarantee</p>
                    <p className="text-sm text-primary-700">
                      Full refund if you're not satisfied
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel anytime */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Cancel anytime during trial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
