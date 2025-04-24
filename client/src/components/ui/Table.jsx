function Table({ children, className = "" }) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>
    </div>
  )
}

function TableHeader({ children, className = "" }) {
  return <thead className={`bg-gray-50 ${className}`}>{children}</thead>
}

function TableBody({ children, className = "" }) {
  return <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>{children}</tbody>
}

function TableRow({ children, className = "" }) {
  return <tr className={className}>{children}</tr>
}

function TableHead({ children, className = "" }) {
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  )
}

function TableCell({ children, className = "" }) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}>{children}</td>
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
