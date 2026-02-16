import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Subscribe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checking, setChecking] = useState(false);

  const loadUser = async () => {
    try {
      // Force fresh user data
      const currentUser = await base44.auth.me();
      console.log('Subscribe - User loaded:', currentUser?.email, 'Status:', currentUser?.subscription_status);
      console.log('Subscribe - Expires at:', currentUser?.subscription_expires_at);
      console.log('Subscribe - Plan:', currentUser?.subscription_plan);
      setUser(currentUser);
    } catch (e) {
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    
    // Listen for storage events (when payment completes in another tab)
    const handleStorageChange = () => {
      loadUser();
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCheckStatus = async () => {
    setChecking(true);
    await loadUser();
    setChecking(false);
    if (user?.subscription_status === 'active') {
      toast.success('Subscription is active!');
    } else {
      toast.error('No active subscription found');
    }
  };

  const handleSubscribe = async (plan) => {
    setProcessing(true);
    try {
      const { data } = await base44.functions.invoke('initializeKorapayPayment', { plan });
      
      if (data.success) {
        window.location.href = data.checkout_url;
      } else {
        toast.error('Payment initialization failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const isActive = user?.subscription_status === 'active';

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Subscribe to MYVIBEFLIX
          </h1>
          <p className="text-lg text-white/70">
            Choose the perfect plan for you
          </p>
        </div>

        {isActive ? (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 text-center">
              <p className="text-green-400 font-semibold text-lg mb-2">✓ You have an active subscription</p>
              <p className="text-white/80 mb-1">Plan: {user.subscription_plan === '6months' ? '6 Months' : user.subscription_plan === 'annual' ? 'Annual' : 'Monthly'}</p>
              {user.subscription_expires_at && (
                <p className="text-white/60 text-sm">
                  Expires: {new Date(user.subscription_expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button
              onClick={handleCheckStatus}
              disabled={checking}
              variant="outline"
              className="w-full border-white/30 hover:bg-white/10"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Refresh Status
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 hover:border-[#D4AF37]/50 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Monthly</h3>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <span className="text-4xl font-bold text-[#D4AF37]">₦2,000</span>
                </div>
                <p className="text-white/50 text-sm">per month</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">Unlimited streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">HD quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">All devices</span>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe('monthly')}
                disabled={processing}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choose Plan'}
              </Button>
            </div>

            {/* Check Status Button for users who already paid */}
            <div className="mt-8 text-center">
              <p className="text-white/60 text-sm mb-3">Already paid?</p>
              <Button
                onClick={handleCheckStatus}
                disabled={checking}
                variant="outline"
                className="border-white/30 hover:bg-white/10"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Check Subscription Status
              </Button>
            </div>

            {/* 6 Months Plan */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border-2 border-[#D4AF37] p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-4 py-1 rounded-full text-sm font-bold">
                Best Value
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">6 Months</h3>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <span className="text-4xl font-bold text-[#D4AF37]">₦11,000</span>
                </div>
                <p className="text-white/50 text-sm">₦1,833/month</p>
                <p className="text-green-400 text-xs font-semibold mt-1">Save ₦1,000</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">Unlimited streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">HD quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">All devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">Priority support</span>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe('6months')}
                disabled={processing}
                className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choose Plan'}
              </Button>
            </div>

            {/* Annual Plan */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 hover:border-[#D4AF37]/50 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Annual</h3>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <span className="text-4xl font-bold text-[#D4AF37]">₦22,000</span>
                </div>
                <p className="text-white/50 text-sm">₦1,833/month</p>
                <p className="text-green-400 text-xs font-semibold mt-1">Save ₦2,000</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">Unlimited streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">HD quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">All devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white/80">Priority support</span>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe('annual')}
                disabled={processing}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choose Plan'}
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-white/50 mt-8">
          Secure payment powered by Korapay
        </p>
      </div>
    </div>
  );
}