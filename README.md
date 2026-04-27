# Coconut COD Sales Funnel

A production-ready Next.js sales funnel for Cash On Delivery orders.

## Stack

- Next.js App Router
- Tailwind CSS
- Google Sheets API for order storage
- Resend for owner and customer email notifications
- Vercel-ready environment variables

## Order Flow

1. Customer chooses quantity on `/`.
2. Product, quantity, and total price are passed to `/checkout`.
3. Customer submits name, phone, email, and exact location.
4. `/api/order` validates the request, generates an Order ID, saves the order to Google Sheets, sends two emails, and returns success.
5. Customer is redirected to `/thank-you`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
BUSINESS_EMAIL="bsaugat59@gmail.com"
SENDER_EMAIL="bsaugat59@gmail.com"
NEXT_PUBLIC_BRAND_NAME="Coconut"
RESEND_API_KEY="re_xxxxxxxxx"
ORDER_MODE="demo"
EMAIL_PROVIDER="gmail"
GMAIL_USER="bsaugat59@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-gmail-app-password"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID="your-google-spreadsheet-id"
GOOGLE_SHEET_NAME="Orders"
GOOGLE_SHARE_WITH_EMAIL="your-google-account@gmail.com"
```

## Create The Google Sheet

1. Create a Google Cloud service account.
2. Enable Google Sheets API and Google Drive API.
3. Add the service account email and private key to `.env.local`.
4. Optionally add `GOOGLE_SHARE_WITH_EMAIL` so the script shares the created Sheet with you.
5. Run:

```bash
npm run setup:google-sheet
```

Add the printed Spreadsheet ID to `GOOGLE_SPREADSHEET_ID`.

For real order submissions on Vercel, set:

```bash
ORDER_MODE="live"
```

When `ORDER_MODE` is not `live`, the app runs in local demo mode and saves test orders to `demo-orders/orders.json` instead of sending emails or writing to Google Sheets.

The script creates an `Orders` sheet with:

`Order ID, Date & Time, Name, Phone, Email, Location, Product, Quantity, Price Per Piece, Total Price, Order Status, Payment Method, Notes`

The Order Status column includes:

`New Order, Order Confirmed, Order Ongoing, Delivered, Cancelled`

## Email Setup

The easiest setup for your current Gmail is:

```bash
EMAIL_PROVIDER="gmail"
GMAIL_USER="bsaugat59@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-gmail-app-password"
BUSINESS_EMAIL="bsaugat59@gmail.com"
SENDER_EMAIL="bsaugat59@gmail.com"
```

Create the app password from your Google Account security settings. Your Google account must have 2-Step Verification enabled before Google shows app passwords.

You can also use Resend by setting `EMAIL_PROVIDER="resend"` and adding `RESEND_API_KEY`. In production, verify your sending domain in Resend and set `SENDER_EMAIL` to an address on that domain.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy On Vercel

1. Push this project to GitHub.
2. Import it in Vercel.
3. Add the same environment variables in Vercel Project Settings.
4. Deploy.
