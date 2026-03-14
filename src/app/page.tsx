'use client';

import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to English locale by default
  redirect('/en');
}
