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
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // Check if returning from payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      setChecking(true);
      toast.success('Payment received! Activating subscription...');
      
      // Poll for subscription activation every 2 seconds
      let attempts = 0;
      const maxAttempts = 15; // 30 seconds total
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const freshUser = await base44.auth.me();
          
          if (freshUser?.subscription_status === 'active') {
            clearInterval(pollInterval);
            setUser(freshUser);
            setChecking(false);
            toast.success('Subscription activated! Redirecting...');
            setTimeout(() => {
              window.location.href = createPageUrl('Home');
            }, 1000);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setChecking(false);
            toast.error('Taking longer than expected. Use manual activation below.');
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setChecking(false);
            toast.error('Error checking status. Use manual activation below.');
          }
        }
      }, 2000);
      
      return () => clearInterval(pollInterval);
    }
  }, []);

  // Auto-redirect if already subscribed
  useEffect(() => {
    if (user?.subscription_status === 'active') {
      const timer = setTimeout(() => {
        window.location.href = createPageUrl('Home');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);



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

  if (loading || checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
        <p className="text-white/80 animate-pulse">
          {checking ? 'Activating your subscription...' : 'Loading...'}
        </p>
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
              <p className="text-white/50 text-sm mt-2">Redirecting to home...</p>
            </div>
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