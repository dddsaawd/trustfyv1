import type { KPIData, HourlyData, Order, Campaign, PixPending, Notification, Integration, Product, UTMData, DailySnapshot } from '@/types/database';

export const kpiData: KPIData[] = [
  { label: 'Faturamento Bruto', value: 'R$ 24.832,90', change: 12.4, changeLabel: 'vs ontem', tooltip: 'Total de vendas brutas do período selecionado', prefix: 'R$' },
  { label: 'Faturamento Líquido', value: 'R$ 21.407,30', change: 8.7, changeLabel: 'vs ontem', tooltip: 'Vendas aprovadas menos reembolsos e chargebacks' },
  { label: 'Gastos com Ads', value: 'R$ 4.218,50', change: -3.2, changeLabel: 'vs ontem', tooltip: 'Total investido em anúncios pagos' },
  { label: 'Lucro Líquido', value: 'R$ 8.943,20', change: 18.6, changeLabel: 'vs ontem', tooltip: 'Receita líquida menos todos os custos: ads, produto, frete, taxas, impostos' },
  { label: 'ROAS', value: '5.07x', change: 15.3, changeLabel: 'vs ontem', tooltip: 'Return on Ad Spend — Faturamento ÷ Gasto com Ads' },
  { label: 'ROI Real', value: '212%', change: 22.1, changeLabel: 'vs ontem', tooltip: 'Return on Investment — Lucro Líquido ÷ Custo Total × 100' },
  { label: 'Margem Líquida', value: '41.8%', change: 4.2, changeLabel: 'vs ontem', tooltip: 'Lucro Líquido ÷ Faturamento Líquido × 100' },
  { label: 'Ticket Médio', value: 'R$ 187,40', change: -1.8, changeLabel: 'vs ontem', tooltip: 'Valor médio por venda aprovada' },
  { label: 'Vendas Aprovadas', value: '132', change: 9.1, changeLabel: 'vs ontem', tooltip: 'Quantidade de vendas com pagamento aprovado' },
  { label: 'Taxa Aprovação', value: '78.6%', change: 2.3, changeLabel: 'vs ontem', tooltip: 'Vendas aprovadas ÷ Total de tentativas de pagamento' },
];

export const warModeKPIs = [
  { label: 'Lucro Líquido', value: 'R$ 8.943,20', change: 18.6 },
  { label: 'Vendas', value: '132', change: 9.1 },
  { label: 'ROAS', value: '5.07x', change: 15.3 },
  { label: 'Pix Pendente', value: 'R$ 3.240,00', change: -12.4 },
];

export const hourlyData: HourlyData[] = [
  { hour: '00h', revenue: 420, profit: 180, adSpend: 120, roas: 3.5 },
  { hour: '01h', revenue: 280, profit: 110, adSpend: 90, roas: 3.1 },
  { hour: '02h', revenue: 150, profit: 60, adSpend: 60, roas: 2.5 },
  { hour: '03h', revenue: 90, profit: 30, adSpend: 40, roas: 2.25 },
  { hour: '04h', revenue: 120, profit: 45, adSpend: 35, roas: 3.4 },
  { hour: '05h', revenue: 310, profit: 130, adSpend: 80, roas: 3.9 },
  { hour: '06h', revenue: 580, profit: 250, adSpend: 150, roas: 3.87 },
  { hour: '07h', revenue: 890, profit: 390, adSpend: 210, roas: 4.24 },
  { hour: '08h', revenue: 1420, profit: 640, adSpend: 310, roas: 4.58 },
  { hour: '09h', revenue: 1780, profit: 820, adSpend: 380, roas: 4.68 },
  { hour: '10h', revenue: 2340, profit: 1080, adSpend: 420, roas: 5.57 },
  { hour: '11h', revenue: 2680, profit: 1240, adSpend: 450, roas: 5.96 },
  { hour: '12h', revenue: 2120, profit: 940, adSpend: 390, roas: 5.44 },
  { hour: '13h', revenue: 1890, profit: 830, adSpend: 370, roas: 5.11 },
  { hour: '14h', revenue: 2450, profit: 1130, adSpend: 410, roas: 5.98 },
  { hour: '15h', revenue: 2100, profit: 950, adSpend: 380, roas: 5.53 },
  { hour: '16h', revenue: 1760, profit: 780, adSpend: 340, roas: 5.18 },
  { hour: '17h', revenue: 1340, profit: 580, adSpend: 290, roas: 4.62 },
  { hour: '18h', revenue: 980, profit: 420, adSpend: 240, roas: 4.08 },
  { hour: '19h', revenue: 620, profit: 260, adSpend: 180, roas: 3.44 },
];

