"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { generateMockPriceData } from "@/lib/mock-data"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"

interface PriceChartProps {
  currentPrice: number | null
}

type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL"

export default function PriceChart({ currentPrice }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1W")
  const [priceData, setPriceData] = useState<any[]>([])
  const [priceChange, setPriceChange] = useState<{ value: number; percentage: number }>({
    value: 0,
    percentage: 0,
  })
  const [isPositiveChange, setIsPositiveChange] = useState(true)

  useEffect(() => {
    if (!currentPrice) return

    // Generate mock price data based on the selected time range
    const data = generateMockPriceData(currentPrice, timeRange)
    setPriceData(data)

    // Calculate price change
    if (data.length > 1) {
      const firstPrice = data[0].price
      const lastPrice = data[data.length - 1].price
      const change = lastPrice - firstPrice
      const percentChange = (change / firstPrice) * 100

      setPriceChange({
        value: change,
        percentage: percentChange,
      })
      setIsPositiveChange(change >= 0)
    }
  }, [currentPrice, timeRange])

  // Format date for x-axis
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem)

    // Different formats based on time range
    if (timeRange === "1D") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (timeRange === "1W" || timeRange === "1M") {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    } else {
      return date.toLocaleDateString([], { month: "short", year: "2-digit" })
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const date = new Date(data.date)
      return (
        <div className="bg-background border rounded-md shadow-sm p-2 text-sm">
          <p className="font-medium">${formatCurrency(data.price)}</p>
          <p className="text-muted-foreground text-xs">
            {date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}{" "}
            {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )
    }
    return null
  }

  if (!currentPrice) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>sTSLA Price</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading price data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">sTSLA Price</CardTitle>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">${formatCurrency(currentPrice)}</span>
            <span className={`text-sm font-medium ${isPositiveChange ? "text-green-500" : "text-red-500"}`}>
              {isPositiveChange ? "+" : ""}
              {formatCurrency(priceChange.value)} ({isPositiveChange ? "+" : ""}
              {priceChange.percentage.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="h-7 px-2 text-xs"
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositiveChange ? "hsl(142.1 76.2% 36.3%)" : "hsl(0 84.2% 60.2%)"}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositiveChange ? "hsl(142.1 76.2% 36.3%)" : "hsl(0 84.2% 60.2%)"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositiveChange ? "hsl(142.1 76.2% 36.3%)" : "hsl(0 84.2% 60.2%)"}
                fillOpacity={0.2}
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
