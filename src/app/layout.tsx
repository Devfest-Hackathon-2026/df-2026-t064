
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../i18n/LanguageProvider";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

// ブラウザのタブや検索結果に出るタイトルと説明
export const metadata: Metadata = {
  title: "避難場ナビ",
  description: "知らない土地での避難確認",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ja">
      {/* 画面ぴったりの高さにして、ヘッダー + 地図エリアを縦に並べる */}
      <body className="flex h-dvh flex-col overflow-hidden">
        <LanguageProvider>
          <Header />
          {children}
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