export const paymentMethodData = [
  { name: 'Pix', value: 62, fill: 'hsl(152, 69%, 45%)' },
  { name: 'Cartão', value: 31, fill: 'hsl(217, 91%, 60%)' },
  { name: 'Boleto', value: 7, fill: 'hsl(25, 95%, 53%)' },
];

export const platformSalesData = [
  { name: 'Meta Ads', sales: 78, revenue: 14620, color: 'hsl(217, 91%, 60%)' },
  { name: 'Google Ads', sales: 34, revenue: 6380, color: 'hsl(25, 95%, 53%)' },
  { name: 'TikTok Ads', sales: 15, revenue: 2810, color: 'hsl(280, 65%, 60%)' },
  { name: 'Orgânico', sales: 5, revenue: 1023, color: 'hsl(152, 69%, 45%)' },
];

export const topProducts: Product[] = [
  { id: '1', name: 'Kit Skincare Premium', sku: 'SKC-001', cost: 32.50, price: 197.90, active: true, created_at: '2024-01-15' },
  { id: '2', name: 'Fone Bluetooth Pro Max', sku: 'FBT-002', cost: 28.00, price: 149.90, active: true, created_at: '2024-02-01' },
  { id: '3', name: 'Luminária LED Inteligente', sku: 'LUM-003', cost: 18.90, price: 89.90, active: true, created_at: '2024-02-20' },
  { id: '4', name: 'Cinta Modeladora Shape', sku: 'CNT-004', cost: 15.00, price: 127.90, active: true, created_at: '2024-03-01' },
  { id: '5', name: 'Relógio Smart Fitness', sku: 'RSF-005', cost: 42.00, price: 247.90, active: true, created_at: '2024-03-10' },
];

export const topProductsMetrics = [
  { name: 'Kit Skincare Premium', revenue: 8302, units: 42, profit: 4180, margin: 50.3, roas: 6.2 },
  { name: 'Fone Bluetooth Pro Max', revenue: 5996, units: 40, profit: 2640, margin: 44.0, roas: 5.1 },
  { name: 'Relógio Smart Fitness', revenue: 4958, units: 20, profit: 2340, margin: 47.2, roas: 4.8 },
  { name: 'Cinta Modeladora Shape', revenue: 3837, units: 30, profit: 2100, margin: 54.7, roas: 7.3 },
  { name: 'Luminária LED Inteligente', revenue: 1798, units: 20, profit: 680, margin: 37.8, roas: 3.2 },
];

