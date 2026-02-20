import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Crown, Loader2, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 2000,
    period: '/ month',
    description: 'Perfect for trying out Vibeflix',
    features: ['Unlimited streaming', 'HD quality', 'All movies & shows', 'Cancel anytime'],
    popular: false,
  },
  {
    id: '6months',
    name: '6 Months',
    price: 10500,
    period: '/ 6 months',
    description: 'Save ₦1,500 vs monthly',
    features: ['Unlimited streaming', 'HD quality', 'All movies & shows', 'Priority support'],
    popular: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 22000,
    period: '/ year',
    description: 'Best value — save ₦2,000',
    features: ['Unlimited streaming', 'HD quality', 'All movies & shows', 'Priority support', 'Early access to new releases'],
    popular: false,
  },
];

export default function Subscribe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        base44.auth.redirectToLogin(createPageUrl('Subscribe'));
      } finally {
        setLoading(false);
      }
    };
    load();

    // Load Korapay script
    if (!document.getElementById('korapay-script')) {
      const script = document.createElement('script');
      script.id = 'korapay-script';
      script.src = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js';
      document.body.appendChild(script);
    }
  }, []);

  const isSubscribed = user?.subscription_status === 'active' &&
    user?.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const handleSubscribe = (plan) => {
    if (!window.Korapay) {
      toast.error('Payment gateway not loaded. Please refresh.');
      return;
    }

    const reference = `VIBE-${plan.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setPaying(plan.id);

    window.Korapay.initialize({
      key: import.meta.env.VITE_KORAPAY_PUBLIC_KEY || 'pk_test_placeholder',
      reference,
      amount: plan.price,
      currency: 'NGN',
      customer: {
        name: user.full_name || user.email,
        email: user.email,
      },
      narration: `Vibeflix ${plan.name} Subscription`,
      metadata: {
        userEmail: user.email,
        plan: plan.id,
      },
      merchant_bears_cost: true,
      onSuccess: async (data) => {
        setPaying(null);
        toast.success('Payment successful! Activating your subscription...');
        // Reload user after a short delay to allow webhook to process
        setTimeout(async () => {
          try {
            const updated = await base44.auth.me();
            setUser(updated);
            if (updated.subscription_status === 'active') {
              toast.success('🎉 Subscription activated! Enjoy streaming!');
            } else {
              toast.info('Payment received! Your subscription will be activated shortly.');
            }
          } catch { /* ignore */ }
        }, 3000);
      },
      onFailed: (data) => {
        setPaying(null);
        toast.error('Payment failed. Please try again.');
      },
      onClose: () => {
        setPaying(null);
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Crown className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Unlock unlimited access to all movies and shows on Vibeflix
          </p>

          {isSubscribed && (
            <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/40 rounded-full text-green-400">
              <Check className="w-5 h-5" />
              <span>
                Active: <strong>{user.subscription_plan}</strong> — expires {new Date(user.subscription_expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.popular
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                  : 'bg-[#141414] border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-[#D4AF37] text-black text-sm font-bold rounded-full flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                <p className="text-white/50 text-sm mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">₦{plan.price.toLocaleString()}</span>
                  <span className="text-white/50 mb-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={!!paying}
                className={`w-full h-12 font-semibold rounded-xl ${
                  plan.popular
                    ? 'bg-[#D4AF37] hover:bg-[#E5C158] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                {paying === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSubscribed ? (
                  'Switch Plan'
                ) : (
                  'Get Started'
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-white/30 text-sm mt-10">
          Payments are processed securely via Korapay. Your subscription activates immediately after payment confirmation.
        </p>
      </div>
    </div>
  );
}