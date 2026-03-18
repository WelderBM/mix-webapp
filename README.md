[PT-BR] · [EN](#english-version)

<div align="center">

# Mix Webapp

> Plataforma de e-commerce Full Stack com engine de customização de produtos, painel administrativo e integração Firebase — desenvolvida para um negócio real de presentes e decoração.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-d4a853)
![Versão](https://img.shields.io/badge/versão-0.1.0-1be4c8)
![Licença](https://img.shields.io/badge/licença-privado-d4a853)
![Tipo](https://img.shields.io/badge/tipo-freelance-1be4c8)

<br/>

</div>

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Tecnologias](#tecnologias)
- [Como Rodar](#como-rodar)
- [Status](#status)
- [Aprendizados](#aprendizados)
- [Contato](#contato)

---

## Sobre o Projeto

O **Mix Webapp** é uma plataforma de e-commerce Full Stack de alta performance, desenvolvida para transformar a experiência de compra de artigos para presentes e decoração. Diferente de lojas convencionais, o projeto foca na **venda consultiva e personalizada**: o cliente configura produtos complexos através de interfaces interativas e finaliza o pedido diretamente via WhatsApp com o vendedor.

[![vídeo do projeto](./assets/images/page.png)](./mixwebapp.mp4)

O projeto nasceu de uma necessidade real de negócio — a loja precisava de uma solução digital que respeitasse seu modelo de venda consultiva, ao invés de forçar o cliente a um checkout genérico.

> Do `KitBuilder` ao painel admin, cada feature foi construída para resolver um problema real do negócio.

### Funcionalidades

- [x] **Engine de Customização** — `KitBuilder` e `LacoBuilder` para montagem interativa de produtos
- [x] **Painel Administrativo** — gestão de pedidos, inventário e configurações da loja
- [x] **Controle de Loja** — status (Aberta/Fechada) e banners promocionais via Firestore
- [x] **Inventário Dinâmico** — gerenciamento de produtos, incluindo seção Natura
- [x] **SEO com JSON-LD** — dados estruturados para indexação pelo Google
- [x] **PWA Ready** — instalável como app nativo em dispositivos móveis
- [x] Integração Firebase completa (Auth, Firestore, Storage)
- [ ] Pagamento direto (Stripe / Pix)
- [ ] Dashboard de analytics de vendas
- [ ] Notificações Push para status de pedidos

---

## Arquitetura do Sistema

### 1. Engine de Customização (The Builders)

O maior desafio técnico: criar fluxos de montagem de produtos como `KitBuilder` e `LacoBuilder`.

**Decisão:** **Zustand** para gerenciamento de estado global dos builders, permitindo atualização de preços e lista de componentes em tempo real sem re-renders desnecessários.

**Impacto:** Redução na taxa de abandono de carrinho — o cliente visualiza o produto montado antes de confirmar o pedido.

### 2. Painel Administrativo (Backoffice)

Área restrita para gestão total da operação:

- Listagem e atualização de status de pedidos recebidos
- Gerenciamento de inventário com seção dedicada para itens Natura
- Controle de status da loja e banners via Firebase Firestore

### 3. SEO & Visibilidade

- **JSON-LD** para dados estruturados — o Google entende a organização e os produtos
- **PWA** configurado para instalação como app nativo, criando recorrência de acessos

---

## Tecnologias

| Tecnologia                                                                                         | Finalidade                                    |
| :------------------------------------------------------------------------------------------------- | :-------------------------------------------- |
| ![Next.js](https://img.shields.io/badge/Next.js_16-03080f?style=flat-square&logo=nextdotjs&)       | Framework com App Router para SSR e Streaming |
| ![TypeScript](https://img.shields.io/badge/TypeScript-03080f?style=flat-square&logo=typescript&)   | Tipagem estática para contratos de pedido     |
| ![Firebase](https://img.shields.io/badge/Firebase-03080f?style=flat-square&logo=firebase&)         | Auth, Firestore e Storage de imagens          |
| ![Zustand](https://img.shields.io/badge/Zustand-03080f?style=flat-square&)                         | Estado global dos builders                    |
| ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-03080f?style=flat-square&logo=tailwindcss&)  | Estilização mobile-first                      |
| ![Shadcn](https://img.shields.io/badge/shadcn%2Fui-03080f?style=flat-square&)                      | Componentes acessíveis e consistentes         |
| ![Vitest](https://img.shields.io/badge/Vitest-03080f?style=flat-square&logo=vite&)                 | Testes unitários de lógica de negócio         |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-03080f?style=flat-square&logo=framer&) | Animações de interface                        |

---

## Como Rodar

### Pré-requisitos

```bash
node >= 18.0.0
npm  >= 9.0.0
# Conta no Firebase com projeto configurado
```

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/WelderBM/mix-webapp.git

# 2. Acesse a pasta
cd mix-webapp

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de ambiente

```bash
# Crie um arquivo .env.local na raiz do projeto
cp .env.example .env.local
```

```env
# .env.local — preencha com suas credenciais do Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

> Consulte `FIREBASE_SETUP.md` para o guia completo de configuração do Firebase.

---

## Status

```
🟡 Em desenvolvimento
```

**Versão atual:** 0.1.0

### Roadmap

- [ ] Implementação de Pagamento Direto (Stripe / Pix)
- [ ] Dashboard de análise de vendas com gráficos
- [ ] Notificações Push para atualização de status de pedidos

---

## Aprendizados

### Contexto

> Projeto freelance Full Stack de alta complexidade para um negócio real de presentes e decoração, com modelo de venda consultiva via WhatsApp.

### O que aprendi

- Arquitetura **Next.js 15+ App Router** com Server Components, Streaming e React Server Actions
- Gerenciamento de estado complexo com **Zustand**: builders com precificação reativa em tempo real
- Design de sistema de componentes com **shadcn/ui** sobre Radix primitivos
- Testes unitários com **Vitest** para lógica crítica de negócio (calculadoras de preço, regras de carrinho)
- SEO técnico avançado: **JSON-LD**, metadata dinâmica, Open Graph via Next.js
- Gestão de projeto Full Stack: da modelagem de dados no Firestore à entrega de UI

### O que faria diferente

- Implementaria **Server Actions** para mutações desde o início, reduzindo o tamanho do bundle client-side
- Adotaria **React Query (TanStack Query)** em vez de `useEffect` para fetching de dados
- Estruturaria as **Firestore Security Rules** com mais granularidade desde o dia zero

---

## Contato

<div align="center">

Desenvolvido por **Welder Barroso de Melo**

[![Nevalo](https://img.shields.io/badge/Nevalo-flow%20through%20every%20connection-1be4c8?style=for-the-badge&labelColor=03080f)](https://welderbarroso.dev)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Welder%20Barroso-0a66c2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/welder-barroso-37b654207)
[![GitHub](https://img.shields.io/badge/GitHub-WelderBM-f0f4f8?style=flat-square&logo=github&logoColor=03080f)](https://github.com/WelderBM)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-contato-25d366?style=flat-square&logo=whatsapp&logoColor=white)](https://wa.me/5595984006377)
[![Email](https://img.shields.io/badge/Email-welderbarroso.dev@gmail.com-1be4c8?style=flat-square&logo=gmail&logoColor=white)](mailto:welderbarroso.dev@gmail.com)

</div>

---

<div align="center">
<sub>Feito com foco e café · <a href="https://welderbarroso.dev">welderbarroso.dev</a></sub>
</div>

---

---

<!-- ════════════════════════════════════════════
     ENGLISH VERSION
════════════════════════════════════════════ -->

<a name="english-version"></a>

[EN] · [PT-BR](#top)

<div align="center">

# Mix Webapp

> A Full Stack e-commerce platform with a product customization engine, admin panel, and Firebase integration — built for a real gifts and decoration business.

![Status](https://img.shields.io/badge/status-in%20development-d4a853?style=flat-square&labelColor=03080f&color=d4a853)
![Version](https://img.shields.io/badge/version-0.1.0-1be4c8?style=flat-square&labelColor=03080f&color=1be4c8)
![License](https://img.shields.io/badge/license-private-d4a853?style=flat-square&labelColor=03080f&color=d4a853)
![Type](https://img.shields.io/badge/type-freelance-1be4c8?style=flat-square&labelColor=03080f&color=1be4c8)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Status](#status-en)
- [Learnings](#learnings)
- [Contact](#contact-en)

---

## About

**Mix Webapp** is a high-performance Full Stack e-commerce platform built to transform the shopping experience for gifts and decoration products. Unlike conventional stores, this project focuses on **consultative and personalized sales**: customers configure complex products through interactive interfaces and finalize orders directly via WhatsApp with the seller.

The project was born out of a real business need — the store needed a digital solution that respected its consultative sales model, rather than forcing customers through a generic checkout flow.

> From `KitBuilder` to the admin panel, every feature was built to solve a real business problem.

### Features

- [x] **Customization Engine** — `KitBuilder` and `LacoBuilder` for interactive product composition
- [x] **Admin Panel** — order management, inventory, and store settings
- [x] **Store Control** — open/closed status and promotional banners via Firestore
- [x] **Dynamic Inventory** — product management including Natura section
- [x] **SEO with JSON-LD** — structured data for Google indexing
- [x] **PWA Ready** — installable as a native app on mobile devices
- [x] Full Firebase integration (Auth, Firestore, Storage)
- [ ] Direct payment (Stripe / Pix)
- [ ] Sales analytics dashboard
- [ ] Push notifications for order status

---

## System Architecture

### 1. Customization Engine (The Builders)

The biggest technical challenge: building product assembly flows like `KitBuilder` and `LacoBuilder`.

**Decision:** **Zustand** for global builder state management — real-time pricing and component list updates without unnecessary re-renders.

**Impact:** Reduced cart abandonment — customers see the assembled product before confirming the order.

### 2. Admin Panel (Backoffice)

Restricted area for full operation management:

- Order listing and status updates
- Inventory management with a dedicated Natura section
- Store status and banner control via Firebase Firestore

---

## Tech Stack

| Technology        | Purpose                                    |
| :---------------- | :----------------------------------------- |
| **Next.js 16**    | App Router framework for SSR and Streaming |
| **TypeScript**    | Static typing for order contracts          |
| **Firebase**      | Auth, Firestore DB, and image Storage      |
| **Zustand**       | Global state for builders                  |
| **Tailwind CSS**  | Mobile-first utility styling               |
| **shadcn/ui**     | Accessible, consistent components          |
| **Vitest**        | Unit testing for business logic            |
| **Framer Motion** | UI animations                              |

---

## Getting Started

### Prerequisites

```bash
node >= 18.0.0
npm  >= 9.0.0
# Firebase account with a configured project
```

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/WelderBM/mix-webapp.git

# 2. Enter the folder
cd mix-webapp

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev
```

### Environment Variables

Create a `.env.local` file with your Firebase credentials. See `FIREBASE_SETUP.md` for the full setup guide.

---

<a name="status-en"></a>

## Status

```
🟡 In development
```

---

## Learnings

### Context

> Complex Full Stack freelance project for a real gifts and decoration business, with a consultative sales model via WhatsApp.

### What I learned

- **Next.js 15+ App Router** architecture with Server Components, Streaming, and React Server Actions
- Complex state management with **Zustand**: real-time reactive pricing in builders
- Component system design with **shadcn/ui** over Radix primitives
- Unit testing with **Vitest** for critical business logic (price calculators, cart rules)
- Advanced technical SEO: **JSON-LD**, dynamic metadata, Open Graph via Next.js
- Full Stack project management: from Firestore data modeling to UI delivery

### What I'd do differently

- Use **Server Actions** for mutations from day one to reduce client bundle size
- Adopt **React Query (TanStack Query)** instead of `useEffect` for data fetching
- Structure **Firestore Security Rules** with more granularity from day zero

---

<a name="contact-en"></a>

## Contact

<div align="center">

Built by **Welder Barroso de Melo**

[![Nevalo](https://img.shields.io/badge/Nevalo-flow%20through%20every%20connection-1be4c8?style=for-the-badge&labelColor=03080f)](https://welderbarroso.dev)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Welder%20Barroso-0a66c2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/welder-barroso-37b654207)
[![GitHub](https://img.shields.io/badge/GitHub-WelderBM-f0f4f8?style=flat-square&logo=github&logoColor=03080f)](https://github.com/WelderBM)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-contact-25d366?style=flat-square&logo=whatsapp&logoColor=white)](https://wa.me/5595984006377)
[![Email](https://img.shields.io/badge/Email-welderbarroso.dev@gmail.com-1be4c8?style=flat-square&logo=gmail&logoColor=white)](mailto:welderbarroso.dev@gmail.com)

</div>

---

<div align="center">
<sub>Built with focus and coffee · <a href="https://welderbarroso.dev">welderbarroso.dev</a></sub>
</div>