export const campaigns: Campaign[] = [
  { id: '1', ad_account_id: '1', platform: 'Meta', name: 'Skincare - Interesse Beleza - W18', status: 'active', budget_daily: 200, spend: 1280, impressions: 142000, clicks: 3820, cpm: 9.01, ctr: 2.69, cpc: 0.34, cpa: 18.29, conversions: 70, revenue: 8940, profit: 4520, roas: 6.98, score: 'scale' },
  { id: '2', ad_account_id: '1', platform: 'Meta', name: 'Fone BT - Lookalike 1% - W18', status: 'active', budget_daily: 150, spend: 890, impressions: 98000, clicks: 2450, cpm: 9.08, ctr: 2.50, cpc: 0.36, cpa: 22.25, conversions: 40, revenue: 5200, profit: 2180, roas: 5.84, score: 'scale' },
  { id: '3', ad_account_id: '2', platform: 'Google', name: 'Search - Fone Bluetooth Comprar', status: 'active', budget_daily: 120, spend: 720, impressions: 34000, clicks: 1200, cpm: 21.18, ctr: 3.53, cpc: 0.60, cpa: 26.67, conversions: 27, revenue: 3480, profit: 1340, roas: 4.83, score: 'watch' },
  { id: '4', ad_account_id: '1', platform: 'Meta', name: 'Cinta - Retargeting - W17', status: 'active', budget_daily: 80, spend: 540, impressions: 62000, clicks: 1580, cpm: 8.71, ctr: 2.55, cpc: 0.34, cpa: 36.00, conversions: 15, revenue: 1680, profit: 520, roas: 3.11, score: 'watch' },
  { id: '5', ad_account_id: '3', platform: 'TikTok', name: 'Skincare UGC Video #4', status: 'active', budget_daily: 100, spend: 620, impressions: 180000, clicks: 4200, cpm: 3.44, ctr: 2.33, cpc: 0.15, cpa: 41.33, conversions: 15, revenue: 2120, profit: 680, roas: 3.42, score: 'watch' },
  { id: '6', ad_account_id: '1', platform: 'Meta', name: 'Luminária - Broad - W18', status: 'active', budget_daily: 60, spend: 380, impressions: 45000, clicks: 980, cpm: 8.44, ctr: 2.18, cpc: 0.39, cpa: 76.00, conversions: 5, revenue: 450, profit: -120, roas: 1.18, score: 'cut' },
];

