"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/'); // Redirects to the root login page
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <p className="text-lg text-gray-700 dark:text-gray-300">Redirecting to login page...</p>
    </div>
  );
}
