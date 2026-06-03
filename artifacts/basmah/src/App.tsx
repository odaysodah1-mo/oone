import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { OrderProvider } from "@/components/order-context";
import { Server } from "lucide-react";
import { useState, useEffect } from "react";

import Home from "@/pages/home";
import Teams from "@/pages/teams";
import TeamDetail from "@/pages/team-detail";
import Order from "@/pages/order";
import Orders from "@/pages/orders";
import Stats from "@/pages/stats";
import Admin from "@/pages/admin";
import Track from "@/pages/track";
import Marketplace from "@/pages/marketplace";
import DesignDetail from "@/pages/design-detail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(2000 * Math.pow(2, attempt), 10000),
      refetchOnWindowFocus: false,
    },
  },
});

function ConnectingScreen({ elapsed }: { elapsed: number }) {
  const dots = ".".repeat((elapsed % 6) + 1);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-pulse">
          <Server size={40} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-3">جاري تشغيل الخادم{dots}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          قد يستغرق 30-60 ثانية لعودة الخدمة
        </p>
        <div className="w-full bg-secondary rounded-full h-2 mb-2 overflow-hidden">
          <div className="bg-primary h-full rounded-full"
            style={{ width: `${Math.min(95, (elapsed / 60) * 100)}%` }} />
        </div>
        <p className="text-muted-foreground text-xs">{elapsed >= 60 ? "أكثر من دقيقة..." : `${elapsed} ثانية`}</p>
      </div>
    </div>
  );
}

function GlobalLoader() {
  const isFetching = useIsFetching();
  const [show, setShow] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isFetching) {
      const t = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(t);
    }
    setShow(true);
  }, [isFetching]);

  useEffect(() => {
    if (!show) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [show]);

  if (!show) return null;
  if (elapsed < 3) return null;
  return <ConnectingScreen elapsed={elapsed} />;
}

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
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/marketplace/designs/:id" component={DesignDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoader />
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

