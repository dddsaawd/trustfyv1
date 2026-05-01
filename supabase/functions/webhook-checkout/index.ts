import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

interface WebhookOrder {
  order_number: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  product_name: string
  product_sku?: string
  product_price?: number
  product_cost?: number
  gross_value: number
  payment_method?: 'pix' | 'credit_card' | 'boleto' | 'debit'
  payment_status?: 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback'
  installments?: number
  gateway_fee?: number
  shipping_cost?: number
  tax?: number
  ads_cost_attributed?: number
  platform?: string
  campaign_name?: string
  utm_source?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  state?: string
  city?: string
  created_at?: string
}

interface WebhookProduct {
  name: string
  sku?: string
  price: number
  cost: number
  image_url?: string
  active?: boolean
}

interface WebhookPayload {
  event: 'order.created' | 'order.updated' | 'order.paid' | 'order.refunded' | 'product.created' | 'product.updated' | 'pix.generated' | 'pix.paid' | 'pix.expired'
  data: WebhookOrder | WebhookProduct | any
}

// Corvex payload format
interface CorvexPayload {
  id: string
  event: string
  amount: number
  status: string
  method: string
  client: {
    name: string
    email: string
    phone: string
    doc: string
  }
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    externalRef?: string
    orderBump?: boolean
    gift?: boolean
  }>
  timestamp: string
  address?: {
    city?: string
    state?: string
    number?: string
    street?: string
    zipcode?: string
    complement?: string | null
    neighborhood?: string
  }
  utm?: {
    fbc?: string
    fbp?: string
    ttp?: string
    page?: { url?: string; referrer?: string }
    term?: string
    medium?: string
    source?: string
    ttclid?: string
    content?: string
    campaign?: string
  }
  installments?: number
  paidAt?: string
}

// Zedy payload format
interface ZedyPayload {
  orderId: string
  platform?: string
  paymentMethod?: string
  status: string
  createdAt?: string
  approvedDate?: string | null
  refundedAt?: string | null
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  products?: Array<{
    id?: number | string
    name?: string
    planId?: number | string
    planName?: string
    quantity?: number
    priceInCents?: number
  }>
  trackingParameters?: {
    src?: string | null
    sck?: string | null
    utm_source?: string | null
    utm_campaign?: string | null
    utm_medium?: string | null
    utm_content?: string | null
    utm_term?: string | null
  }
  commission?: {
    totalPriceInCents?: number
    gatewayFeeInCents?: number
    userCommissionInCents?: number
  }
  address?: {
    city?: string
    state?: string
  }
  isTest?: boolean
}

// Anti-fraud: blocked name patterns
const BLOCKED_NAMES = [
  'teste', 'test', 'fulano', 'ciclano', 'beltrano', 'ninguem', 'ninguém',
  'não sei', 'nao sei', 'qualquer', 'aaa', 'bbb', 'ccc', 'xxx', 'zzz',
  'asdf', 'qwert', 'fake', 'fraude', 'lixo', 'merda', 'porra', 'caralho',
  'foda', 'fdp', 'pqp', 'cuzão', 'cuzao', 'arrombado', 'idiota', 'otario',
  'otário', 'babaca', 'imbecil', 'burro', 'trouxa', 'vagabundo', 'desgraça',
  'desgraca', 'maldito', 'clone', 'clona', 'concorrente', 'spam',
  'nobody', 'noone', 'john doe', 'jane doe', 'anonymous', 'anônimo', 'anonimo',
]

function isSuspiciousName(name: string): { suspicious: boolean; reason: string } {
  if (!name || name.trim().length < 3) {
    return { suspicious: true, reason: 'Nome muito curto ou vazio' }
  }

  const normalized = name.toLowerCase().trim()

  // Check exact matches and contains
  for (const blocked of BLOCKED_NAMES) {
    if (normalized === blocked || normalized.includes(blocked)) {
      return { suspicious: true, reason: `Nome bloqueado: "${name}" contém "${blocked}"` }
    }
  }

  // All same character (e.g. "aaaa", "bbbb")
  if (/^(.)\1{2,}$/.test(normalized.replace(/\s/g, ''))) {
    return { suspicious: true, reason: `Nome repetitivo: "${name}"` }
  }

  // Only consonants or only vowels (gibberish)
  const letters = normalized.replace(/[^a-záàâãéèêíïóôõúüç]/gi, '')
  if (letters.length >= 4) {
    const vowels = letters.replace(/[^aeiouáàâãéèêíïóôõúü]/gi, '')
    if (vowels.length === 0) {
      return { suspicious: true, reason: `Nome sem vogais (gibberish): "${name}"` }
    }
  }

  // Single word with less than 3 chars
  const words = normalized.split(/\s+/).filter(w => w.length > 0)
  if (words.length === 1 && words[0].length < 4) {
    return { suspicious: true, reason: `Nome suspeito (muito curto, sem sobrenome): "${name}"` }
  }

  return { suspicious: false, reason: '' }
}

