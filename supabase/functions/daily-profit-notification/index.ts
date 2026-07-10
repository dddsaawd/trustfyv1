import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BRL_TO_USD = 0.185

function brazilTodayRange() {
  const now = new Date()
  const todayBR = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  return {
    date: todayBR,
    start: `${todayBR}T00:00:00-03:00`,
    end: `${todayBR}T23:59:59-03:00`,
  }
}

function computeProfit(orders: any[], cs: any, adSpend: number, installmentRates: Record<number, number>) {
  const approved = orders.filter(o => o.payment_status === 'approved')
  const refunded = orders.filter(o => o.payment_status === 'refunded')
  const chargebacks = orders.filter(o => o.payment_status === 'chargeback')

  const netRevenue =
    approved.reduce((s, o) => s + Number(o.gross_value || 0), 0) -
    refunded.reduce((s, o) => s + Number(o.gross_value || 0), 0) -
    chargebacks.reduce((s, o) => s + Number(o.gross_value || 0), 0)

  const productCost = approved.reduce((s, o) => s + Number(o.product_cost || 0), 0)

  const gatewayFee = approved.reduce((s, o) => {
    if (o.gateway_fee && o.gateway_fee > 0) return s + Number(o.gateway_fee)
    if (!cs) return s
    const method = o.payment_method || 'pix'
    const installments = o.installments || 1
    if (method === 'credit_card' && installments >= 2 && installmentRates[installments]) {
      return s + (Number(o.gross_value || 0) * installmentRates[installments] / 100)
    }
    if (method === 'credit_card') {
      const rate = cs.gateway_card_percent || cs.gateway_fee_percent || 0
      return s + (Number(o.gross_value || 0) * rate / 100) + Number(cs.gateway_fee_fixed || 0)
    }
    if (method === 'pix') {
      return s + (Number(o.gross_value || 0) * (cs.gateway_pix_percent || 0) / 100) + Number(cs.gateway_pix_fixed || 0)
    }
    if (method === 'boleto') return s + Number(cs.boleto_fee || 0)
    return s + (Number(o.gross_value || 0) * Number(cs.gateway_fee_percent || 0) / 100) + Number(cs.gateway_fee_fixed || 0)
  }, 0)

  const shipping = approved.reduce((s, o) =>
    s + (o.shipping_cost && o.shipping_cost > 0 ? Number(o.shipping_cost) : Number(cs?.avg_shipping || 0)), 0)

  const tax = approved.reduce((s, o) => {
    if (o.tax && o.tax > 0) return s + Number(o.tax)
    if (cs) return s + Number(o.gross_value || 0) * Number(cs.tax_percent || 0) / 100
    return s
  }, 0)

  return {
    netProfit: netRevenue - productCost - gatewayFee - shipping - tax - adSpend,
    netRevenue,
    approvedCount: approved.length,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { date, start, end } = brazilTodayRange()
    let period = 'agora'
    try {
      const body = await req.json().catch(() => ({}))
      if (body?.period) period = body.period
    } catch { /* noop */ }

    // Users with active push devices
    const { data: devices } = await supabase
      .from('user_devices')
      .select('user_id')
      .eq('active', true)

    const userIds = [...new Set((devices || []).map((d: any) => d.user_id))]
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [{ data: allOrders }, { data: allCosts }, { data: allRates }, { data: manualSpend }] = await Promise.all([
      supabase.from('orders').select('*').gte('created_at', start).lte('created_at', end),
      supabase.from('cost_settings').select('*'),
      supabase.from('installment_rates').select('user_id, installments, rate_percent'),
      supabase.from('manual_ad_spend').select('user_id, value').eq('date', date),
    ])

    const costByUser: Record<string, any> = {}
    for (const c of allCosts || []) costByUser[(c as any).user_id] = c
    const ratesByUser: Record<string, Record<number, number>> = {}
    for (const r of (allRates || []) as any[]) {
      ratesByUser[r.user_id] ??= {}
      ratesByUser[r.user_id][r.installments] = Number(r.rate_percent)
    }
    const manualByUser: Record<string, number> = {}
    for (const m of (manualSpend || []) as any[]) {
      manualByUser[m.user_id] = (manualByUser[m.user_id] || 0) + Number(m.value || 0)
    }

    let sent = 0
    for (const userId of userIds) {
      const ordersOfUser = (allOrders || []).filter((o: any) => o.user_id === userId)
      const adSpendBRL = manualByUser[userId] || 0
      const { netProfit, approvedCount } = computeProfit(
        ordersOfUser,
        costByUser[userId],
        adSpendBRL,
        ratesByUser[userId] || {},
      )
      const profitUSD = netProfit * BRL_TO_USD
      const symbol = profitUSD >= 0 ? '💰' : '⚠️'
      const value = `$${profitUSD.toFixed(2)}`
      const title = `${symbol} Lucro do dia (${period})`
      const body = `Até agora: ${value} · ${approvedCount} venda${approvedCount === 1 ? '' : 's'} aprovadas`

      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            user_id: userId,
            title,
            body,
            data: { type: 'daily_profit', period, profit_usd: profitUSD.toFixed(2) },
          }),
        })
        sent++
      } catch (e) {
        console.error('push failed for', userId, e)
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, total: userIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('daily-profit-notification error', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})