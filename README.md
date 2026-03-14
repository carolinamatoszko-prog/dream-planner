# Dream Planner

## Configuração local

```bash
npm install

# Cria o ficheiro de variáveis de ambiente local
echo "OPENAI_API_KEY=sk-..." > .env.local

npm run dev
# Abre http://localhost:3000
```

## Deploy na Vercel

1. Push para GitHub
2. Importa o repositório na Vercel
3. Em **Settings → Environment Variables**, adiciona:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-...` (a tua chave)
4. Redeploy

A chave nunca é exposta no browser — fica exclusivamente na Serverless Function `/api/analyze`.
