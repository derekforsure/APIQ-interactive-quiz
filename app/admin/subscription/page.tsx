'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      // In a real app, you'd get the username from context/session
      // For now, we'll hardcode or prompt (this is a simplified example)
      const username = prompt("Enter your admin username to upgrade:");
      if (!username) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start checkout');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Subscription Plans
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Upgrade to Pro to unlock unlimited sessions and advanced features.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          {/* Free Plan */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Free</h2>
              <p className="mt-4 text-sm text-gray-500">Basic access for small quizzes.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <button
                disabled
                className="mt-8 block w-full bg-gray-100 border border-transparent rounded-md py-2 text-sm font-semibold text-gray-400 text-center cursor-not-allowed"
              >
                Current Plan
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border border-indigo-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white ring-2 ring-indigo-500">
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Pro</h2>
              <p className="mt-4 text-sm text-gray-500">Unlimited sessions & advanced analytics.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$29</span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <p className="mt-2 text-sm text-indigo-600 font-medium">Includes 7-day free trial</p>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
