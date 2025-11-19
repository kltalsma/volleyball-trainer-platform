import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('clubId')

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId parameter is required' },
        { status: 400 }
      )
    }

    // Fetch teams from Volleybal.nl API
    const apiUrl = `https://api.nevobo.nl/competitie/teams?vereniging=/relatiebeheer/verenigingen/${clubId}`
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/ld+json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Volleybal.nl API returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transform the data to a simpler format
    const teams = data['hydra:member'].map((team: any) => ({
      id: team.uuid,
      name: team.naam,
      category: team['@id'].split('/')[3], // e.g., 'dames', 'heren', 'meiden-a'
      number: team.volgnummer,
      ranking: team.standpositietekst || null,
      apiId: team['@id'],
    }))

    return NextResponse.json({
      success: true,
      clubId,
      totalTeams: data['hydra:totalItems'],
      teams,
    })
  } catch (error) {
    console.error('❌ Error fetching teams from Volleybal.nl:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
