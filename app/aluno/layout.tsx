import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CNA Coin",
  description: "Dashboard do aluno - Sistema de moedas de incentivo CNA",
}

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
