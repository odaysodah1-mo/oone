import React, { createContext, useContext, useState } from "react";
import { CreateOrderBody } from "@workspace/api-client-react";

type PartialOrder = Partial<CreateOrderBody> & {
  teamName?: string;
  basePrice?: number;
  previewColor?: string;
  previewName?: string;
  previewNumber?: string;
};

interface OrderContextType {
  order: PartialOrder;
  updateOrder: (data: Partial<PartialOrder>) => void;
  clearOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrder] = useState<PartialOrder>({});

  const updateOrder = (data: Partial<PartialOrder>) => {
    setOrder((prev) => ({ ...prev, ...data }));
  };

  const clearOrder = () => setOrder({});

  return (
    <OrderContext.Provider value={{ order, updateOrder, clearOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
