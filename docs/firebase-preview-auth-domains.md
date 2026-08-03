# Firebase Auth nos previews da Vercel

Cada branch da Vercel recebe uma URL de deploy efêmera e um alias estável, por exemplo:

```text
mix-webapp-git-fix-admin-nav-collapse-76-welderbms-projects.vercel.app
```

Firebase Authentication exige autorização por hostname exato; não há wildcard para
os previews. O workflow `sync-firebase-preview-auth-domain.yml` roda quando a
Vercel marca um Preview como pronto, consulta o alias estável da branch e o inclui
em `mix-webapp-staging`.

## Pré-requisitos únicos

Crie uma service account exclusiva para a automação no projeto
`mix-webapp-staging`, concedendo somente o papel **Firebase Authentication Admin**
(`roles/firebaseauth.admin`). Configure Workload Identity Federation para este
repositório GitHub, limitada ao repositório `WelderBM/mix-webapp`, e permita que a
identidade federada impersonifique essa service account.

Cadastre estes GitHub Actions secrets:

| Secret | Valor |
| --- | --- |
| `GCP_WIF_PROVIDER` | Resource name completo do Workload Identity Provider do GitHub. |
| `FIREBASE_STAGING_AUTH_SYNC_SERVICE_ACCOUNT` | E-mail da service account exclusiva. |
| `VERCEL_AUTOMATION_TOKEN` | Token Vercel com leitura deste projeto; é usado apenas para resolver o alias estável do preview. |

O workflow serializa alterações em `authorizedDomains`, evitando que deploys
simultâneos apaguem o domínio registrado pelo outro. Ele nunca usa Firebase de
produção e não registra a URL efêmera do deployment.

## Validação

Após o merge, faça push de uma branch qualquer e espere o preview ficar `READY`.
No job **Sync Firebase preview Auth domain**, a última etapa deve informar que o
alias foi autorizado. Então use o alias `mix-webapp-git-...vercel.app` para testar
o Google Sign-In contra o Firebase de staging.
