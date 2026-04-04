function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-10 bg-white shadow-xl rounded-2xl border border-gray-100 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          ExpenseMate 💸
        </h1>
        <p className="text-gray-600 mb-6">
          Mirësevini në aplikacionin tuaj të menaxhimit të shpenzimeve.
        </p>
        <button className="px-6 py-2 bg-secondary text-white font-semibold rounded-lg hover:opacity-90 transition-all">
          Nisni Tani
        </button>
      </div>
    </div>
  )
}

export default App