export const recentOrders: Order[] = [
  { id: '1', order_number: 'TF-28431', created_at: '2024-03-23T14:32:00', customer_name: 'Maria Silva', customer_phone: '11987654321', customer_email: 'maria@email.com', product_id: '1', product_name: 'Kit Skincare Premium', platform: 'Meta Ads', campaign_name: 'Skincare - Interesse Beleza - W18', utm_source: 'facebook', utm_campaign: 'skincare_w18', utm_content: 'video_ugc_03', utm_term: '', gross_value: 197.90, product_cost: 32.50, gateway_fee: 9.90, ads_cost_attributed: 18.29, shipping_cost: 12.00, tax: 9.90, net_profit: 115.31, payment_status: 'approved', payment_method: 'pix', state: 'SP', city: 'São Paulo' },
  { id: '2', order_number: 'TF-28432', created_at: '2024-03-23T14:28:00', customer_name: 'João Mendes', customer_phone: '21976543210', customer_email: 'joao@email.com', product_id: '2', product_name: 'Fone Bluetooth Pro Max', platform: 'Meta Ads', campaign_name: 'Fone BT - Lookalike 1% - W18', utm_source: 'facebook', utm_campaign: 'fone_lal1_w18', utm_content: 'carrossel_01', utm_term: '', gross_value: 149.90, product_cost: 28.00, gateway_fee: 7.50, ads_cost_attributed: 22.25, shipping_cost: 12.00, tax: 7.50, net_profit: 72.65, payment_status: 'approved', payment_method: 'credit_card', state: 'RJ', city: 'Rio de Janeiro' },
  { id: '3', order_number: 'TF-28433', created_at: '2024-03-23T14:15:00', customer_name: 'Ana Ferreira', customer_phone: '31965432109', customer_email: 'ana@email.com', product_id: '5', product_name: 'Relógio Smart Fitness', platform: 'Google Ads', campaign_name: 'Search - Relogio Smart', utm_source: 'google', utm_campaign: 'relogio_search', utm_content: '', utm_term: 'relogio smart fitness', gross_value: 247.90, product_cost: 42.00, gateway_fee: 12.40, ads_cost_attributed: 26.67, shipping_cost: 15.00, tax: 12.40, net_profit: 139.43, payment_status: 'approved', payment_method: 'pix', state: 'MG', city: 'Belo Horizonte' },
  { id: '4', order_number: 'TF-28434', created_at: '2024-03-23T14:05:00', customer_name: 'Carlos Souza', customer_phone: '41954321098', customer_email: 'carlos@email.com', product_id: '1', product_name: 'Kit Skincare Premium', platform: 'TikTok Ads', campaign_name: 'Skincare UGC Video #4', utm_source: 'tiktok', utm_campaign: 'skincare_ugc4', utm_content: 'video_ugc_04', utm_term: '', gross_value: 197.90, product_cost: 32.50, gateway_fee: 9.90, ads_cost_attributed: 41.33, shipping_cost: 12.00, tax: 9.90, net_profit: 92.27, payment_status: 'pending', payment_method: 'pix', state: 'PR', city: 'Curitiba' },
  { id: '5', order_number: 'TF-28435', created_at: '2024-03-23T13:52:00', customer_name: 'Luciana Oliveira', customer_phone: '85943210987', customer_email: 'luciana@email.com', product_id: '4', product_name: 'Cinta Modeladora Shape', platform: 'Meta Ads', campaign_name: 'Cinta - Retargeting - W17', utm_source: 'facebook', utm_campaign: 'cinta_rtg_w17', utm_content: 'depoimento_02', utm_term: '', gross_value: 127.90, product_cost: 15.00, gateway_fee: 6.40, ads_cost_attributed: 36.00, shipping_cost: 12.00, tax: 6.40, net_profit: 52.10, payment_status: 'approved', payment_method: 'credit_card', state: 'CE', city: 'Fortaleza' },
  { id: '6', order_number: 'TF-28436', created_at: '2024-03-23T13:40:00', customer_name: 'Pedro Santos', customer_phone: '71932109876', customer_email: 'pedro@email.com', product_id: '3', product_name: 'Luminária LED Inteligente', platform: 'Meta Ads', campaign_name: 'Luminária - Broad - W18', utm_source: 'facebook', utm_campaign: 'luminaria_broad_w18', utm_content: 'video_produto_01', utm_term: '', gross_value: 89.90, product_cost: 18.90, gateway_fee: 4.50, ads_cost_attributed: 76.00, shipping_cost: 12.00, tax: 4.50, net_profit: -26.00, payment_status: 'approved', payment_method: 'pix', state: 'BA', city: 'Salvador' },
];

export const pixPendingData: PixPending[] = [
  { id: '1', order_id: 'TF-28437', customer_name: 'Rafael Lima', customer_phone: '11998877665', product_name: 'Kit Skincare Premium', value: 197.90, generated_at: '2024-03-23T14:30:00', minutes_open: 8, campaign_name: 'Skincare - Interesse Beleza - W18', utm_source: 'facebook', status: 'pending' },
  { id: '2', order_id: 'TF-28438', customer_name: 'Fernanda Costa', customer_phone: '21987766554', product_name: 'Fone Bluetooth Pro Max', value: 149.90, generated_at: '2024-03-23T14:22:00', minutes_open: 16, campaign_name: 'Fone BT - Lookalike 1% - W18', utm_source: 'facebook', status: 'pending' },
  { id: '3', order_id: 'TF-28439', customer_name: 'Bruno Almeida', customer_phone: '31976655443', product_name: 'Relógio Smart Fitness', value: 247.90, generated_at: '2024-03-23T14:10:00', minutes_open: 28, campaign_name: 'Search - Relogio Smart', utm_source: 'google', status: 'pending' },
  { id: '4', order_id: 'TF-28440', customer_name: 'Patricia Rocha', customer_phone: '41965544332', product_name: 'Kit Skincare Premium', value: 197.90, generated_at: '2024-03-23T13:50:00', minutes_open: 48, campaign_name: 'Skincare UGC Video #4', utm_source: 'tiktok', status: 'pending' },
  { id: '5', order_id: 'TF-28441', customer_name: 'Diego Martins', customer_phone: '85954433221', product_name: 'Cinta Modeladora Shape', value: 127.90, generated_at: '2024-03-23T13:25:00', minutes_open: 73, campaign_name: 'Cinta - Retargeting - W17', utm_source: 'facebook', status: 'pending' },
  { id: '6', order_id: 'TF-28442', customer_name: 'Camila Nunes', customer_phone: '71943322110', product_name: 'Fone Bluetooth Pro Max', value: 149.90, generated_at: '2024-03-23T12:45:00', minutes_open: 113, campaign_name: 'Fone BT - Lookalike 1% - W18', utm_source: 'facebook', status: 'pending' },
  { id: '7', order_id: 'TF-28443', customer_name: 'Thiago Barbosa', customer_phone: '51932211009', product_name: 'Kit Skincare Premium', value: 197.90, generated_at: '2024-03-23T12:20:00', minutes_open: 138, campaign_name: 'Skincare - Interesse Beleza - W18', utm_source: 'facebook', status: 'pending' },
  { id: '8', order_id: 'TF-28444', customer_name: 'Juliana Pereira', customer_phone: '61921100998', product_name: 'Relógio Smart Fitness', value: 247.90, generated_at: '2024-03-23T11:50:00', minutes_open: 168, campaign_name: 'Search - Relogio Smart', utm_source: 'google', status: 'pending' },
];

