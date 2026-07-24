import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "ByteShelf — Smart Inventory Management",
  description:
    "Streamline your warehouse and inventory management with ByteShelf. Join merchants and warehouse owners today.",
  keywords: ["inventory", "warehouse", "shelf management", "ByteShelf"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
