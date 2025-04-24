function Progress({ value = 0, max = 100, className = "" }) {
  const percentage = Math.min(Math.max(value, 0), max)

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(percentage / max) * 100}%` }}></div>
    </div>
  )
}

export default Progress
