# API Folhagem & Cia

API REST que substitui a planilha de estoque da Folhagem & Cia: cadastro de plantas, consulta com filtros, edição, remoção, vendas e valor total do estoque.

**Stack:** Node.js, Express, TypeScript, Prisma 5, PostgreSQL 16 e Docker.

## Como rodar

Pré-requisitos: Docker Desktop, Node 20+ e yarn.

```bash
git clone <URL-DO-SEU-REPOSITORIO>
cd <pasta-do-repositorio>
cp .env.example .env        # no Windows: copy .env.example .env
yarn
docker compose up -d --build
yarn migration
```
**Porta 5432 já em uso?** Se você tem outro PostgreSQL rodando na máquina (local ou em outro container), o `yarn migration` pode falhar com `P1000: Authentication failed`. Troque `DATABASE_PORT` no `.env` (ex.: `5433`) **antes** de subir o Docker.


A API fica em `http://localhost:3001`.

Dados de exemplo (opcional): `docker compose exec server yarn seed`. **O seed apaga todas as plantas existentes** e cria 8 de exemplo (2 esgotadas).

## Modelo de dados

**Planta** (enum `Luminosidade`: `SOMBRA`, `MEIA_SOMBRA`, `SOL_PLENO`)

| Campo | Tipo | Regra |
|---|---|---|
| `id` | Int | Gerado pelo banco |
| `nome` | String | Texto não vazio |
| `especie` | String | Texto não vazio |
| `preco` | Int | Em **centavos** (`8990` = R$ 89,90); maior que zero |
| `estoque` | Int | Maior ou igual a zero (zero = esgotada) |
| `luminosidade` | Luminosidade | Um dos três valores do enum |
| `petFriendly` | Boolean | `true` ou `false` (booleano, não texto) |
| `regaACadaDias` | Int | Maior ou igual a 1 |
| `createdAt` / `updatedAt` | DateTime | Automáticos |

No cadastro todos os campos são obrigatórios. Na edição nenhum é, mas os enviados seguem as mesmas regras. Todo erro volta como `{ "message": "..." }`.

## Rotas

| Método | Rota | O que faz | Sucesso | Erros |
|---|---|---|---|---|
| `POST` | `/plantas` | Cadastra uma planta | `201` | `400` campo faltando ou inválido, `500` |
| `GET` | `/plantas` | Lista, com filtros opcionais | `200` | `400` filtro inválido, `500` |
| `GET` | `/plantas/esgotadas` | Lista plantas com estoque zero | `200` | `500` |
| `GET` | `/plantas/estoque/valor-total` | Soma `preco × estoque` e total de vasos | `200` | `500` |
| `GET` | `/plantas/:id` | Busca uma planta | `200` | `400` id inválido, `404`, `500` |
| `PATCH` | `/plantas/:id` | Edita só os campos enviados | `200` | `400` id ou valor inválido, `404`, `500` |
| `DELETE` | `/plantas/:id` | Remove uma planta | `204` | `400` id inválido, `404`, `500` |
| `POST` | `/plantas/:id/venda` | Registra venda e diminui o estoque | `200` | `400` id, quantidade ou estoque insuficiente, `404`, `500` |

**Filtros de `GET /plantas`** (opcionais e combináveis): `luminosidade` (valor do enum), `petFriendly` (`true`/`false`), `nome` (parte do nome, sem diferenciar maiúsculas) e `ordem` (`preco` ou `nome`, crescente). Exemplo: `/plantas?luminosidade=SOL_PLENO&petFriendly=true&ordem=preco`.

### Exemplos

**`POST /plantas`**, corpo:

```json
{ "nome": "Costela-de-adão", "especie": "Monstera deliciosa", "preco": 8990, "estoque": 12, "luminosidade": "MEIA_SOMBRA", "petFriendly": false, "regaACadaDias": 3 }
```

Resposta `201`:

```json
{ "id": 1, "nome": "Costela-de-adão", "especie": "Monstera deliciosa", "preco": 8990, "estoque": 12, "luminosidade": "MEIA_SOMBRA", "petFriendly": false, "regaACadaDias": 3, "createdAt": "2026-10-28T19:10:26.507Z", "updatedAt": "2026-10-28T19:10:26.507Z" }
```

**`PATCH /plantas/1`**, corpo `{ "preco": 9990 }`: resposta `200` com a planta inteira já atualizada.

**`POST /plantas/1/venda`**, corpo `{ "quantidade": 2 }`: resposta `200` com a planta e o estoque já descontado (`"estoque": 10`).

**`GET /plantas/estoque/valor-total`**, resposta `200` (sem plantas devolve `0` e `0`):

```json
{ "valorTotalEmCentavos": 499830, "totalDeVasos": 142 }
```

**Erros** (exemplos): `400 { "message": "O campo nome é obrigatório." }`, `400 { "message": "Estoque insuficiente para a venda." }`, `404 { "message": "Planta não encontrada." }`.

## Decisões

- **Vendas simultâneas do último vaso:** a conferência e o desconto acontecem numa única operação no banco (`UPDATE ... WHERE estoque >= quantidade`). Se duas vendas disputarem o último vaso, o PostgreSQL executa uma de cada vez: a segunda não encontra linha que satisfaça a condição, nada é alterado e a resposta é `400`. O estoque nunca fica negativo.
- `id` inválido (ex.: `abc`) retorna `400`; `id` inexistente retorna `404`.
- `PATCH` com corpo vazio (`{}`) retorna `200` sem alterar nada. Campos como `id` e `createdAt` enviados no corpo são ignorados.
- O id de uma planta removida não é reaproveitado (comportamento do autoincrement do PostgreSQL).

## Bônus implementados

Busca por nome (`?nome=`), ordenação (`?ordem=`), rota `GET /plantas/esgotadas` e script de seed.