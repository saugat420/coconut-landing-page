import nextEnv from "@next/env";
import { google } from "googleapis";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

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

function rgb(hex) {
  const value = hex.replace("#", "");
  return {
    red: parseInt(value.slice(0, 2), 16) / 255,
    green: parseInt(value.slice(2, 4), 16) / 255,
    blue: parseInt(value.slice(4, 6), 16) / 255,
  };
}

const colors = {
  ink: rgb("#173126"),
  leaf: rgb("#247A52"),
  mint: rgb("#DDF8E8"),
  aqua: rgb("#DDF7F4"),
  sun: rgb("#FFE19C"),
  cream: rgb("#F7FFF9"),
  white: rgb("#FFFFFF"),
  muted: rgb("#617167"),
  red: rgb("#FDE2E2"),
  redText: rgb("#9F1239"),
  green: rgb("#DCFCE7"),
  blue: rgb("#DBEAFE"),
  amber: rgb("#FEF3C7"),
};

const auth = new google.auth.JWT({
  email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = required("GOOGLE_SPREADSHEET_ID");
const ordersTitle = process.env.GOOGLE_SHEET_NAME || "Orders";
const dashboardTitle = "Dashboard";

async function getSpreadsheet() {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  return response.data;
}

async function ensureSheet(title) {
  let spreadsheet = await getSpreadsheet();
  let sheet = spreadsheet.sheets?.find((item) => item.properties?.title === title);

  if (!sheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
    spreadsheet = await getSpreadsheet();
    sheet = spreadsheet.sheets?.find((item) => item.properties?.title === title);
  }

  return sheet.properties.sheetId;
}

const ordersSheetId = await ensureSheet(ordersTitle);
const dashboardSheetId = await ensureSheet(dashboardTitle);

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `${ordersTitle}!A1:M1`,
  valueInputOption: "USER_ENTERED",
  requestBody: { values: [columns] },
});

await sheets.spreadsheets.values.clear({
  spreadsheetId,
  range: `${dashboardTitle}!A1:K40`,
});

await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId,
  requestBody: {
    valueInputOption: "USER_ENTERED",
    data: [
      {
        range: `${dashboardTitle}!A1:K1`,
        values: [["Coconut Orders Dashboard", "", "", "", "", "", "", "", "", "", ""]],
      },
      {
        range: `${dashboardTitle}!A2:K2`,
        values: [[
          "A clean snapshot of Cash On Delivery order performance.",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]],
      },
      {
        range: `${dashboardTitle}!A4:K9`,
        values: [
          ["Today", "", "", "This Week", "", "", "This Month", "", "", "All Time", ""],
          ["Orders", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=TODAY()))`, "", "Orders", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)>=TODAY()-WEEKDAY(TODAY(),2)+1),--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)<=TODAY()-WEEKDAY(TODAY(),2)+7))`, "", "Orders", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)>=DATE(YEAR(TODAY()),MONTH(TODAY()),1)),--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)<=EOMONTH(TODAY(),0)))`, "", "Orders", `=COUNTA(${ordersTitle}!A2:A)`],
          ["Revenue", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=TODAY()),${ordersTitle}!J2:J)`, "", "Revenue", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)>=TODAY()-WEEKDAY(TODAY(),2)+1),--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)<=TODAY()-WEEKDAY(TODAY(),2)+7),${ordersTitle}!J2:J)`, "", "Revenue", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)>=DATE(YEAR(TODAY()),MONTH(TODAY()),1)),--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)<=EOMONTH(TODAY(),0)),${ordersTitle}!J2:J)`, "", "Revenue", `=SUM(${ordersTitle}!J2:J)`],
          ["Delivered", `=COUNTIFS(${ordersTitle}!K2:K,"Delivered",${ordersTitle}!B2:B,">="&TEXT(TODAY(),"yyyy-mm-dd"),${ordersTitle}!B2:B,"<"&TEXT(TODAY()+1,"yyyy-mm-dd"))`, "", "Confirmed", `=COUNTIF(${ordersTitle}!K2:K,"Order Confirmed")`, "", "Ongoing", `=COUNTIF(${ordersTitle}!K2:K,"Order Ongoing")`, "", "Pending", `=COUNTIF(${ordersTitle}!K2:K,"New Order")`],
          ["Cancelled", `=COUNTIF(${ordersTitle}!K2:K,"Cancelled")`, "", "Avg Order", `=IFERROR(AVERAGE(${ordersTitle}!J2:J),0)`, "", "Pieces Sold", `=SUM(${ordersTitle}!H2:H)`, "", "COD Orders", `=COUNTIF(${ordersTitle}!L2:L,"Cash On Delivery")`],
          ["Last Updated", "=NOW()", "", "", "", "", "", "", "", "", ""],
        ],
      },
      {
        range: `${dashboardTitle}!A12:B18`,
        values: [
          ["Order Status", "Orders"],
          ...statuses.map((status) => [status, `=COUNTIF(${ordersTitle}!K2:K,"${status}")`]),
        ],
      },
      {
        range: `${dashboardTitle}!D12:F20`,
        values: [
          ["Last 7 Days", "Orders", "Revenue"],
          ["=TODAY()-6", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D13))`, `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D13),${ordersTitle}!J2:J)`],
          ["=TODAY()-5", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D14))`, `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D14),${ordersTitle}!J2:J)`],
          ["=TODAY()-4", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D15))`, `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D15),${ordersTitle}!J2:J)`],
          ["=TODAY()-3", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D16))`, `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D16),${ordersTitle}!J2:J)`],
          ["=TODAY()-2", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D17))`, `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D17),${ordersTitle}!J2:J)`],
          ["=TODAY()-1", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D18))`, `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D18),${ordersTitle}!J2:J)`],
          ["=TODAY()", `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D19))`, `=SUMPRODUCT(--(IFERROR(DATEVALUE(LEFT(${ordersTitle}!B2:B,10)),0)=D19),${ordersTitle}!J2:J)`],
        ],
      },
      {
        range: `${dashboardTitle}!H12:K18`,
        values: [
          ["Recent Orders", "", "", ""],
          ["Order ID", "Customer", "Status", "Total"],
          [`=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),1,1),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),1,3),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),1,11),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),1,10),"")`],
          [`=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),2,1),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),2,3),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),2,11),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),2,10),"")`],
          [`=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),3,1),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),3,3),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),3,11),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),3,10),"")`],
          [`=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),4,1),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),4,3),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),4,11),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),4,10),"")`],
          [`=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),5,1),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),5,3),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),5,11),"")`, `=IFERROR(INDEX(SORT(FILTER(${ordersTitle}!A2:K,${ordersTitle}!A2:A<>""),2,FALSE),5,10),"")`],
        ],
      },
    ],
  },
});

