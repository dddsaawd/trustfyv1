import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FCMMessage {
  title: string
  body: string
  data?: Record<string, string>
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const unsignedToken = `${header}.${payload}`

  // Import the private key for signing
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  )

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const jwt = `${header.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${payload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${base64Signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`)
  }
  return tokenData.access_token
}

async function sendFCMv1(projectId: string, accessToken: string, deviceToken: string, message: FCMMessage) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title: message.title, body: message.body },
          data: message.data || {},
          webpush: {
            notification: {
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-72.png',
            },
          },
        },
      }),
    }
  )

  const result = await res.json()
  if (!res.ok) {
    console.error('FCM send error:', result)
    return { success: false, error: result }
  }
  return { success: true, data: result }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT secret not configured')
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    const { user_id, title, body, data } = await req.json()

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing user_id, title, or body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get active device tokens
    const { data: devices } = await supabase
      .from('user_devices')
      .select('device_token')
      .eq('user_id', user_id)
      .eq('active', true)

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No active devices' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getAccessToken(serviceAccount)
    const results = await Promise.allSettled(
      devices.map(d => sendFCMv1(serviceAccount.project_id, accessToken, d.device_token, { title, body, data }))
    )

    const sent = results.filter(r => r.status === 'fulfilled' && (r as any).value?.success).length

    // Save notification in DB
    await supabase.from('notifications').insert({
      user_id,
      title,
      message: body,
      type: data?.type || 'sale',
      data: data || {},
    })

    return new Response(JSON.stringify({ success: true, sent, total: devices.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
