"use client"

import { useState, useRef, useEffect } from "react"

function Select({ value, onValueChange, placeholder, options = [], className = "", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState("bottom") // "top" or "bottom"
  const selectRef = useRef(null)

  const toggleSelect = () => {
    if (disabled || !options || options.length === 0) return;
    setIsOpen(!isOpen)
  }

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscapeKey)
      }
    }
  }, [isOpen])

  // Close dropdown on scroll/resize
  useEffect(() => {
    function closeDropdown() {
      setIsOpen(false)
    }
    
    if (isOpen) {
      window.addEventListener("scroll", closeDropdown, true)
      window.addEventListener("resize", closeDropdown)
    }
    return () => {
      window.removeEventListener("scroll", closeDropdown, true)
      window.removeEventListener("resize", closeDropdown)
    }
  }, [isOpen])

  // Cleanup effect to close dropdown when options change
  useEffect(() => {
    if (!options || options.length === 0) {
      setIsOpen(false)
    }
  }, [options])

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = Math.min(240, options.length * 40) // Estimate dropdown height
      
      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        setPosition("bottom")
      } else {
        setPosition("top")
      }
    }
  }, [isOpen, options.length])

  const selectedOption = options?.find((option) => option.value === value)

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        className={`relative w-full border border-gray-700/50 bg-white/5 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#93725E] focus:border-[#93725E] text-gray-200 transition-all duration-200 hover:border-gray-600/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        onClick={toggleSelect}
        disabled={disabled}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder || "Select an option"}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown - rendered inline with smart positioning */}
      {isOpen && options && options.length > 0 && (
        <div className={`absolute z-50 w-full bg-[#29252c] shadow-xl border border-gray-600/50 rounded-md py-1 text-base ring-1 ring-gray-400 max-h-60 overflow-auto ${
          position === "bottom" ? "mt-1" : "mb-1 bottom-full"
        }`}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[#93725E]/20 transition-colors duration-150 ${
                value === option.value ? "bg-[#93725E] text-white" : "text-[#FFF8E7] hover:text-white"
              }`}
              onClick={() => {
                onValueChange(option.value)
                setIsOpen(false)
              }}
            >
              <span className="block truncate">{option.label}</span>
              {value === option.value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-white">
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Select
