import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Use your existing stock profile API logic here
    const apiKey = process.env.STOCK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Stock API not configured' }, { status: 500 })
    }

    // Replace with your actual profile API
    const response = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`Profile API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform profile data based on your API structure
    const profile = {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      sector: data.Sector,
      industry: data.Industry,
      marketCap: data.MarketCapitalization,
      peRatio: data.PERatio,
      dividendYield: data.DividendYield,
      logo: `https://logo.clearbit.com/${data.Name?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching stock profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock profile' },
      { status: 500 }
    )
  }
}