export const notifications: Notification[] = [
  { id: '1', type: 'sale', title: 'Nova venda aprovada', message: 'Kit Skincare Premium — R$ 197,90 | Lucro: R$ 115,31', read: false, created_at: '2024-03-23T14:32:00' },
  { id: '2', type: 'pix_paid', title: 'Pix confirmado', message: 'Relógio Smart Fitness — R$ 247,90 por Ana Ferreira', read: false, created_at: '2024-03-23T14:15:00' },
  { id: '3', type: 'goal_reached', title: 'Meta atingida!', message: 'Lucro do dia ultrapassou R$ 8.000. Atual: R$ 8.943,20', read: false, created_at: '2024-03-23T14:00:00' },
  { id: '4', type: 'roas_drop', title: 'Alerta de ROAS', message: 'Campanha "Luminária - Broad - W18" caiu para ROAS 1.18x', read: true, created_at: '2024-03-23T13:30:00' },
  { id: '5', type: 'daily_summary', title: 'Resumo parcial do dia', message: 'Faturamento: R$ 24.832,90 | Lucro: R$ 8.943,20 | 132 vendas', read: true, created_at: '2024-03-23T12:00:00' },
  { id: '6', type: 'negative_campaign', title: 'Campanha negativa', message: '"Luminária - Broad - W18" com prejuízo de R$ 120,00. Considere pausar.', read: true, created_at: '2024-03-23T11:00:00' },
];

export const integrations: Integration[] = [
  { id: '1', name: 'Meta Ads', platform: 'meta', icon: 'Facebook', status: 'connected', description: 'Importa campanhas, conjuntos e anúncios do Facebook/Instagram Ads', last_sync: '2024-03-23T14:30:00' },
  { id: '2', name: 'Google Ads', platform: 'google', icon: 'Search', status: 'connected', description: 'Importa campanhas do Google Ads incluindo Search, Display e YouTube', last_sync: '2024-03-23T14:25:00' },
  { id: '3', name: 'TikTok Ads', platform: 'tiktok', icon: 'Music', status: 'connected', description: 'Importa campanhas e métricas do TikTok Ads Manager', last_sync: '2024-03-23T14:20:00' },
  { id: '4', name: 'Kwai Ads', platform: 'kwai', icon: 'Video', status: 'disconnected', description: 'Importa dados de campanhas do Kwai for Business' },
  { id: '5', name: 'Shopify', platform: 'shopify', icon: 'ShoppingBag', status: 'disconnected', description: 'Sincroniza pedidos e produtos da sua loja Shopify' },
  { id: '6', name: 'Webhook de Vendas', platform: 'webhook', icon: 'Webhook', status: 'connected', description: 'Recebe notificações de vendas em tempo real via webhook', last_sync: '2024-03-23T14:32:00' },
  { id: '7', name: 'Gateway de Pagamento', platform: 'gateway', icon: 'CreditCard', status: 'connected', description: 'Integração com gateway para status de pagamentos e pix', last_sync: '2024-03-23T14:32:00' },
  { id: '8', name: 'Importação CSV', platform: 'csv', icon: 'FileSpreadsheet', status: 'disconnected', description: 'Importa dados de vendas, custos e campanhas via planilha CSV' },
];

