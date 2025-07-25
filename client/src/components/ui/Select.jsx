"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

function Select({ value, onValueChange, placeholder, options, className = "" }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const dropdownRef = useRef(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  const toggleSelect = () => setIsOpen(!isOpen)

  // Improved click outside handler for portal
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on scroll/resize
  useEffect(() => {
    function closeDropdown(e) {
      // Only close if the scroll event is outside the dropdown
      if (
        dropdownRef.current &&
        e && e.target instanceof Node &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
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

  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [isOpen])

  const selectedOption = options.find((option) => option.value === value)

  // Dropdown content
  const dropdown = (
    <div
      ref={dropdownRef}
      className="bg-[#29252c] shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-gray-400 overflow-auto focus:outline-none sm:text-sm pointer-events-auto"
      style={{ minWidth: dropdownPos.width }}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className={`cursor-default select-none relative py-2 pl-3 pr-9 hover:backdrop-brightness-150 ${
            value === option.value ? "bg-[#93725E] text-white" : "text-[#FFF8E7]"
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
  )

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        className={`relative w-full border border-gray-700/50 bg-white/5 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[#93725E] focus:border-[#93725E] text-gray-200 ${className}`}
        onClick={toggleSelect}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder || "Select an option"}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
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

      {isOpen &&
        (typeof window !== "undefined" && document.body && selectRef.current
          ? createPortal(
              <div
                className="fixed z-[9999] pointer-events-auto"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  minWidth: dropdownPos.width,
                }}
              >
                {dropdown}
              </div>,
              document.body
            )
          : dropdown)}
    </div>
  )
}

export default Select
