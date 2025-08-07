import React from "react"

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen">
      <img src="/cna-logo.png" alt="Logo CNA" className="w-24 h-24 animate-spin mb-4" />
      <span className="text-lg text-red-700 font-bold">Carregando...</span>
    </div>
  )
}
