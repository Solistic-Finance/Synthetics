import type React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area } from "recharts"

export const ChartGrid = () => {
  return <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
}

export const ChartLine = ({
  dataKey,
  strokeWidth,
  stroke,
}: { dataKey: string; strokeWidth: number; stroke: string }) => {
  return <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={strokeWidth} />
}

export const ChartArea = ({ dataKey, fill, opacity }: { dataKey: string; fill: string; opacity: number }) => {
  return <Area type="monotone" dataKey={dataKey} strokeWidth={2} fill={fill} fillOpacity={opacity} />
}

export const ChartTooltip = ({ content }: { content: any }) => {
  return <Tooltip content={content} />
}

export const ChartLegend = () => {
  return <Legend />
}

export const ChartContainer = ({
  data,
  xAxisKey,
  yAxisWidth,
  children,
  showAnimation,
}: { data: any[]; xAxisKey: string; yAxisWidth: number; children: React.ReactNode; showAnimation: boolean }) => {
  return (
    <LineChart width={730} height={250} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <XAxis dataKey={xAxisKey} />
      <YAxis width={yAxisWidth} />
      {children}
    </LineChart>
  )
}
