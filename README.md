# Desafio P2 - Desenvolvimento da API - Salão de Beleza

API desenvolvida com Node.js, Express e MySQL para realizar o login e o cadastro de usuários, com diferentes permissões de acesso: cliente e recepção.

## Estrutura do projeto

- `server.js`: código principal da API e definição das rotas.
- `salão_db.sql`: script SQL para criação e configuração do banco de dados.
- `package.json`: informações do projeto e dependências.
- `package-lock.json`: registro das versões das dependências.

## Tecnologias utilizadas

- Node.js
- Express
- MySQL

## Dependências

As dependências do projeto estão definidas no arquivo `package.json`.

Para instalá-las, execute no terminal:

```bash
npm install
```

## Como executar a API

1. Instale o Node.js e o MySQL.
2. Execute o script `salão_db.sql` no MySQL para criar o banco de dados.
3. Verifique as configurações de conexão com o banco de dados no arquivo `server.js`.
4. No terminal do VS Code, execute:

```bash
npm install
```

5. Inicie o servidor com o comando:

```bash
node server.js
```

Após iniciar, a API estará disponível no endereço e na porta configurados no arquivo `server.js`.

## Rotas da API

### 1. Login

**Método:** `POST`

**Rota:** `/login`

Realiza a autenticação do usuário.

Exemplo de corpo da requisição (JSON):

```json
{
  "email": "recepcao@salao.com",
  "senha": "123456"
}
```

### 2. Cadastrar usuário

**Método:** `POST`

**Rota:** `/cadastrar`

Realiza o cadastro de um novo usuário no banco de dados.

Exemplo de corpo da requisição (JSON):

```json
{
  "email": "novo_cliente@gmail.com",
  "senha": "123456",
  "permissao": "cliente"
}
```

A permissão define o tipo de acesso do usuário, podendo ser `cliente` ou `recepção`.

## ## Testes

A API foi testada utilizando o Insomnia, realizando requisições HTTP para verificar o funcionamento das rotas de login e cadastro de usuários.

As requisições foram enviadas no formato JSON, utilizando o método POST para as rotas `/login` e `/cadastrar`.