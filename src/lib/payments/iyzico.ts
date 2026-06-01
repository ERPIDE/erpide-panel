export interface BuyerInfo {
  id: string;
  name: string;
  surname: string;
  email: string;
  gsmNumber: string;
  identityNumber: string;
  registrationAddress: string;
  city: string;
  country: string;
  ip: string;
}

export interface CheckoutRetrieveResult {
  status: "success" | "failure";
  paymentStatus?: string;
  paymentId?: string;
  conversationId?: string;
  basketId?: string;
  price?: number;
  paidPrice?: number;
  buyerEmail?: string;
  errorMessage?: string;
}

export function isMockMode(): boolean {
  return !process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY;
}

function getClient() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
  if (!apiKey || !secretKey) throw new Error("IYZICO_API_KEY ve IYZICO_SECRET_KEY tanımlı değil.");
  const Iyzipay = require("iyzipay");
  return new Iyzipay({ apiKey, secretKey, uri });
}

export async function retrieveCheckout(token: string): Promise<CheckoutRetrieveResult> {
  if (isMockMode() || token.startsWith("MOCK-")) {
    return {
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: `MOCK-PAY-${token}`,
      conversationId: token.replace("MOCK-", ""),
      buyerEmail: "mock@example.com",
    };
  }
  const client = getClient();
  return new Promise((resolve) => {
    client.checkoutForm.retrieve({ token }, (err: unknown, result: Record<string, unknown>) => {
      if (err) { resolve({ status: "failure", errorMessage: String(err) }); return; }
      if (result.status === "success") {
        resolve({
          status: "success",
          paymentStatus: result.paymentStatus as string,
          paymentId: result.paymentId as string,
          conversationId: result.conversationId as string,
          basketId: result.basketId as string,
          price: Number(result.price),
          paidPrice: Number(result.paidPrice),
          buyerEmail: (result as { buyer?: { email?: string } }).buyer?.email,
        });
      } else {
        resolve({ status: "failure", errorMessage: result.errorMessage as string });
      }
    });
  });
}
