import { google } from "googleapis";

const columns = [
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

const statuses = [
  "New Order",
  "Order Confirmed",
  "Order Ongoing",
  "Delivered",
  "Cancelled",
];

function required(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required.`);
  }
  return process.env[name];
}

const auth = new google.auth.JWT({
  email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });
const sheetTitle = process.env.GOOGLE_SHEET_NAME || "Orders";

const spreadsheet = await sheets.spreadsheets.create({
  requestBody: {
    properties: { title: "Coconut COD Orders" },
    sheets: [{ properties: { title: sheetTitle } }],
  },
});

const spreadsheetId = spreadsheet.data.spreadsheetId;
const firstSheetId = spreadsheet.data.sheets[0].properties.sheetId;

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `${sheetTitle}!A1:M1`,
  valueInputOption: "USER_ENTERED",
  requestBody: { values: [columns] },
});

await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      {
        repeatCell: {
          range: {
            sheetId: firstSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: columns.length,
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
            sheetId: firstSheetId,
            startRowIndex: 1,
            startColumnIndex: 10,
            endColumnIndex: 11,
          },
          rule: {
            condition: {
              type: "ONE_OF_LIST",
              values: statuses.map((status) => ({ userEnteredValue: status })),
            },
            showCustomUi: true,
            strict: true,
          },
        },
      },
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: firstSheetId,
            dimension: "COLUMNS",
            startIndex: 0,
            endIndex: columns.length,
          },
        },
      },
    ],
  },
});

if (process.env.GOOGLE_SHARE_WITH_EMAIL) {
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      type: "user",
      role: "writer",
      emailAddress: process.env.GOOGLE_SHARE_WITH_EMAIL,
    },
    sendNotificationEmail: true,
  });
}

console.log("Google Sheet created successfully.");
console.log(`Spreadsheet ID: ${spreadsheetId}`);
console.log(`Sheet tab: ${sheetTitle}`);
console.log(`URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
