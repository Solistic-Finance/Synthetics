// Generate mock price data for the chart
export function generateMockPriceData(currentPrice: number, timeRange: string) {
  const now = new Date()
  let startDate: Date
  let dataPoints: number
  let volatility: number

  // Set parameters based on time range
  switch (timeRange) {
    case "1D":
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 1)
      dataPoints = 24 // hourly data points
      volatility = 0.005
      break
    case "1W":
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      dataPoints = 28 // 4 data points per day
      volatility = 0.01
      break
    case "1M":
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 1)
      dataPoints = 30 // daily data points
      volatility = 0.02
      break
    case "3M":
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 3)
      dataPoints = 45 // every other day
      volatility = 0.03
      break
    case "1Y":
      startDate = new Date(now)
      startDate.setFullYear(now.getFullYear() - 1)
      dataPoints = 52 // weekly data points
      volatility = 0.05
      break
    case "ALL":
      startDate = new Date(now)
      startDate.setFullYear(now.getFullYear() - 3)
      dataPoints = 36 // monthly data points
      volatility = 0.08
      break
    default:
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      dataPoints = 28
      volatility = 0.01
  }

  // Generate random walk price data
  const data = []
  let price = currentPrice * (1 - Math.random() * 0.1) // Start slightly below current price

  // Calculate time increment based on data points
  const timeIncrement = (now.getTime() - startDate.getTime()) / dataPoints

  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startDate.getTime() + timeIncrement * i)

    // Random walk with trend towards current price
    const randomChange = (Math.random() - 0.5) * 2 * volatility * price
    const trendFactor = 0.05 * ((currentPrice - price) / price)
    price = price * (1 + randomChange + trendFactor)

    // Ensure price is positive
    price = Math.max(price, 0.01)

    data.push({
      date: date.toISOString(),
      price,
    })
  }

  // Ensure the last data point is the current price
  if (data.length > 0) {
    data[data.length - 1].price = currentPrice
  }

  return data
}
