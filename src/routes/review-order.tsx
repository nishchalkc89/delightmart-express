import { createFileRoute, redirect } from '@tanstack/react-router';

// The order is reviewed on the payment page now.
export const Route = createFileRoute('/review-order')({
  beforeLoad: () => {
    throw redirect({ to: '/payment', replace: true });
  },
});
