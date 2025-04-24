function Button({
  children,
  type = "button",
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  onClick,
  ...props
}) {
  const variantClasses = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    link: "bg-transparent underline text-blue-600 hover:text-blue-800",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
  }

  const sizeClasses = {
    sm: "py-1 px-3 text-sm",
    default: "py-2 px-4",
    lg: "py-3 px-6 text-lg",
    icon: "p-2",
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        variantClasses[variant] || variantClasses.default
      } ${sizeClasses[size] || sizeClasses.default} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