function isCorvexPayload(payload: any): payload is CorvexPayload {
  return payload.event && typeof payload.event === 'string' && payload.event.startsWith('corvex.')
}

function isZedyPayload(payload: any): payload is ZedyPayload {
  return payload?.platform === 'ZedyCheckout' && typeof payload.orderId === 'string' && typeof payload.status === 'string'
}

function centsToBRL(value?: number | null): number | undefined {
  if (value == null || Number.isNaN(Number(value))) return undefined
  return Math.round((Number(value) / 100) * 100) / 100
}

function cleanText(value?: string | null): string | undefined {
  const text = value?.trim()
  return text ? text : undefined
}

function mapCorvexStatus(status: string): 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback' {
  const map: Record<string, 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback'> = {
    'approved': 'approved',
    'paid': 'approved',
    'completed': 'approved',
    'pending': 'pending',
    'waiting_payment': 'pending',
    'refused': 'refused',
    'declined': 'refused',
    'cancelled': 'refused',
    'refunded': 'refunded',
    'chargeback': 'chargeback',
  }
  return map[status] || 'pending'
}

function mapCorvexMethod(method: string): 'pix' | 'credit_card' | 'boleto' | 'debit' {
  const map: Record<string, 'pix' | 'credit_card' | 'boleto' | 'debit'> = {
    'pix': 'pix',
    'card': 'credit_card',
    'credit_card': 'credit_card',
    'credit': 'credit_card',
    'boleto': 'boleto',
    'debit': 'debit',
    'debit_card': 'debit',
  }
  return map[method] || 'pix'
}

function mapCorvexEvent(event: string): string {
  const map: Record<string, string> = {
    'corvex.order.created': 'order.created',
    'corvex.order.approved': 'order.paid',
    'corvex.order.paid': 'order.paid',
    'corvex.order.completed': 'order.paid',
    'corvex.order.refused': 'order.updated',
    'corvex.order.cancelled': 'order.updated',
    'corvex.order.refunded': 'order.refunded',
    'corvex.order.chargeback': 'order.updated',
    'corvex.pix.generated': 'pix.generated',
    'corvex.pix.paid': 'pix.paid',
    'corvex.pix.expired': 'pix.expired',
  }
  return map[event] || 'order.created'
}

function normalizeCorvexPayload(corvex: CorvexPayload): WebhookPayload {
  const normalizedEvent = mapCorvexEvent(corvex.event)
  const mainItem = corvex.items?.[0]
  const allProductNames = corvex.items?.map(i => i.name).join(', ') || 'Produto'
  const totalValue = corvex.amount || corvex.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0

  if (normalizedEvent.startsWith('pix.')) {
    return {
      event: normalizedEvent as WebhookPayload['event'],
      data: {
        order_id: corvex.id,
        order_number: corvex.id,
        customer_name: corvex.client?.name || 'Cliente',
        customer_phone: corvex.client?.phone || null,
        product_name: allProductNames,
        value: totalValue,
        campaign_name: corvex.utm?.campaign || null,
        utm_source: corvex.utm?.source || null,
      }
    }
  }

  // Calculate shipping: difference between amount paid and sum of item prices
  const itemsTotal = corvex.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0
  const paymentMethod = mapCorvexMethod(corvex.method)
  
  // For pix, amount usually equals items total (no interest)
  // For card, amount can be higher due to installment interest
  // Shipping is only the difference when it's a pix payment (no interest)
  // For card, we can't reliably separate shipping from interest, so use avg_shipping from settings
  let shippingCost: number | undefined = undefined
  if (paymentMethod === 'pix' && totalValue > itemsTotal) {
    shippingCost = Math.round((totalValue - itemsTotal) * 100) / 100
  }

  const order: WebhookOrder = {
    order_number: corvex.id,
    customer_name: corvex.client?.name || 'Cliente',
    customer_email: corvex.client?.email || undefined,
    customer_phone: corvex.client?.phone || undefined,
    product_name: allProductNames,
    product_sku: mainItem?.externalRef || undefined,
    gross_value: totalValue,
    payment_method: paymentMethod,
    payment_status: mapCorvexStatus(corvex.status),
    installments: corvex.installments || undefined,
    shipping_cost: shippingCost,
    platform: 'corvex',
    utm_source: corvex.utm?.source || undefined,
    utm_campaign: corvex.utm?.campaign || undefined,
    utm_content: corvex.utm?.content || undefined,
    utm_term: corvex.utm?.term || undefined,
    state: corvex.address?.state || undefined,
    city: corvex.address?.city || undefined,
    created_at: corvex.paidAt || corvex.timestamp,
  }

  return {
    event: normalizedEvent as WebhookPayload['event'],
    data: order,
  }
}

