// Create this file: /src/app/api/debug/check-api/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results = {
    step1_environment: null as any,
    step2_direct_finnhub: null as any,
    step3_internal_batch: null as any,
    step4_conclusion: null as any,
  };

  try {
    // Step 1: Check environment
    console.log('🔍 Step 1: Checking environment...');
    const apiKey = process.env.FINNHUB_API_KEY;
    
    results.step1_environment = {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 6) + '...' : 'NOT_SET',
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('🔍 Environment check:', results.step1_environment);

    if (!apiKey) {
      results.step4_conclusion = {
        issue: 'MISSING_API_KEY',
        solution: 'Add FINNHUB_API_KEY=your_key_here to your .env.local file',
        getKeyFrom: 'https://finnhub.io/dashboard (free signup)'
      };
      return NextResponse.json(results);
    }

    // Step 2: Test direct Finnhub API
    console.log('🔍 Step 2: Testing direct Finnhub API...');
    const directUrl = `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`;
    
    try {
      const directResponse = await fetch(directUrl);
      const directData = await directResponse.json();
      
      results.step2_direct_finnhub = {
        status: directResponse.status,
        statusText: directResponse.statusText,
        success: directResponse.ok,
        data: directData,
        hasValidPrice: directData.c && directData.c > 0
      };
      
      console.log('🔍 Direct API result:', results.step2_direct_finnhub);
      
    } catch (directError) {
      results.step2_direct_finnhub = {
        error: 'NETWORK_ERROR',
        message: directError.message
      };
      console.error('❌ Direct API error:', directError);
    }

    // Step 3: Test internal batch API
    console.log('🔍 Step 3: Testing internal batch API...');
    try {
      const batchUrl = `${request.nextUrl.origin}/api/stocks/batch-quotes`;
      const batchResponse = await fetch(batchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols: ['AAPL', 'MSFT'] }),
      });
      
      const batchData = await batchResponse.json();
      
      results.step3_internal_batch = {
        status: batchResponse.status,
        statusText: batchResponse.statusText,
        success: batchResponse.ok,
        data: batchData,
        quotesCount: batchData.quotes ? Object.keys(batchData.quotes).length : 0
      };
      
      console.log('🔍 Batch API result:', results.step3_internal_batch);
      
    } catch (batchError) {
      results.step3_internal_batch = {
        error: 'BATCH_API_ERROR',
        message: batchError.message
      };
      console.error('❌ Batch API error:', batchError);
    }

    // Step 4: Conclusion
    console.log('🔍 Step 4: Analyzing results...');
    
    if (results.step2_direct_finnhub?.success && results.step2_direct_finnhub?.hasValidPrice) {
      if (results.step3_internal_batch?.success && results.step3_internal_batch?.quotesCount > 0) {
        results.step4_conclusion = {
          status: 'ALL_WORKING',
          message: 'Both direct API and batch API are working correctly',
          action: 'Your stock API should be working - check positions route logs'
        };
      } else {
        results.step4_conclusion = {
          status: 'BATCH_API_ISSUE',
          message: 'Direct API works but batch API is failing',
          action: 'Check /api/stocks/batch-quotes route implementation'
        };
      }
    } else {
      results.step4_conclusion = {
        status: 'DIRECT_API_ISSUE',
        message: 'Direct Finnhub API is failing',
        possibleCauses: [
          'Invalid API key',
          'API key rate limit exceeded',
          'Network/firewall issue',
          'Finnhub service down'
        ],
        action: 'Check your API key and try again'
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Debug check failed:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      message: error.message,
      results
    }, { status: 500 });
  }
}