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

    let emailWarning = null;

    if (isLiveOrderMode()) {
      try {
        await appendOrderToSheet(order);
      } catch (error) {
        console.error("Google Sheets order save failed", error);
        return NextResponse.json(
          {
            message:
              "Order could not be saved to Google Sheets. Please check the spreadsheet ID, service account access, and Google private key.",
          },
          { status: 500 },
        );
      }

      try {
        await sendOrderEmails(order);
      } catch (error) {
        console.error("Order email notification failed", error);
        emailWarning =
          "Order was saved, but email notification failed. Please check Gmail app password settings.";
      }
    } else {
      await saveDemoOrder(order);
    }

    return NextResponse.json({
      success: true,
      mode: isLiveOrderMode() ? "live" : "demo",
      warning: emailWarning,
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