function mapZedyStatus(status: string): 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback' {
  const normalized = status.toLowerCase().trim()
  const map: Record<string, 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback'> = {
    approved: 'approved',
    paid: 'approved',
    completed: 'approved',
    settled: 'approved',
    authorized: 'approved',
    created: 'pending',
    pending: 'pending',
    waiting_payment: 'pending',
    waiting: 'pending',
    processing: 'pending',
    refused: 'refused',
    rejected: 'refused',
    declined: 'refused',
    canceled: 'refused',
    cancelled: 'refused',
    expired: 'refused',
    refunded: 'refunded',
    refund: 'refunded',
    chargeback: 'chargeback',
    dispute: 'chargeback',
  }
  return map[normalized] || 'pending'
}

function mapZedyMethod(method?: string): 'pix' | 'credit_card' | 'boleto' | 'debit' {
  const normalized = method?.toLowerCase().trim()
  const map: Record<string, 'pix' | 'credit_card' | 'boleto' | 'debit'> = {
    pix: 'pix',
    credit: 'credit_card',
    card: 'credit_card',
    cc: 'credit_card',
    credito: 'credit_card',
    credit_card: 'credit_card',
    cartao_credito: 'credit_card',
    cartão_credito: 'credit_card',
    boleto: 'boleto',
    bank_slip: 'boleto',
    debit: 'debit',
    debit_card: 'debit',
    debito: 'debit',
  }
  return normalized ? (map[normalized] || 'pix') : 'pix'
}

