# Configuração Obrigatória do Firebase Authentication

Para que o login e cadastro funcionem no site publicado (`mixnovidades.com.br`), você precisa ativar o serviço no Painel do Firebase.

## 1. Ativar Login por E-mail/Senha

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Selecione seu projeto **Mix WebApp**.
3. No menu lateral esquerdo, clique em **Criação (Build)** -> **Authentication**.
4. Clique na aba **Sign-in method** (Método de login).
5. Clique em **Email/Password**.
6. Ative a chave **Enable** (Ativar).
7. Clique em **Save** (Salvar).

## 2. Autorizar seu Domínio (Resolvendo erro `auth/configuration-not-found`)

O Firebase bloqueia tentativas de login vindas de sites desconhecidos por segurança.

1. Ainda na tela de **Authentication**, clique na aba **Settings** (Configurações).
2. Role até a seção **Authorized domains** (Domínios autorizados).
3. Clique em **Add domain** (Adicionar domínio).
4. Digite: `mixnovidades.com.br` (e também `www.mixnovidades.com.br` se usar).
5. Se estiver usando Vercel, adicione também o domínio da Vercel (ex: `natura-app.vercel.app`).
6. Clique em **Add**.

## 3. Criar o Primeiro Admin

Agora que o serviço está ativo:

1. Acesse `/admin` no seu site.
2. No formulário de login, clique em **"Não tem conta? Cadastrar"**.
3. Preencha seu e-mail e senha.
4. No campo **Código de Segurança**, digite: `MIX2025` (Esse código é para impedir que estranhos criem contas).
5. Clique em Criar Conta.

Pronto! Você estará logado e o sistema manterá seu login salvo automaticamente.
