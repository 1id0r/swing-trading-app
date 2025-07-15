import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Use your existing stock API logic here
    // For now, I'll show a basic structure - replace with your actual implementation
    
    // Example using Alpha Vantage or your preferred API
    const apiKey = process.env.STOCK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Stock API not configured' }, { status: 500 })
    }

    // Replace this URL with your actual stock API
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`Stock API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform the response based on your API structure
    // This is a placeholder - adjust based on your actual API response
    const quote = {
      symbol: symbol.toUpperCase(),
      price: parseFloat(data['Global Quote']?.['05. price'] || '0'),
      change: parseFloat(data['Global Quote']?.['09. change'] || '0'),
      changePercent: data['Global Quote']?.['10. change percent'] || '0%',
      volume: parseInt(data['Global Quote']?.['06. volume'] || '0'),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error fetching stock quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock quote' },
      { status: 500 }
    )
  }
}