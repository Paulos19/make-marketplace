import Stripe from 'stripe';

if (!process.env.STRIPE_API_KEY) {
  throw new Error('A variável de ambiente STRIPE_API_KEY não está definida.');
}
export const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: '2025-05-28.basil', 
  typescript: true,
});