function normalizeZedyPayload(zedy: ZedyPayload): WebhookPayload {
  const products = zedy.products || []
  const mainProduct = products[0]
  const itemsTotalInCents = products.reduce((sum, product) => {
    return sum + (Number(product.priceInCents || 0) * Number(product.quantity || 1))
  }, 0)
  const productNames = products
    .map((product) => `${cleanText(product.name) || 'Produto'}${product.quantity && product.quantity > 1 ? ` (${product.quantity}x)` : ''}`)
    .join(', ') || 'Produto'
  const grossValue = centsToBRL(zedy.commission?.totalPriceInCents) ?? centsToBRL(itemsTotalInCents) ?? 0
  const productPrice = centsToBRL(mainProduct?.priceInCents)
  const gatewayFee = centsToBRL(zedy.commission?.gatewayFeeInCents)
  const userCommission = centsToBRL(zedy.commission?.userCommissionInCents)
  const calculatedCommissionFee = userCommission != null ? Math.max(grossValue - userCommission, 0) : undefined
  const paymentStatus = mapZedyStatus(zedy.status)
  const paymentMethod = mapZedyMethod(zedy.paymentMethod)
  const event: WebhookPayload['event'] = paymentStatus === 'approved'
      ? 'order.paid'
      : paymentStatus === 'pending'
        ? 'order.created'
        : 'order.updated'

  if (event.startsWith('pix.')) {
    return {
      event,
      data: {
        order_id: zedy.orderId,
        order_number: zedy.orderId,
        customer_name: cleanText(zedy.customer?.name) || 'Cliente',
        customer_phone: cleanText(zedy.customer?.phone) || null,
        product_name: productNames,
        value: grossValue,
        campaign_name: cleanText(zedy.trackingParameters?.utm_campaign) || cleanText(zedy.trackingParameters?.utm_medium) || null,
        utm_source: cleanText(zedy.trackingParameters?.utm_source) || cleanText(zedy.trackingParameters?.src) || null,
      },
    }
  }

  return {
    event,
    data: {
      order_number: zedy.orderId,
      customer_name: cleanText(zedy.customer?.name) || 'Cliente',
      customer_email: cleanText(zedy.customer?.email),
      customer_phone: cleanText(zedy.customer?.phone),
      product_name: productNames,
      product_sku: mainProduct?.id ? String(mainProduct.id) : undefined,
      product_price: productPrice,
      product_cost: productPrice ?? 0,
      gross_value: grossValue,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      gateway_fee: gatewayFee ?? calculatedCommissionFee,
      platform: 'zedy',
      campaign_name: cleanText(zedy.trackingParameters?.utm_campaign) || cleanText(zedy.trackingParameters?.utm_medium),
      utm_source: cleanText(zedy.trackingParameters?.utm_source) || cleanText(zedy.trackingParameters?.src),
      utm_campaign: cleanText(zedy.trackingParameters?.utm_campaign),
      utm_content: cleanText(zedy.trackingParameters?.utm_content),
      utm_term: cleanText(zedy.trackingParameters?.utm_term) || cleanText(zedy.trackingParameters?.sck),
      state: cleanText(zedy.address?.state),
      city: cleanText(zedy.address?.city),
      created_at: zedy.approvedDate || zedy.refundedAt || zedy.createdAt || undefined,
    },
  }
}

export { centsToBRL, cleanText, isZedyPayload, mapZedyMethod, mapZedyStatus, normalizeZedyPayload }