export const utmData: UTMData[] = [
  { source: 'facebook', campaign: 'skincare_w18', content: 'video_ugc_03', term: '', visits: 4820, checkouts: 412, sales: 70, revenue: 8940, profit: 4520, roas: 6.98 },
  { source: 'facebook', campaign: 'fone_lal1_w18', content: 'carrossel_01', term: '', visits: 3100, checkouts: 280, sales: 40, revenue: 5200, profit: 2180, roas: 5.84 },
  { source: 'google', campaign: 'relogio_search', content: '', term: 'relogio smart fitness', visits: 1520, checkouts: 190, sales: 27, revenue: 3480, profit: 1340, roas: 4.83 },
  { source: 'facebook', campaign: 'cinta_rtg_w17', content: 'depoimento_02', term: '', visits: 1980, checkouts: 145, sales: 15, revenue: 1680, profit: 520, roas: 3.11 },
  { source: 'tiktok', campaign: 'skincare_ugc4', content: 'video_ugc_04', term: '', visits: 5400, checkouts: 310, sales: 15, revenue: 2120, profit: 680, roas: 3.42 },
  { source: 'facebook', campaign: 'luminaria_broad_w18', content: 'video_produto_01', term: '', visits: 1240, checkouts: 82, sales: 5, revenue: 450, profit: -120, roas: 1.18 },
];

export const dailyProjection = {
  projectedRevenue: 'R$ 32.440',
  projectedProfit: 'R$ 11.680',
  projectedSales: 172,
  confidence: 82,
  basedOn: 'velocidade atual de vendas e histórico',
};

export const funnelData = [
  { stage: 'Visitas', value: 18060, percentage: 100 },
  { stage: 'Checkout Iniciado', value: 1419, percentage: 7.9 },
  { stage: 'Pix Gerado', value: 892, percentage: 4.9 },
  { stage: 'Pix Pago', value: 548, percentage: 3.0 },
  { stage: 'Cartão Aprovado', value: 420, percentage: 2.3 },
];

export const recoveryData = {
  sent: 248,
  recovered: 42,
  value_recovered: 6840,
  rate: 16.9,
  best_window: '5-15 min',
  channels: [
    { name: 'WhatsApp', sent: 180, converted: 32, rate: 17.8, value: 5120 },
    { name: 'Push', sent: 48, converted: 7, rate: 14.6, value: 1180 },
    { name: 'E-mail', sent: 20, converted: 3, rate: 15.0, value: 540 },
  ],
};

export const financialSummary: DailySnapshot = {
  date: '2024-03-23',
  gross_revenue: 24832.90,
  net_revenue: 21407.30,
  ad_spend: 4218.50,
  product_cost: 3840.00,
  shipping_cost: 1584.00,
  gateway_fees: 1241.65,
  taxes: 1070.15,
  other_expenses: 530.00,
  net_profit: 8943.20,
  margin: 41.8,
  orders_approved: 132,
  orders_pending: 36,
  orders_refused: 12,
  avg_ticket: 187.40,
  roas: 5.07,
  roi: 212,
  approval_rate: 78.6,
  pix_generated: 892,
  pix_paid: 548,
  pix_conversion: 61.4,
};
