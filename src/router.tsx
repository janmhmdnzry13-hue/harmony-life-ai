import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Aggregated views (Home overview, Insights, Understand) are derived from the
 * same rows every section mutates. Any successful mutation anywhere in the app
 * refreshes them, so Home always reflects Health / Habits / Plan / Profile.
 */
const SHARED_VIEWS = ["dashboard", "insights", "understand", "lifeScore", "intelligence"];

export const getRouter = () => {
  const queryClient: QueryClient = new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: () => {
        for (const key of SHARED_VIEWS) queryClient.invalidateQueries({ queryKey: [key] });
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
