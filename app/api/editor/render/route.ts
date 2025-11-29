import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, inputProps, format = 'mp4', quality = 'high' } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing composition ID' },
        { status: 400 }
      )
    }

    // Forward the render request to the render server
    const renderServerUrl = process.env.RENDER_SERVER_URL || 'http://localhost:3001'
    
    const response = await fetch(`${renderServerUrl}/api/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        inputProps,
        format,
        quality
      })
    })

    const result = await response.json()

    if (result.success) {
      return NextResponse.json({
        success: true,
        outputPath: result.outputPath,
        message: 'Video rendered successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Render failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Editor render error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
