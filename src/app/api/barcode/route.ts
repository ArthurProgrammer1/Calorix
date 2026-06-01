import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('code')
  if (!barcode) return Response.json({ error: 'No barcode provided' }, { status: 400 })

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'Calorix/1.0' }, next: { revalidate: 86400 } }
    )
    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    const p = data.product
    const n = p.nutriments || {}

    const kcal100 = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)
    const name = [p.product_name, p.brands].filter(Boolean).join(' — ') || 'Unknown product'

    return Response.json({
      name,
      serving: p.serving_size || '100g',
      per100g: {
        calories: Math.round(kcal100),
        protein:  Math.round(n['proteins_100g']        ?? 0),
        carbs:    Math.round(n['carbohydrates_100g']   ?? 0),
        fat:      Math.round(n['fat_100g']             ?? 0),
      },
    })
  } catch {
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}