const requests = [
  {
    updateSheetProperties: {
      properties: {
        sheetId: ordersSheetId,
        gridProperties: { frozenRowCount: 1 },
        tabColor: colors.leaf,
      },
      fields: "gridProperties.frozenRowCount,tabColor",
    },
  },
  {
    updateSheetProperties: {
      properties: {
        sheetId: dashboardSheetId,
        gridProperties: { frozenRowCount: 2, hideGridlines: true },
        tabColor: colors.sun,
      },
      fields: "gridProperties.frozenRowCount,gridProperties.hideGridlines,tabColor",
    },
  },
  {
    setBasicFilter: {
      filter: {
        range: {
          sheetId: ordersSheetId,
          startRowIndex: 0,
          startColumnIndex: 0,
          endColumnIndex: columns.length,
        },
      },
    },
  },
  {
    repeatCell: {
      range: { sheetId: ordersSheetId },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.cream,
          textFormat: { foregroundColor: colors.ink, fontFamily: "Arial" },
          verticalAlignment: "MIDDLE",
        },
      },
      fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: ordersSheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: columns.length,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.leaf,
          horizontalAlignment: "CENTER",
          textFormat: {
            foregroundColor: colors.white,
            bold: true,
            fontSize: 10,
          },
        },
      },
      fields: "userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: ordersSheetId,
        startRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: columns.length,
      },
      cell: {
        userEnteredFormat: {
          borders: {
            bottom: { style: "SOLID", width: 1, color: colors.mint },
          },
        },
      },
      fields: "userEnteredFormat.borders.bottom",
    },
  },
  {
    setDataValidation: {
      range: {
        sheetId: ordersSheetId,
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
    repeatCell: {
      range: {
        sheetId: ordersSheetId,
        startRowIndex: 1,
        startColumnIndex: 7,
        endColumnIndex: 10,
      },
      cell: {
        userEnteredFormat: {
          numberFormat: { type: "NUMBER", pattern: "#,##0" },
          horizontalAlignment: "RIGHT",
        },
      },
      fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
    },
  },
  {
    autoResizeDimensions: {
      dimensions: {
        sheetId: ordersSheetId,
        dimension: "COLUMNS",
        startIndex: 0,
        endIndex: columns.length,
      },
    },
  },
  {
    mergeCells: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      mergeType: "MERGE_ALL",
    },
  },
  {
    mergeCells: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 1,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      mergeType: "MERGE_ALL",
    },
  },
  {
    repeatCell: {
      range: { sheetId: dashboardSheetId },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.cream,
          textFormat: { foregroundColor: colors.ink, fontFamily: "Arial" },
          verticalAlignment: "MIDDLE",
        },
      },
      fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.leaf,
          horizontalAlignment: "CENTER",
          textFormat: { foregroundColor: colors.white, bold: true, fontSize: 24 },
        },
      },
      fields: "userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 1,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.mint,
          horizontalAlignment: "CENTER",
          textFormat: { foregroundColor: colors.ink, fontSize: 11 },
        },
      },
      fields: "userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 3,
        endRowIndex: 9,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.white,
          borders: {
            top: { style: "SOLID", width: 1, color: colors.mint },
            bottom: { style: "SOLID", width: 1, color: colors.mint },
            left: { style: "SOLID", width: 1, color: colors.mint },
            right: { style: "SOLID", width: 1, color: colors.mint },
          },
        },
      },
      fields: "userEnteredFormat(backgroundColor,borders)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 3,
        endRowIndex: 4,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.ink,
          horizontalAlignment: "CENTER",
          textFormat: { foregroundColor: colors.white, bold: true, fontSize: 12 },
        },
      },
      fields: "userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 4,
        endRowIndex: 9,
        startColumnIndex: 1,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          horizontalAlignment: "CENTER",
          textFormat: { bold: true, fontSize: 13 },
        },
      },
      fields: "userEnteredFormat(horizontalAlignment,textFormat)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 11,
        endRowIndex: 20,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.white,
          borders: {
            bottom: { style: "SOLID", width: 1, color: colors.mint },
          },
        },
      },
      fields: "userEnteredFormat(backgroundColor,borders.bottom)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 11,
        endRowIndex: 12,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: colors.aqua,
          textFormat: { bold: true, foregroundColor: colors.ink },
        },
      },
      fields: "userEnteredFormat(backgroundColor,textFormat)",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startRowIndex: 12,
        startColumnIndex: 3,
        endColumnIndex: 4,
      },
      cell: {
        userEnteredFormat: {
          numberFormat: { type: "DATE", pattern: "mmm d" },
        },
      },
      fields: "userEnteredFormat.numberFormat",
    },
  },
  {
    repeatCell: {
      range: {
        sheetId: dashboardSheetId,
        startColumnIndex: 0,
        endColumnIndex: 11,
      },
      cell: {
        userEnteredFormat: {
          wrapStrategy: "WRAP",
        },
      },
      fields: "userEnteredFormat.wrapStrategy",
    },
  },
];

