import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { LogoLoader } from "@/components/delight/logo-loader";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Pages whose data takes longer than half a second show the Delight logo loader.
    defaultPendingComponent: () => <LogoLoader />,
    defaultPendingMs: 500,
  });

  return router;
};
