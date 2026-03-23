
# TRUSTFY — Dashboard SaaS Premium de Operação

## Fase 1: Fundação Visual + Todas as Páginas com Dados Mock

### 1. Design System Dark Premium
- Paleta escura sofisticada: fundo azul-marinho profundo (#0A0E1A), superfícies elevadas (#111827, #1A1F2E), texto branco suave, cinza elegante, verde premium para positivo, vermelho controlado para negativo, azul elétrico para ações
- Tipografia moderna (Inter), cantos arredondados grandes, sombras suaves, hover refinado
- Componentes: cards KPI com micro-indicadores ↑↓, skeleton loaders, tooltips, toasts, estados vazios elegantes

### 2. Layout Principal
- **Sidebar fixa** à esquerda com ícones premium (Lucide): Resumo, Vendas, Tráfego, Produtos, UTMs, Financeiro, Pix Pendentes, Recuperação, Relatórios, Notificações, Integrações, Configurações
- **Header superior**: título da página, seletores (período, conta de anúncio, plataforma, produto), botão atualizar, sino de notificações, avatar
- Responsivo: sidebar colapsável em mobile, cards empilhados

### 3. Página Resumo (Home)
- Grid de 8-10 KPI cards: Faturamento Bruto, Líquido, Gastos Ads, Lucro Líquido, ROAS, ROI, Margem, Ticket Médio, Vendas Aprovadas, Taxa Aprovação
- Cada card com valor, comparação período anterior, indicador visual
- Gráficos: faturamento/hora (linha), lucro/hora, ROAS tendência, pizza pagamentos, barras por plataforma
- Tabelas: produtos mais lucrativos, campanhas com maior lucro
- **Botão "Modo Guerra"**: visão minimalista com apenas lucro, vendas, ROAS, pix pendente em números gigantes

### 4. Página Vendas
- Funil visual: visitas → checkout → pix gerado → pix pago → cartão aprovado
- Tabela detalhada de pedidos com todas as colunas (ID, cliente, produto, plataforma, UTM, valor, custos, lucro líquido, status, método)
- Filtros avançados, vendas por produto/método/plataforma

### 5. Página Tráfego
- Performance por plataforma (Meta, Google, TikTok, Kwai)
- Drill-down: conta → campanha → conjunto → anúncio
- Métricas: investimento, impressões, CPM, CTR, CPC, CPA, vendas, receita, lucro, ROAS
- **Score de campanhas** com badges: 🔥 Escalar / ⚠️ Observar / ❌ Cortar

### 6. Página Produtos
- Ranking de produtos por lucro, ROI, margem
- Métricas: receita, unidades, ticket médio, custo, margem, lucro, taxa aprovação, taxa reembolso
- Gráfico de evolução, alerta de queda de performance

### 7. Página UTMs e Atribuição
- Tabelas por utm_source, utm_campaign, utm_content, utm_term
- Métricas: visitas, checkouts, vendas, faturamento, lucro, ROAS

### 8. Página Financeiro
- KPIs completos: receita bruta/líquida, ads, custo produto, frete, taxas, impostos, despesas, lucro líquido, margem
- Resumo diário/semanal/mensal com comparativos
- **Previsão do dia** baseada em velocidade atual de vendas
- Fórmulas de lucro líquido real implementadas

### 9. Página Pix Pendentes
- KPIs: quantidade, valor total pendente, tempo médio, taxa conversão, abandonados
- Ranking por campanha e produto
- Tabela detalhada com cliente, telefone, valor, produto, hora, tempo aberto, UTM, status
- Alertas de pix parado

### 10. Página Recuperação
- Métricas: recuperações enviadas, vendas recuperadas, valor, taxa, melhor janela
- Fluxos: WhatsApp, push, e-mail

### 11. Página Notificações
- Centro de notificações com tipos: venda, pix, meta atingida, alerta ROAS, chargeback
- Estrutura preparada para push notifications (PWA/Firebase)

### 12. Página Relatórios
- Tipos: diário, semanal, mensal, personalizado
- Visualização com opção de exportação (PDF, CSV, Excel — estrutura preparada)

### 13. Página Integrações
- Cards de integração: Meta Ads, Google Ads, TikTok, Kwai, Shopify, gateways, webhooks, CSV
- Status conectado/desconectado, botão configurar

### 14. Página Configurações
- Cadastro de produtos e custos, taxas, metas diárias
- Config de notificações push, alertas, aparência

### 15. Modo Escala (Visão Executiva)
- Tela simplificada mobile-first: lucro hoje, faturamento, vendas, top campanha, top produto

### 16. Alertas Inteligentes
- Sistema de detecção: queda ROAS, aumento CPA, campanha sem conversão, produto com queda de margem
- Exibição no painel + preparado para push

### Dados Mock
- Dados realistas em BRL com produtos de dropshipping, campanhas Meta/Google, valores coerentes de lucro/custo

### Estrutura para Supabase (preparada)
- Tipos TypeScript para todas as tabelas: users, products, platforms, ad_accounts, campaigns, adsets, ads, utm_events, sessions, checkouts, orders, payments, pix_pending, recoveries, expenses, tax_rules, notifications, notification_preferences, integrations, daily_snapshots, user_devices, user_roles
- Hooks e serviços preparados para substituir mock por queries reais
