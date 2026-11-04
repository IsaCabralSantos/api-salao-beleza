# Desafio P2 - Desenvolvimento da API - Salão de Beleza

API desenvolvida com Node.js, Express e MySQL para realizar o login e o cadastro de usuários, com diferentes permissões de acesso: cliente e recepção.

## Estrutura do projeto

* **`index.js`**: Ficheiro principal contendo as rotas Express e as classes do sistema.
* **`salao_db.sql`**: Script SQL para criação da base de dados, tabelas e dados iniciais.
* **`package.json`**: Registo de dependências do Node.js.

### Classes de Domínio 
* **`Validacao`**: Valida o formato de e-mail e o tamanho mínimo da palavra-passe.
* **`RespostaAPI`**: Padroniza os retornos em formato JSON com `statusCode`, `mensagem` e `dados`.
* **`Autenticacao`**: Gerencia o login e cadastro de utilizadores no MySQL.
* **`ServicoAgendamento`**: Concentra a regra de negócio para verificar a disponibilidade de horários, criar e cancelar agendamentos.
* **`ControleAgendamento`**: Gerencia a visão geral da agenda e alterações de estado/horário pela receção.
* **`UsuarioCliente`**: Executa operações permitidas ao cliente (consultar serviços/horários, solicitar e cancelar agendamento próprio).
* **`UsuarioRecepcao`**: Executa operações administrativas da receção (consultar agenda geral, cadastrar, alterar e cancelar agendamentos).

---

## Estrutura da Base de Dados (`salao_db`)

1. **`usuarios`**: Guarda as credenciais (`email`, `senha`) e a `permissao` (`cliente` ou `recepção`).
2. **`servicos`**: Armazena os serviços prestados (`nome`, `preco`).
3. **`agendamentos`**: Regista os agendamentos realizados (`usuario_id`, `servico_id`, `data_hora`, `status`).

---

## Como Executar a Aplicação

1. Instale o **Node.js** e o **MySQL** na sua máquina.
2. Execute o ficheiro `salao_db.sql` no MySQL para criar a base de dados e as tabelas:
   ```sql
   CREATE DATABASE IF NOT EXISTS salao_db;
   USE salao_db;

   CREATE TABLE IF NOT EXISTS usuarios (
       id INT AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(100) NOT NULL UNIQUE,
       senha VARCHAR(100) NOT NULL,
       permissao VARCHAR(50) NOT NULL
   );

   CREATE TABLE IF NOT EXISTS servicos (
       id INT AUTO_INCREMENT PRIMARY KEY,
       nome VARCHAR(100) NOT NULL,
       preco DECIMAL(10, 2) NOT NULL
   );

   CREATE TABLE IF NOT EXISTS agendamentos (
       id INT AUTO_INCREMENT PRIMARY KEY,
       usuario_id INT NOT NULL,
       servico_id INT NOT NULL,
       data_hora DATETIME NOT NULL,
       status VARCHAR(50) NOT NULL DEFAULT 'pendente',
       FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
       FOREIGN KEY (servico_id) REFERENCES servicos(id)
   );

   INSERT INTO usuarios (email, senha, permissao) VALUES
   ('recepcao@salao.com', '123456', 'recepção'),
   ('cliente@gmail.com', '123456', 'cliente');

   INSERT INTO servicos (nome, preco) VALUES 
   ('Corte Masculino', 45.00),
   ('Corte Feminino', 70.00),
   ('Manicure', 35.00);
3. Verifique as configurações de conexão com o banco de dados no arquivo `server.js`.

4. No terminal do VS Code, execute:



```bash

npm install

```



5. Inicie o servidor com o comando:



```bash

node server.js

```
