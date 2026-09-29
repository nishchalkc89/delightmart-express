import { createFileRoute, redirect } from '@tanstack/react-router';

// Checkout now happens on the cart page (address) and the payment page.
export const Route = createFileRoute('/checkout')({
  beforeLoad: () => {
    throw redirect({ to: '/cart', replace: true });
  },
});
