import fetch from "node-fetch";

export async function initiateOrangeMoneyPayment(phone: string, amount: number) {
  const url = "https://api.orange.com/orange-money-webpay/v1/webpayment";
  const headers = {
    "Authorization": `Bearer ${process.env.ORANGE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  const body = {
    merchant_key: process.env.ORANGE_MERCHANT_KEY,
    currency: "CDF",
    amount,
    order_id: "kwenda-" + Date.now(),
    return_url: "https://ton-site.com/payment/success",
    cancel_url: "https://ton-site.com/payment/cancel",
    notif_url: "https://ton-site.com/api/payment/callback", -- webhook Supabase ou ton serveur
    lang: "fr",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data; // contient le lien de paiement Orange Money
}
