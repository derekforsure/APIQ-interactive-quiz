'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
          toast.success('Email verified! Trial activated.');
          // Redirect to dashboard after a delay
          setTimeout(() => router.push('/admin/dashboard'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        {status === 'verifying' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verifying your email...</h2>
            <div className="mt-4 animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Successful!</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-red-600">{message}</p>
            <button
              onClick={() => router.push('/signup')}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Back to Signup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
