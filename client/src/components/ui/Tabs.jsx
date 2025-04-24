"use client"

import { createContext, useContext, useState } from "react"

const TabsContext = createContext(null)

function Tabs({ defaultValue, children, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className = "" }) {
  return <div className={`flex space-x-1 border-b border-gray-200 ${className}`}>{children}</div>
}

function TabsTrigger({ value, children, className = "" }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <button
      className={`px-4 py-2 text-sm font-medium ${
        isActive
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
      } ${className}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className = "" }) {
  const { activeTab } = useContext(TabsContext)

  if (activeTab !== value) return null

  return <div className={`py-4 ${className}`}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
