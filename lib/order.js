import { google } from "googleapis";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { product } from "@/lib/product";

const sheetColumns = [
  "Order ID",
  "Date & Time",
  "Name",
  "Phone",
  "Email",
  "Location",
  "Product",
  "Quantity",
  "Price Per Piece",
  "Total Price",
  "Order Status",
  "Payment Method",
  "Notes",
];

export function generateOrderId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `COCO-${stamp}-${random}`;
}

export function isLiveOrderMode() {
  return process.env.ORDER_MODE === "live";
}

export function validateOrder(input) {
  const errors = {};
  const name = String(input.name || "").trim();
  const phone = String(input.phone || "").trim();
  const email = String(input.email || "").trim();
  const location = String(input.location || "").trim();
  const quantity = Number(input.quantity);
  const totalPrice = Number(input.totalPrice);
  const expectedTotal = quantity * product.offerPrice + product.deliveryFee;

  if (!name) errors.name = "Name is required.";
  if (!phone) errors.phone = "Phone number is required.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!location) errors.location = "Exact location is required.";
  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = "Quantity must be at least 1.";
  }
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    errors.totalPrice = "Total price must be valid.";
  }
  if (Number.isInteger(quantity) && Number.isFinite(totalPrice) && totalPrice !== expectedTotal) {
    errors.totalPrice = "Total price does not match the selected quantity.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      phone,
      email,
      location,
      productName: product.name,
      quantity,
      pricePerPiece: product.offerPrice,
      totalPrice: expectedTotal,
      orderStatus: "New Order",
      paymentMethod: "Cash On Delivery",
      notes: product.bonus,
    },
  };
}

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey || !process.env.GOOGLE_SPREADSHEET_ID) {
    throw new Error("Google Sheets environment variables are not configured.");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendOrderToSheet(order) {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Orders";

  await ensureOrderSheet(sheets, sheetName);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    range: `${sheetName}!A:M`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          order.orderId,
          order.dateTime,
          order.name,
          order.phone,
          order.email,
          order.location,
          order.productName,
          order.quantity,
          order.pricePerPiece,
          order.totalPrice,
          order.orderStatus,
          order.paymentMethod,
          order.notes,
        ],
      ],
    },
  });
}

async function ensureOrderSheet(sheets, sheetName) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  let sheet = spreadsheet.data.sheets?.find(
    (item) => item.properties?.title === sheetName,
  );

  if (!sheet) {
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    sheet = response.data.replies?.[0]?.addSheet;
  }

  const sheetId = sheet?.properties?.sheetId;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:M1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [sheetColumns] },
  });

  if (typeof sheetId === "number") {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: sheetColumns.length,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.87, green: 0.97, blue: 0.91 },
                },
              },
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
          {
            setDataValidation: {
              range: {
                sheetId,
                startRowIndex: 1,
                startColumnIndex: 10,
                endColumnIndex: 11,
              },
              rule: {
                condition: {
                  type: "ONE_OF_LIST",
                  values: [
                    "New Order",
                    "Order Confirmed",
                    "Order Ongoing",
                    "Delivered",
                    "Cancelled",
                  ].map((status) => ({ userEnteredValue: status })),
                },
                showCustomUi: true,
                strict: true,
              },
            },
          },
        ],
      },
    });
  }
}

function formatEmailOrder(order) {
  return `
Order ID: ${order.orderId}
Customer Name: ${order.name}
Phone Number: ${order.phone}
Email: ${order.email}
Location: ${order.location}
Product: ${order.productName}
Quantity: ${order.quantity}
Total Price: Rs ${order.totalPrice}
Payment Method: ${order.paymentMethod}
Order Status: ${order.orderStatus}
`;
}

export async function sendOrderEmails(order) {
  if (process.env.EMAIL_PROVIDER === "gmail") {
    return sendGmailOrderEmails(order);
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const businessEmail = process.env.BUSINESS_EMAIL || "bsaugat59@gmail.com";
  const senderEmail = process.env.SENDER_EMAIL || businessEmail;
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || product.brandName;
  const from = `${brandName} <${senderEmail}>`;

  await Promise.all([
    resend.emails.send({
      from,
      to: businessEmail,
      replyTo: order.email,
      subject: "New Product Order Received",
      text: formatEmailOrder(order),
    }),
    resend.emails.send({
      from,
      to: order.email,
      replyTo: senderEmail,
      subject: "Your Order Has Been Received",
      text: `Hi ${order.name},

Thank you for your order.

Here are your order details:

Product: ${order.productName}
Quantity: ${order.quantity}
Total Price: Rs ${order.totalPrice}
Payment Method: Cash On Delivery

Our sales representative will call you soon to confirm your order.

Thank you,
${brandName}
`,
    }),
  ]);
}

async function sendGmailOrderEmails(order) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail SMTP environment variables are not configured.");
  }

  const businessEmail = process.env.BUSINESS_EMAIL || gmailUser;
  const senderEmail = process.env.SENDER_EMAIL || gmailUser;
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || product.brandName;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await Promise.all([
    transporter.sendMail({
      from: `${brandName} <${senderEmail}>`,
      to: businessEmail,
      replyTo: order.email,
      subject: "New Product Order Received",
      text: formatEmailOrder(order),
    }),
    transporter.sendMail({
      from: `${brandName} <${senderEmail}>`,
      to: order.email,
      replyTo: businessEmail,
      subject: "Your Order Has Been Received",
      text: `Hi ${order.name},

Thank you for your order.

Here are your order details:

Product: ${order.productName}
Quantity: ${order.quantity}
Total Price: Rs ${order.totalPrice}
Payment Method: Cash On Delivery

Our sales representative will call you soon to confirm your order.

Thank you,
${brandName}
`,
    }),
  ]);
}

export async function saveDemoOrder(order) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const ordersDir = path.join(process.cwd(), "demo-orders");
  const ordersFile = path.join(ordersDir, "orders.json");

  await fs.mkdir(ordersDir, { recursive: true });

  let existingOrders = [];
  try {
    const fileContent = await fs.readFile(ordersFile, "utf8");
    existingOrders = JSON.parse(fileContent);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  existingOrders.push(order);
  await fs.writeFile(ordersFile, `${JSON.stringify(existingOrders, null, 2)}\n`);
}

export { sheetColumns };
