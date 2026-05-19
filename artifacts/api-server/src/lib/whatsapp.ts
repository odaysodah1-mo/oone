const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_URL = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

export async function sendOrderWhatsApp(
  customerPhone: string,
  orderId: number,
  teamName: string,
  confirmToken: string,
): Promise<void> {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    const waUrl = makeWaUrl(customerPhone, orderId, teamName, confirmToken);
    console.log(`[WhatsApp] Skipped (not configured). Manual link: ${waUrl}`);
    return;
  }

  const confirmUrl = `${BASE_URL}/api/orders/confirm?token=${confirmToken}&id=${orderId}`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: customerPhone.startsWith("07") ? `962${customerPhone.slice(1)}` : customerPhone,
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME || "order_confirmation",
      language: { code: "ar" },
      components: [{
        type: "body",
        parameters: [
          { type: "text", text: `#${orderId}` },
          { type: "text", text: teamName },
          { type: "text", text: confirmUrl },
        ],
      }],
    },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WhatsApp] Failed to send: ${err}`);
  } else {
    console.log(`[WhatsApp] Message sent to ${customerPhone} for order #${orderId}`);
  }
}

export function makeWaUrl(
  customerPhone: string,
  orderId: number,
  teamName: string,
  confirmToken: string,
): string {
  const confirmUrl = `${BASE_URL}/api/orders/confirm?token=${confirmToken}&id=${orderId}`;
  const phone = customerPhone.startsWith("07") ? `962${customerPhone.slice(1)}` : customerPhone;
  const text = encodeURIComponent(
    `👕 طلب تيشيرت ${teamName}\nرقم الطلب: #${orderId}\n📌 لتأكيد الطلب، اضغط على الرابط:\n${confirmUrl}`
  );
  return `https://wa.me/${phone}?text=${text}`;
}