export const handleWebhookCheckout = async (req: Request, supabaseOverride?: any): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')
    const webhookSecret = req.headers.get('x-webhook-secret') || url.searchParams.get('secret')

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrlEnv = Deno.env.get('SUPABASE_URL')
    const supabaseKeyEnv = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    console.log('[webhook] env check', {
      hasUrl: !!supabaseUrlEnv,
      hasKey: !!supabaseKeyEnv,
      createClientType: typeof createClient,
    })
    const supabase = supabaseOverride || createClient(supabaseUrlEnv!, supabaseKeyEnv!)
    console.log('[webhook] supabase client', {
      type: typeof supabase,
      hasFrom: typeof supabase?.from,
    })

    // Verify user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify webhook secret if integration has one configured
    const { data: integration } = await supabase
      .from('integrations')
      .select('config')
      .eq('user_id', userId)
      .eq('platform', 'webhook')
      .single()

    if (integration?.config && (integration.config as any).secret) {
      if (webhookSecret !== (integration.config as any).secret) {
        return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fetch user's cost_settings for automatic cost calculation
    const { data: costSettings } = await supabase
      .from('cost_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    const rawPayload = await req.json()
    
    // Auto-detect checkout-specific payloads and normalize
    let payload: WebhookPayload
    const auditContext: Record<string, unknown> = {
      audit: 'webhook_checkout_received',
      user_id: userId,
      raw_payload: rawPayload,
    }

    if (isCorvexPayload(rawPayload)) {
      console.log('Corvex payload detected, normalizing...', rawPayload.event)
      payload = normalizeCorvexPayload(rawPayload)
    } else if (isZedyPayload(rawPayload)) {
      console.log('Zedy payload detected, normalizing...', rawPayload.orderId, rawPayload.status)
      payload = normalizeZedyPayload(rawPayload)
    } else {
      payload = rawPayload as WebhookPayload
    }
    console.log(JSON.stringify({
      ...auditContext,
      audit: 'webhook_checkout_normalized',
      source: isZedyPayload(rawPayload) ? 'zedy' : isCorvexPayload(rawPayload) ? 'corvex' : 'generic',
      normalized_payload: payload,
    }))
    
    const { event, data } = payload

    // Anti-fraud check for order events
    if (['order.created', 'order.paid', 'order.updated', 'pix.generated'].includes(event)) {
      const customerName = (data as any).customer_name || ''
      const fraudCheck = isSuspiciousName(customerName)
      if (fraudCheck.suspicious) {
        console.warn(`🚫 Pedido bloqueado por anti-fraude: ${fraudCheck.reason}`, { event, customerName })
        return new Response(JSON.stringify({ 
          success: false, 
          blocked: true, 
          reason: fraudCheck.reason 
        }), {
          status: 200, // Return 200 so webhook doesn't retry
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    let result: any = null

    switch (event) {
      case 'order.created':
      case 'order.paid':
      case 'order.updated': {
        const order = data as WebhookOrder
        const grossValue = order.gross_value || 0

        // Use webhook values if provided, otherwise calculate from cost_settings
        const productCost = order.product_cost ?? 0
        const installments = order.installments ?? 1
        const paymentMethod = order.payment_method || 'pix'
        
        // Calculate gateway fee based on payment method and installments
        let gatewayFee = order.gateway_fee ?? 0
        if (order.gateway_fee == null && costSettings) {
          if (paymentMethod === 'credit_card' && installments >= 2) {
            // Fetch installment rate
            const { data: instRate } = await supabase
              .from('installment_rates')
              .select('rate_percent')
              .eq('user_id', userId)
              .eq('installments', installments)
              .single()
            if (instRate) {
              gatewayFee = grossValue * Number(instRate.rate_percent) / 100
            } else {
              gatewayFee = (grossValue * (costSettings as any).gateway_card_percent / 100) + costSettings.gateway_fee_fixed
            }
          } else if (paymentMethod === 'credit_card') {
            gatewayFee = (grossValue * ((costSettings as any).gateway_card_percent || costSettings.gateway_fee_percent) / 100) + costSettings.gateway_fee_fixed
          } else if (paymentMethod === 'pix') {
            gatewayFee = (grossValue * ((costSettings as any).gateway_pix_percent || 0) / 100) + ((costSettings as any).gateway_pix_fixed || 0)
          } else if (paymentMethod === 'boleto') {
            gatewayFee = costSettings.boleto_fee || 0
          } else {
            gatewayFee = (grossValue * costSettings.gateway_fee_percent / 100) + costSettings.gateway_fee_fixed
          }
        }
        
        // Use explicit shipping from payload; if not provided, use avg_shipping from settings
        const shippingCost = order.shipping_cost != null ? order.shipping_cost : (costSettings?.avg_shipping ?? 0)
        const tax = order.tax ?? (costSettings
          ? grossValue * costSettings.tax_percent / 100
          : 0)
        const adsCost = order.ads_cost_attributed ?? 0

        const netProfit = grossValue - productCost - gatewayFee - adsCost - shippingCost - tax

        // Try to update existing order first to avoid duplicate sales when checkout retries the webhook
        const { data: updated } = await supabase
            .from('orders')
            .update({
              customer_name: order.customer_name,
              customer_email: order.customer_email || null,
              customer_phone: order.customer_phone || null,
              product_name: order.product_name,
              payment_status: order.payment_status || 'pending',
              payment_method: paymentMethod,
              installments: installments,
              gross_value: grossValue,
              product_cost: productCost,
              gateway_fee: gatewayFee,
              ads_cost_attributed: adsCost,
              shipping_cost: shippingCost,
              tax: tax,
              net_profit: netProfit,
              platform: order.platform || null,
              campaign_name: order.campaign_name || null,
              utm_source: order.utm_source || null,
              utm_campaign: order.utm_campaign || null,
              utm_content: order.utm_content || null,
              utm_term: order.utm_term || null,
              state: order.state || null,
              city: order.city || null,
            })
            .eq('order_number', order.order_number)
            .eq('user_id', userId)
            .select()
            .single()

        if (updated) {
          result = updated
          break
        }

        // Ensure product exists
        if (order.product_name) {
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', userId)
            .eq('name', order.product_name)
            .single()

          if (!existingProduct) {
            await supabase.from('products').insert({
              user_id: userId,
              name: order.product_name,
              sku: order.product_sku || null,
              price: order.product_price ?? order.gross_value,
              cost: order.product_cost || 0,
            })
          }
        }

        const orderRecord = {
            user_id: userId,
            order_number: order.order_number,
            customer_name: order.customer_name,
            customer_email: order.customer_email || null,
            customer_phone: order.customer_phone || null,
            product_name: order.product_name,
            gross_value: grossValue,
            product_cost: productCost,
            gateway_fee: gatewayFee,
            ads_cost_attributed: adsCost,
            shipping_cost: shippingCost,
            tax: tax,
            net_profit: netProfit,
            payment_status: order.payment_status || (event === 'order.paid' ? 'approved' : 'pending'),
            payment_method: paymentMethod,
            installments: installments,
            platform: order.platform || null,
            campaign_name: order.campaign_name || null,
            utm_source: order.utm_source || null,
            utm_campaign: order.utm_campaign || null,
            utm_content: order.utm_content || null,
            utm_term: order.utm_term || null,
            state: order.state || null,
            city: order.city || null,
            created_at: order.created_at || new Date().toISOString(),
          }

        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderRecord)
          .select()
          .single()

        if (orderError) throw orderError
        result = newOrder
        break
      }

      case 'order.refunded': {
        const order = data as WebhookOrder
        const { data: updated, error } = await supabase
          .from('orders')
          .update({ payment_status: 'refunded' })
          .eq('order_number', order.order_number)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        result = updated
        break
      }

      case 'product.created':
      case 'product.updated': {
        const product = data as WebhookProduct

        if (event === 'product.updated' && product.sku) {
          const { data: updated } = await supabase
            .from('products')
            .update({
              name: product.name,
              price: product.price,
              cost: product.cost,
              image_url: product.image_url || null,
              active: product.active ?? true,
            })
            .eq('sku', product.sku)
            .eq('user_id', userId)
            .select()
            .single()

          if (updated) {
            result = updated
            break
          }
        }

        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            user_id: userId,
            name: product.name,
            sku: product.sku || null,
            price: product.price,
            cost: product.cost,
            image_url: product.image_url || null,
            active: product.active ?? true,
          })
          .select()
          .single()

        if (error) throw error
        result = newProduct
        break
      }

      case 'pix.generated': {
        const pix = data as any
        const { data: newPix, error } = await supabase
          .from('pix_pending')
          .insert({
            user_id: userId,
            order_id: pix.order_id || pix.order_number,
            customer_name: pix.customer_name,
            customer_phone: pix.customer_phone || null,
            product_name: pix.product_name,
            value: pix.value,
            campaign_name: pix.campaign_name || null,
            utm_source: pix.utm_source || null,
            status: 'pending',
          })
          .select()
          .single()

        if (error) throw error
        result = newPix
        break
      }

      case 'pix.paid':
      case 'pix.expired': {
        const pix = data as any
        const newStatus = event === 'pix.paid' ? 'paid' : 'expired'
        const { data: updated, error } = await supabase
          .from('pix_pending')
          .update({ status: newStatus })
          .eq('order_id', pix.order_id || pix.order_number)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        result = updated
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown event: ${event}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Update integration last_sync
    await supabase
      .from('integrations')
      .update({ last_sync: new Date().toISOString(), status: 'connected' })
      .eq('user_id', userId)
      .eq('platform', 'webhook')

    // Send push notification for sales events
    if (['order.created', 'order.paid'].includes(event) && result) {
      const order = data as WebhookOrder
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            user_id: userId,
            title: '💰 Nova Venda!',
            body: `${order.customer_name} — R$ ${order.gross_value?.toFixed(2)} — ${order.product_name}`,
            data: { type: 'sale', order_id: result.id },
          }),
        })
        await pushResponse.text()
      } catch (e) {
        console.error('Push notification trigger failed:', e)
      }
    }

    console.log(JSON.stringify({
      audit: 'webhook_checkout_persisted',
      user_id: userId,
      event,
      source: isZedyPayload(rawPayload) ? 'zedy' : isCorvexPayload(rawPayload) ? 'corvex' : 'generic',
      external_order_id: (data as any)?.order_number || (data as any)?.order_id || null,
      created_sale_id: result?.id || null,
      persisted_table: ['pix.generated', 'pix.paid', 'pix.expired'].includes(event) ? 'pix_pending' : event.startsWith('product.') ? 'products' : 'orders',
      normalized_payload: payload,
    }))

    return new Response(JSON.stringify({ success: true, event, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

if (import.meta.main) {
  Deno.serve(handleWebhookCheckout)
}
