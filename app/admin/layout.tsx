import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CNA Coin Admin",
  description: "Painel administrativo - Sistema de moedas de incentivo CNA",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
