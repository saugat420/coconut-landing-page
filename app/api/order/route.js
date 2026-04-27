import { NextResponse } from "next/server";
import {
  appendOrderToSheet,
  generateOrderId,
  isLiveOrderMode,
  saveDemoOrder,
  sendOrderEmails,
  validateOrder,
} from "@/lib/order";

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = validateOrder(body);

    if (!validation.valid) {
      return NextResponse.json(
        { message: "Please fix the highlighted fields.", errors: validation.errors },
        { status: 400 },
      );
    }

    const order = {
      ...validation.data,
      orderId: generateOrderId(),
      dateTime: new Date().toISOString(),
    };

    if (isLiveOrderMode()) {
      await appendOrderToSheet(order);
      await sendOrderEmails(order);
    } else {
      await saveDemoOrder(order);
    }

    return NextResponse.json({
      success: true,
      mode: isLiveOrderMode() ? "live" : "demo",
      order,
    });
  } catch (error) {
    console.error("Order submission failed", error);
    return NextResponse.json(
      {
        message:
          "Order could not be submitted. Please check Google Sheets and email environment variables, then try again.",
      },
      { status: 500 },
    );
  }
}
