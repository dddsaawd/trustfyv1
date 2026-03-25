import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  product_cost?: number
  gross_value: number
  payment_method?: 'pix' | 'credit_card' | 'boleto' | 'debit'
  payment_status?: 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback'
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

Deno.serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    const payload: WebhookPayload = await req.json()
    const { event, data } = payload

    let result: any = null

    switch (event) {
      case 'order.created':
      case 'order.paid':
      case 'order.updated': {
        const order = data as WebhookOrder
        const grossValue = order.gross_value || 0

        // Use webhook values if provided, otherwise calculate from cost_settings
        const productCost = order.product_cost ?? 0
        const gatewayFee = order.gateway_fee ?? (costSettings
          ? (grossValue * costSettings.gateway_fee_percent / 100) + costSettings.gateway_fee_fixed
          : 0)
        const shippingCost = order.shipping_cost ?? (costSettings?.avg_shipping ?? 0)
        const tax = order.tax ?? (costSettings
          ? grossValue * costSettings.tax_percent / 100
          : 0)
        const adsCost = order.ads_cost_attributed ?? 0

        const netProfit = grossValue - productCost - gatewayFee - adsCost - shippingCost - tax

        if (event === 'order.updated') {
          // Try to update existing order
          const { data: updated, error } = await supabase
            .from('orders')
            .update({
              payment_status: order.payment_status || 'pending',
              payment_method: order.payment_method || 'pix',
              gross_value: grossValue,
              product_cost: productCost,
              gateway_fee: gatewayFee,
              ads_cost_attributed: adsCost,
              shipping_cost: shippingCost,
              tax: tax,
              net_profit: netProfit,
            })
            .eq('order_number', order.order_number)
            .eq('user_id', userId)
            .select()
            .single()

          if (updated) {
            result = updated
            break
          }
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
              price: order.gross_value,
              cost: order.product_cost || 0,
            })
          }
        }

        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
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
            payment_method: order.payment_method || 'pix',
            platform: order.platform || null,
            campaign_name: order.campaign_name || null,
            utm_source: order.utm_source || null,
            utm_campaign: order.utm_campaign || null,
            utm_content: order.utm_content || null,
            utm_term: order.utm_term || null,
            state: order.state || null,
            city: order.city || null,
          })
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

    return new Response(JSON.stringify({ success: true, event, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
