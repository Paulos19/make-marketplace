'use server'

import { cookies } from 'next/headers'

export async function setLocationCookie(state: string, city: string) {
  const cookieStore = await cookies();
  
  // Set state
  if (state) {
    cookieStore.set('zacaplace_state', state, { path: '/', maxAge: 60 * 60 * 24 * 30 }); // 30 days
  } else {
    cookieStore.delete('zacaplace_state');
  }

  // Set city
  if (city) {
    cookieStore.set('zacaplace_city', city, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  } else {
    cookieStore.delete('zacaplace_city');
  }
}
