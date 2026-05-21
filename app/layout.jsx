import "./globals.css";

export const metadata = {
  title: "Coconut | Real Coconut",
  description: "Fresh real coconut delivered with Cash On Delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
