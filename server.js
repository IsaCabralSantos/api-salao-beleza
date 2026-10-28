const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// acesso do MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',      
    password: 'unifeob@123',      
    database: 'salao_db'
};

// parte de Validação
class Validacao {
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    validarSenha(senha) {
        return Boolean(senha && senha.length >= 6);
    }
}

// parte da resposta da API
class RespostaAPI {
    constructor(statusCode, mensagem, dados = null) {
        this.statusCode = statusCode;
        this.mensagem = mensagem;
        this.dados = dados;
    }
}

// parte que atentica e faz gestao de quem usa
class Autenticacao {
    constructor() {
        this.validacao = new Validacao();
    }

    async login(email, senha) {
        if (!this.validacao.validarEmail(email)) {
            return new RespostaAPI(400, "Formato de e-mail inválido");
        }

        if (!this.validacao.validarSenha(senha)) {
            return new RespostaAPI(400, "Senha inválida (mínimo de 6 caracteres)");
        }

        try {
            const connection = await mysql.createConnection(dbConfig);

            const [rows] = await connection.execute(
                'SELECT id, email, permissao FROM usuarios WHERE email = ? AND senha = ?',
                [email, senha]
            );

            await connection.end();

            if (rows.length === 0) {
                return new RespostaAPI(401, "E-mail ou senha incorretos");
            }

            const usuario = rows[0];

            return new RespostaAPI(200, "Acesso autorizado", {
                id: usuario.id,
                email: usuario.email,
                permissao: usuario.permissao
            });
        } catch (error) {
            console.error("Erro no MySQL:", error);
            return new RespostaAPI(500, "Erro interno ao conectar à base de dados");
        }
    }

    async cadastrar(email, senha, permissao = 'cliente') {
        if (!this.validacao.validarEmail(email)) {
            return new RespostaAPI(400, "E-mail inválido");
        }

        if (!this.validacao.validarSenha(senha)) {
            return new RespostaAPI(400, "Senha inválida (mínimo de 6 caracteres)");
        }

        try {
            const connection = await mysql.createConnection(dbConfig);

            // verificar se o e-mail ta cadastrado
            const [existentes] = await connection.execute(
                'SELECT id FROM usuarios WHERE email = ?',
                [email]
            );

            if (existentes.length > 0) {
                await connection.end();
                return new RespostaAPI(400, "Este e-mail já está cadastrado");
            }

            // add novo cadastro no bd
            const [resultado] = await connection.execute(
                'INSERT INTO usuarios (email, senha, permissao) VALUES (?, ?, ?)',
                [email, senha, permissao]
            );

            await connection.end();

            return new RespostaAPI(201, "Utilizador criado com sucesso", {
                id: resultado.insertId,
                email: email,
                permissao: permissao
            });
        } catch (error) {
            console.error("Erro no MySQL:", error);
            return new RespostaAPI(500, "Erro interno ao conectar à base de dados");
        }
    }
}

const autenticacao = new Autenticacao();

// rota login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const resposta = await autenticacao.login(email, senha);
    res.status(resposta.statusCode).json(resposta);
});

// rota cadastro
app.post('/cadastrar', async (req, res) => {
    const { email, senha, permissao } = req.body;
    const resposta = await autenticacao.cadastrar(email, senha, permissao || 'cliente');
    res.status(resposta.statusCode).json(resposta);
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});