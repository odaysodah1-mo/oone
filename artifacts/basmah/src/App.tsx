import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { OrderProvider } from "@/components/order-context";

import Home from "@/pages/home";
import Teams from "@/pages/teams";
import TeamDetail from "@/pages/team-detail";
import Order from "@/pages/order";
import Orders from "@/pages/orders";
import Stats from "@/pages/stats";
import Admin from "@/pages/admin";
import Track from "@/pages/track";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/teams" component={Teams} />
      <Route path="/teams/:id" component={TeamDetail} />
      <Route path="/order" component={Order} />
      <Route path="/orders" component={Orders} />
      <Route path="/stats" component={Stats} />
      <Route path="/track" component={Track} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OrderProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              {/* Admin — standalone, no shared layout */}
              <Route path="/admin" component={Admin} />
              {/* All other pages use the shared Layout */}
              <Route>
                <Layout>
                  <Router />
                </Layout>
              </Route>
            </Switch>
          </WouterRouter>
        </OrderProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

