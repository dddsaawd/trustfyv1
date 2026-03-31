import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id, date_preset } = await req.json()
    const metaDatePreset = date_preset || 'today'

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get integration config with access token
    const { data: integration } = await supabase
      .from('integrations')
      .select('config')
      .eq('user_id', user_id)
      .eq('platform', 'meta')
      .single()

    if (!integration?.config) {
      return new Response(JSON.stringify({ error: 'Meta Ads não conectado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config = integration.config as any
    const accessToken = config.access_token
    const adAccounts = config.ad_accounts || []

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access token não encontrado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check token expiration
    if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
      await supabase
        .from('integrations')
        .update({ status: 'error' })
        .eq('user_id', user_id)
        .eq('platform', 'meta')

      return new Response(JSON.stringify({ error: 'Token expirado. Reconecte sua conta Meta Ads.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let totalSynced = 0
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get active ad accounts from DB to only sync those
    const { data: activeDbAccounts } = await supabase
      .from('ad_accounts')
      .select('id, account_id')
      .eq('user_id', user_id)
      .eq('active', true)

    const activeAccountIds = new Set((activeDbAccounts || []).map(a => a.account_id))

    // Filter to only sync active accounts
    const accountsToSync = adAccounts.filter((a: any) => activeAccountIds.has(a.id.replace('act_', '')))

    for (const account of accountsToSync) {
      const actId = account.id // format: act_XXXXX
      const accountNumericId = actId.replace('act_', '')

      const adAccountUuid = (activeDbAccounts || []).find(a => a.account_id === accountNumericId)?.id || null

      // Check account payment status from Meta API
      try {
        const statusRes = await fetch(
          `https://graph.facebook.com/v21.0/${actId}?fields=account_status,disable_reason,funding_source_details&access_token=${accessToken}`
        )
        const statusData = await statusRes.json()
        
        // account_status: 1=Active, 2=Disabled, 3=Unsettled, 7=Pending Risk Review, 8=Pending Settlement, 9=In Grace Period, 100=Pending Closure, 101=Closed, 201=Any Active, 202=Any Closed
        let paymentStatus = 'ok'
        let paymentDetail: string | null = null
        
        if (statusData.account_status === 2) {
          paymentStatus = 'disabled'
          paymentDetail = statusData.disable_reason ? `Conta desabilitada (razão: ${statusData.disable_reason})` : 'Conta desabilitada'
        } else if (statusData.account_status === 3) {
          paymentStatus = 'unsettled'
          paymentDetail = 'Pagamento pendente — verifique seu método de pagamento'
        } else if (statusData.account_status === 9) {
          paymentStatus = 'grace_period'
          paymentDetail = 'Período de carência — pagamento atrasado'
        } else if (statusData.account_status === 7) {
          paymentStatus = 'review'
          paymentDetail = 'Em análise de risco'
        } else if (statusData.account_status === 8) {
          paymentStatus = 'pending_settlement'
          paymentDetail = 'Pagamento em liquidação'
        }

        if (adAccountUuid) {
          await supabase
            .from('ad_accounts')
            .update({ payment_status: paymentStatus, payment_status_detail: paymentDetail, currency: account.currency || 'BRL' })
            .eq('id', adAccountUuid)
        }
      } catch (e) {
        console.error(`Error checking payment status for ${actId}:`, e)
      }

      // Fetch campaigns with insights using dynamic date preset
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v21.0/${actId}/campaigns?fields=id,name,status,daily_budget,insights.date_preset(${metaDatePreset}){spend,impressions,clicks,cpm,ctr,cpc,actions,action_values,cost_per_action_type}&limit=100&access_token=${accessToken}`
      )
      const campaignsData = await campaignsRes.json()

      if (campaignsData.error) {
        console.error(`Error fetching campaigns for ${actId}:`, campaignsData.error)
        continue
      }

      for (const campaign of (campaignsData.data || [])) {
        const insights = campaign.insights?.data?.[0] || {}
        const actions = insights.actions || []
        const actionValues = insights.action_values || []

        const conversions = actions.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 
                           actions.find((a: any) => a.action_type === 'purchase')?.value || 0
        const revenue = actionValues.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value ||
                       actionValues.find((a: any) => a.action_type === 'purchase')?.value || 0
        const initiateCheckout = parseInt(actions.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_initiate_checkout')?.value ||
                                actions.find((a: any) => a.action_type === 'initiate_checkout')?.value || '0')

        const costPerActions = insights.cost_per_action_type || []
        const costPerIc = parseFloat(costPerActions.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_initiate_checkout')?.value ||
                         costPerActions.find((a: any) => a.action_type === 'initiate_checkout')?.value || '0')

        const spend = parseFloat(insights.spend || '0')
        const impressions = parseInt(insights.impressions || '0')
        const clicks = parseInt(insights.clicks || '0')
        const cpm = parseFloat(insights.cpm || '0')
        const ctr = parseFloat(insights.ctr || '0')
        const cpc = parseFloat(insights.cpc || '0')
        const conv = parseInt(conversions)
        const rev = parseFloat(revenue)
        const roas = spend > 0 ? rev / spend : 0
        const cpa = conv > 0 ? spend / conv : 0
        const profit = rev - spend

        // Determine score
        let score: 'scale' | 'watch' | 'cut' = 'watch'
        if (roas >= 2) score = 'scale'
        else if (roas < 1 && spend > 50) score = 'cut'

        // Map Meta status to our enum
        let status: 'active' | 'paused' | 'ended' = 'paused'
        if (campaign.status === 'ACTIVE') status = 'active'
        else if (campaign.status === 'ARCHIVED' || campaign.status === 'DELETED') status = 'ended'

        // Upsert campaign with ad_account_id
        const { error } = await supabase
          .from('campaigns')
          .upsert({
            user_id: user_id,
            name: campaign.name,
            platform: 'meta',
            ad_account_id: adAccountUuid,
            status,
            budget_daily: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : 0,
            spend,
            impressions,
            clicks,
            cpm,
            ctr,
            cpc,
            cpa,
            conversions: conv,
            revenue: rev,
            profit,
            roas,
            score,
            initiate_checkout: initiateCheckout,
            cost_per_ic: costPerIc,
          }, { onConflict: 'user_id,name,platform,ad_account_id' })

        if (!error) totalSynced++
      }
    }

    // Update last_sync
    await supabase
      .from('integrations')
      .update({ last_sync: new Date().toISOString(), status: 'connected' })
      .eq('user_id', user_id)
      .eq('platform', 'meta')

    return new Response(JSON.stringify({ 
      success: true, 
      campaigns_synced: totalSynced,
      accounts_processed: accountsToSync.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Meta sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
