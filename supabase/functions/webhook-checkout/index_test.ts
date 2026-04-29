import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { handleWebhookCheckout, normalizeZedyPayload } from './index.ts'

const USER_ID = '239cf99c-a405-4624-80fb-b7d1f3026a20'

function zedyPayload(status: string, orderId = `Z-${status.toUpperCase()}-TEST`) {
  return {
    orderId,
    platform: 'ZedyCheckout',
    paymentMethod: status === 'waiting_payment' ? 'pix' : 'credit',
    status,
    createdAt: '2026-04-28T22:27:00.000Z',
    approvedDate: status === 'paid' ? '2026-04-28T22:28:00.000Z' : null,
    refundedAt: status === 'refunded' ? '2026-04-29T10:00:00.000Z' : null,
    customer: {
      name: 'Cliente Valido',
      email: 'cliente@exemplo.com',
      phone: '+5511999999999',
    },
    products: [{ id: 123, name: 'Produto Zedy', quantity: 2, priceInCents: 4990 }],
    trackingParameters: {
      src: 'facebook',
      sck: 'criativo-a',
      utm_source: 'meta',
      utm_campaign: 'campanha-zedy',
      utm_medium: 'cpc',
      utm_content: 'anuncio-1',
    },
    commission: {
      totalPriceInCents: 9980,
      gatewayFeeInCents: 499,
      userCommissionInCents: 9481,
    },
    address: { city: 'São Paulo', state: 'SP' },
    isTest: false,
  }
}

function createSupabaseMock() {
  const state = { orders: [] as any[] }

  const makeBuilder = (table: string) => {
    const filters: Record<string, unknown> = {}
    let operation: 'select' | 'insert' | 'update' = 'select'
    let payload: any = null

    const builder: any = {
      select: () => builder,
      eq: (field: string, value: unknown) => {
        filters[field] = value
        return builder
      },
      insert: (value: any) => {
        operation = 'insert'
        payload = value
        return builder
      },
      update: (value: any) => {
        operation = 'update'
        payload = value
        return builder
      },
      single: () => {
        if (table === 'profiles') return Promise.resolve({ data: { user_id: USER_ID }, error: null })
        if (table === 'integrations') return Promise.resolve({ data: { config: null }, error: null })
        if (table === 'cost_settings') return Promise.resolve({ data: null, error: null })
        if (table === 'products') return Promise.resolve({ data: null, error: null })
        if (table === 'orders') {
          if (operation === 'update') {
            const found = state.orders.find((order) => order.user_id === filters.user_id && order.order_number === filters.order_number)
            if (!found) return Promise.resolve({ data: null, error: null })
            Object.assign(found, payload)
            return Promise.resolve({ data: found, error: null })
          }
          if (operation === 'insert') {
            const record = { id: crypto.randomUUID(), ...payload }
            state.orders.push(record)
            return Promise.resolve({ data: record, error: null })
          }
        }
        return Promise.resolve({ data: null, error: null })
      },
    }

    return builder
  }

  return {
    state,
    client: {
      from: (table: string) => makeBuilder(table),
    },
  }
}

Deno.test('normaliza status Zedy principais para eventos e status internos', () => {
  const cases = [
    ['waiting_payment', 'order.created', 'pending'],
    ['paid', 'order.paid', 'approved'],
    ['refused', 'order.updated', 'refused'],
    ['refunded', 'order.updated', 'refunded'],
  ] as const

  for (const [zedyStatus, expectedEvent, expectedStatus] of cases) {
    const normalized = normalizeZedyPayload(zedyPayload(zedyStatus))
    assertEquals(normalized.event, expectedEvent)
    assertEquals((normalized.data as any).payment_status, expectedStatus)
    assertEquals((normalized.data as any).gross_value, 99.8)
    assertEquals((normalized.data as any).gateway_fee, 4.99)
    assertEquals((normalized.data as any).utm_source, 'meta')
    assertEquals((normalized.data as any).utm_campaign, 'campanha-zedy')
    assertEquals((normalized.data as any).utm_content, 'anuncio-1')
    assertEquals((normalized.data as any).utm_term, 'criativo-a')
  }
})

Deno.test('webhook Zedy grava venda corretamente para waiting_payment, paid e refused', async () => {
  const cases = [
    ['waiting_payment', 'pending'],
    ['paid', 'approved'],
    ['refused', 'refused'],
  ] as const

  for (const [zedyStatus, expectedStatus] of cases) {
    const supabase = createSupabaseMock()
    const body = zedyPayload(zedyStatus)
    const response = await handleWebhookCheckout(new Request(`https://local.test?user_id=${USER_ID}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }), supabase.client)
    const json = await response.json()

    assertEquals(response.status, 200)
    assertEquals(json.success, true)
    assertExists(json.data.id)
    assertEquals(supabase.state.orders.length, 1)
    assertEquals(supabase.state.orders[0].order_number, body.orderId)
    assertEquals(supabase.state.orders[0].payment_status, expectedStatus)
    assertEquals(supabase.state.orders[0].gross_value, 99.8)
    assertEquals(supabase.state.orders[0].gateway_fee, 4.99)
    assertEquals(supabase.state.orders[0].utm_source, 'meta')
  }
})

Deno.test('webhook Zedy refunded atualiza venda existente para reembolsada', async () => {
  const supabase = createSupabaseMock()
  const paidPayload = zedyPayload('paid', 'Z-REFUND-LIFECYCLE')
  const refundedPayload = zedyPayload('refunded', 'Z-REFUND-LIFECYCLE')

  const paidResponse = await handleWebhookCheckout(new Request(`https://local.test?user_id=${USER_ID}`, {
    method: 'POST',
    body: JSON.stringify(paidPayload),
    headers: { 'content-type': 'application/json' },
  }), supabase.client)
  await paidResponse.text()

  const refundResponse = await handleWebhookCheckout(new Request(`https://local.test?user_id=${USER_ID}`, {
    method: 'POST',
    body: JSON.stringify(refundedPayload),
    headers: { 'content-type': 'application/json' },
  }), supabase.client)
  const json = await refundResponse.json()

  assertEquals(refundResponse.status, 200)
  assertEquals(json.success, true)
  assertEquals(supabase.state.orders.length, 1)
  assertEquals(supabase.state.orders[0].payment_status, 'refunded')
})