const statusColors = [
  ["New Order", colors.sun, colors.ink],
  ["Order Confirmed", colors.blue, colors.ink],
  ["Order Ongoing", colors.aqua, colors.ink],
  ["Delivered", colors.green, colors.ink],
  ["Cancelled", colors.red, colors.redText],
];

for (const [status, background, text] of statusColors) {
  requests.push({
    addConditionalFormatRule: {
      index: 0,
      rule: {
        ranges: [
          {
            sheetId: ordersSheetId,
            startRowIndex: 1,
            startColumnIndex: 10,
            endColumnIndex: 11,
          },
        ],
        booleanRule: {
          condition: {
            type: "TEXT_EQ",
            values: [{ userEnteredValue: status }],
          },
          format: {
            backgroundColor: background,
            textFormat: { foregroundColor: text, bold: true },
          },
        },
      },
    },
  });
}

for (const [index, width] of [150, 120, 160, 130, 190, 230, 130, 90, 120, 120, 150, 145, 250].entries()) {
  requests.push({
    updateDimensionProperties: {
      range: {
        sheetId: ordersSheetId,
        dimension: "COLUMNS",
        startIndex: index,
        endIndex: index + 1,
      },
      properties: { pixelSize: width },
      fields: "pixelSize",
    },
  });
}

for (const [index, width] of [150, 120, 26, 150, 120, 26, 150, 120, 26, 150, 120].entries()) {
  requests.push({
    updateDimensionProperties: {
      range: {
        sheetId: dashboardSheetId,
        dimension: "COLUMNS",
        startIndex: index,
        endIndex: index + 1,
      },
      properties: { pixelSize: width },
      fields: "pixelSize",
    },
  });
}

await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: { requests },
});

console.log("Google Sheet design applied successfully.");
console.log(`Orders tab: ${ordersTitle}`);
console.log(`Dashboard tab: ${dashboardTitle}`);
console.log(`URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
