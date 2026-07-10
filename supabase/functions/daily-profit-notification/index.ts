import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BRL_TO_USD = 0.185

const MESSAGE_VARIATIONS: { title: string; tagline: string }[] = [
  { title: '💰 Lucro ao vivo', tagline: 'Não acaba até você vencer. Esse número ainda vai virar rotina.' },
  { title: '👑 Placar do líder', tagline: 'Enquanto a maioria dorme, você constrói a vida que prometeu.' },
  { title: '🔥 O jogo não acabou', tagline: 'Só termina quando você olhar pra M3 na garagem e falar: "eu sabia".' },
  { title: '🧠 Mente blindada', tagline: 'Lucro pequeno hoje, império amanhã. Continua executando.' },
  { title: '🚀 Você está no comando', tagline: 'Não é motivação. É prova viva de que a máquina responde.' },
  { title: '💸 Mais um passo pra M3', tagline: 'Cada dólar no painel encurta a distância da vida que você quer.' },
  { title: '⚔️ Mentalidade de guerra', tagline: 'O dia só acaba quando você sair mais forte do que começou.' },
  { title: '🏆 Lucro de campeão', tagline: 'Você não nasceu pra sobreviver no jogo. Nasceu pra dominar.' },
  { title: '🦅 Visão de império', tagline: 'A tela mostrou lucro. Agora sua obrigação é multiplicar.' },
  { title: '🔥 A máquina respondeu', tagline: 'Cabeça fria. Mão firme. O próximo nível não vai se conquistar sozinho.' },
  { title: '💰 Dinheiro em movimento', tagline: 'Você vai vencer porque não depende de sorte. Depende de execução.' },
  { title: '👊 Pressão boa', tagline: 'Lembra do motivo. A M3 não vem pra quem para no primeiro sinal.' },
  { title: '🖨️ Lucro imprimindo', tagline: 'Hoje é só o começo. Um dia isso aqui vai parecer pequeno.' },
  { title: '🧱 Construindo o inevitável', tagline: 'Cada lucro confirmado é um tijolo a mais no império.' },
  { title: '🚨 Alerta de vitória parcial', tagline: 'Não comemora demais. Usa isso como combustível e continua esmagando.' },
  { title: '🌍 Placar de bilionário começou', tagline: 'Isso aqui ainda é pequeno, mas é o primeiro eco da vida absurda que você vai construir.' },
  { title: '👑 Jogando acima da realidade', tagline: 'Você não está atrás de conforto. Você está atrás de um nível que hoje parece mentira.' },
  { title: '🚀 Rota dos 9 dígitos', tagline: 'Cada lucro confirmado é um passo saindo do comum e entrando no inimaginável.' },
  { title: '🏦 Mentalidade de império global', tagline: 'Não é sobre pagar boleto. É sobre construir algo tão grande que ninguém consiga ignorar.' },
  { title: '💎 Código dos gigantes', tagline: 'Enquanto eles pensam em sobreviver, você pensa em criar uma máquina que imprime liberdade.' },
  { title: '🛩️ Vida de outro planeta carregando', tagline: 'Jato, cobertura, garagem absurda, conta cheia. Tudo começa com lucro aparecendo no painel.' },
  { title: '🦅 Escala de magnata', tagline: 'Você não está montando uma operação. Está montando o começo de uma fortuna.' },
  { title: '🔥 O impossível ficou mais perto', tagline: 'Hoje é um lucro. Amanhã é uma estrutura. Depois é um império que parecia inalcançável.' },
  { title: '🌐 Dono do próprio mundo', tagline: 'Esse número é só o lembrete: você não nasceu pra jogar pequeno.' },
  { title: '⚜️ Fortuna em construção', tagline: 'Cada dólar no painel é uma peça da vida bilionária que sua mente ainda está aprendendo a aceitar.' },
]

function pickVariation(userId: string, date: string, period: string) {
  // Deterministic rotation per user+date+period so the same push isn't recomputed differently on retry,
  // but each shot (14h/20h) and each day picks a different message.
  const seed = `${userId}|${date}|${period}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return MESSAGE_VARIATIONS[hash % MESSAGE_VARIATIONS.length]
}

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
      const value = `$${profitUSD.toFixed(2)}`
      const variation = pickVariation(userId, date, period)
      const title = variation.title
      const body = `Até agora: ${value} · ${approvedCount} venda${approvedCount === 1 ? '' : 's'} aprovada${approvedCount === 1 ? '' : 's'}\n${variation.tagline}`

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