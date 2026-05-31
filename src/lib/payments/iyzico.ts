import type { Plan } from "./plans";

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

export interface CheckoutInitResult {
  status: "success" | "failure";
  token?: string;
  paymentPageUrl?: string;
  errorMessage?: string;
  errorCode?: string;
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

function getClient() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    throw new Error("IYZICO_API_KEY ve IYZICO_SECRET_KEY ortam değişkenleri tanımlı değil.");
  }

  const Iyzipay = require("iyzipay");
  return new Iyzipay({ apiKey, secretKey, uri });
}

export function isMockMode(): boolean {
  return !process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY;
}

export async function initCheckout(opts: {
  plan: Plan;
  buyer: BuyerInfo;
  conversationId: string;
  callbackUrl: string;
}): Promise<CheckoutInitResult> {
  const { plan, buyer, conversationId, callbackUrl } = opts;

  if (isMockMode()) {
    return {
      status: "success",
      token: `MOCK-${conversationId}`,
      paymentPageUrl: `${callbackUrl}?mock=true&token=MOCK-${conversationId}&conversationId=${conversationId}`,
    };
  }

  const client = getClient();
  const price = plan.price.toFixed(2);

  return new Promise((resolve) => {
    client.checkoutFormInitialize.create(
      {
        locale: "tr",
        conversationId,
        price,
        paidPrice: price,
        currency: "TRY",
        basketId: plan.id,
        paymentGroup: "SUBSCRIPTION",
        callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: buyer.id,
          name: buyer.name,
          surname: buyer.surname,
          gsmNumber: buyer.gsmNumber,
          email: buyer.email,
          identityNumber: buyer.identityNumber,
          registrationAddress: buyer.registrationAddress,
          ip: buyer.ip,
          city: buyer.city,
          country: buyer.country,
        },
        shippingAddress: {
          contactName: `${buyer.name} ${buyer.surname}`,
          city: buyer.city,
          country: buyer.country,
          address: buyer.registrationAddress,
        },
        billingAddress: {
          contactName: `${buyer.name} ${buyer.surname}`,
          city: buyer.city,
          country: buyer.country,
          address: buyer.registrationAddress,
        },
        basketItems: [
          {
            id: plan.id,
            name: `${plan.productName} ${plan.name} (Aylık)`,
            category1: plan.productName,
            itemType: "VIRTUAL",
            price,
          },
        ],
      },
      (err: unknown, result: Record<string, unknown>) => {
        if (err) {
          resolve({ status: "failure", errorMessage: String(err) });
          return;
        }
        if (result.status === "success") {
          resolve({
            status: "success",
            token: result.token as string,
            paymentPageUrl: result.paymentPageUrl as string,
          });
        } else {
          resolve({
            status: "failure",
            errorMessage: result.errorMessage as string,
            errorCode: result.errorCode as string,
          });
        }
      }
    );
  });
}

export async function retrieveCheckout(token: string): Promise<CheckoutRetrieveResult> {
  if (isMockMode() || token.startsWith("MOCK-")) {
    return {
      status: "success",
      paymentStatus: "SUCCESS",
      paymentId: `MOCK-PAY-${Date.now()}`,
      conversationId: token.replace("MOCK-", ""),
      buyerEmail: "mock@example.com",
    };
  }

  const client = getClient();

  return new Promise((resolve) => {
    client.checkoutForm.retrieve({ token }, (err: unknown, result: Record<string, unknown>) => {
      if (err) {
        resolve({ status: "failure", errorMessage: String(err) });
        return;
      }
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
        resolve({
          status: "failure",
          errorMessage: result.errorMessage as string,
        });
      }
    });
  });
}
