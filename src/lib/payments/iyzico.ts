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
  // Card storage — populated when the customer checked "kartımı kaydet" on the
  // checkout form. cardUserKey + cardToken together are what we replay against
  // iyzico to charge them again on renewal day (no UI interaction needed).
  cardUserKey?: string;
  cardToken?: string;
  binNumber?: string;
  lastFourDigits?: string;
  cardAssociation?: string; // VISA, MASTER_CARD
  cardFamily?: string;
  cardType?: string;
}

export interface SavedCardChargeInput {
  conversationId: string;
  basketId: string;
  price: number;
  paidPrice: number;
  currency: "TRY" | "USD" | "EUR" | "GBP";
  cardUserKey: string;
  cardToken: string;
  buyer: BuyerInfo;
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: "PHYSICAL" | "VIRTUAL";
    price: number;
  }>;
}

export interface SavedCardChargeResult {
  status: "success" | "failure";
  paymentId?: string;
  paymentStatus?: string;
  errorMessage?: string;
  errorCode?: string;
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
          cardUserKey: result.cardUserKey as string | undefined,
          cardToken: result.cardToken as string | undefined,
          binNumber: result.binNumber as string | undefined,
          lastFourDigits: result.lastFourDigits as string | undefined,
          cardAssociation: result.cardAssociation as string | undefined,
          cardFamily: result.cardFamily as string | undefined,
          cardType: result.cardType as string | undefined,
        });
      } else {
        resolve({ status: "failure", errorMessage: result.errorMessage as string });
      }
    });
  });
}

/**
 * Charge a previously-saved card. Used by the daily renewal cron — no user
 * interaction, no 3DS popup. iyzico requires both cardUserKey (customer-level
 * pointer) and cardToken (specific card under that customer) plus the original
 * buyer block to match BIN/risk checks.
 *
 * If the bank declines (insufficient funds, expired card, blocked transaction)
 * we get status=failure with an errorCode the cron uses to decide retry vs.
 * dead-letter.
 */
export async function chargeSavedCard(input: SavedCardChargeInput): Promise<SavedCardChargeResult> {
  if (isMockMode()) {
    return {
      status: "success",
      paymentId: `MOCK-RENEW-${input.conversationId}`,
      paymentStatus: "SUCCESS",
    };
  }
  const client = getClient();
  return new Promise((resolve) => {
    client.payment.create(
      {
        locale: "tr",
        conversationId: input.conversationId,
        price: input.price.toFixed(2),
        paidPrice: input.paidPrice.toFixed(2),
        currency: input.currency,
        installment: 1,
        basketId: input.basketId,
        paymentChannel: "WEB",
        paymentGroup: "PRODUCT",
        paymentCard: {
          cardUserKey: input.cardUserKey,
          cardToken: input.cardToken,
        },
        buyer: input.buyer,
        shippingAddress: input.billingAddress,
        billingAddress: input.billingAddress,
        basketItems: input.basketItems,
      },
      (err: unknown, result: Record<string, unknown>) => {
        if (err) {
          resolve({ status: "failure", errorMessage: String(err) });
          return;
        }
        if (result.status === "success") {
          resolve({
            status: "success",
            paymentId: result.paymentId as string,
            paymentStatus: result.paymentStatus as string,
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
