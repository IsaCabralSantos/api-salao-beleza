const express = require('express');
const mysql = require('mysql2/promise');


const app = express();
app.use(express.json());


// acesso bd
const dbConfig = {
    host: 'localhost',
    user: 'root',      
    password: 'unifeob@123',      
    database: 'salao_db'
};


// validação
class Validacao {
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }


    validarSenha(senha) {
        return Boolean(senha && senha.length >= 6);
    }
}


// resposta da API
class RespostaAPI {
    constructor(statusCode, mensagem, dados = null) {
        this.statusCode = statusCode;
        this.mensagem = mensagem;
        this.dados = dados;
    }
}


// autenticacao e gestao de usuarios
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


            const [existentes] = await connection.execute(
                'SELECT id FROM usuarios WHERE email = ?',
                [email]
            );


            if (existentes.length > 0) {
                await connection.end();
                return new RespostaAPI(400, "Este e-mail já está cadastrado");
            }


            const [resultado] = await connection.execute(
                'INSERT INTO usuarios (email, senha, permissao) VALUES (?, ?, ?)',
                [email, senha, permissao]
            );


            await connection.end();


            return new RespostaAPI(201, "Usuário criado com sucesso", {
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


class ServicoAgendamento {
    async verificarDisponibilidade(dataHora) {
        try {
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute(
                'SELECT id FROM agendamentos WHERE data_hora = ? AND status != "cancelado"',
                [dataHora]
            );
            await connection.end();
            return rows.length === 0;
        } catch (error) {
            console.error("Erro ao verificar disponibilidade:", error);
            throw error;
        }
    }


    async criarAgendamento(usuarioId, servicoId, dataHora, status = 'confirmado') {
        const disponivel = await this.verificarDisponibilidade(dataHora);
        if (!disponivel) {
            return new RespostaAPI(400, "Horário indisponível para agendamento");
        }


        try {
            const connection = await mysql.createConnection(dbConfig);
            const [resultado] = await connection.execute(
                'INSERT INTO agendamentos (usuario_id, servico_id, data_hora, status) VALUES (?, ?, ?, ?)',
                [usuarioId, servicoId, dataHora, status]
            );
            await connection.end();


            return new RespostaAPI(201, "Agendamento realizado com sucesso", {
                id: resultado.insertId,
                usuarioId,
                servicoId,
                dataHora,
                status
            });
        } catch (error) {
            console.error("Erro ao criar agendamento:", error);
            return new RespostaAPI(500, "Erro ao gravar agendamento no banco de dados");
        }
    }


    async solicitarAgendamento(usuarioId, servicoId, dataHora) {
        return await this.criarAgendamento(usuarioId, servicoId, dataHora, 'pendente');
    }


    async cancelarAgendamento(agendamentoId, usuarioId = null) {
        try {
            const connection = await mysql.createConnection(dbConfig);
            let query = 'UPDATE agendamentos SET status = "cancelado" WHERE id = ?';
            let params = [agendamentoId];


            if (usuarioId) {
                query = 'UPDATE agendamentos SET status = "cancelado" WHERE id = ? AND usuario_id = ?';
                params.push(usuarioId);
            }


            const [resultado] = await connection.execute(query, params);
            await connection.end();


            if (resultado.affectedRows === 0) {
                return new RespostaAPI(404, "Agendamento não localizado ou sem permissão para cancelamento");
            }


            return new RespostaAPI(200, "Agendamento cancelado com sucesso");
        } catch (error) {
            console.error("Erro ao cancelar agendamento:", error);
            return new RespostaAPI(500, "Erro ao cancelar agendamento no banco de dados");
        }
    }
}


class ControleAgendamento {
    constructor() {
        this.servicoAgendamento = new ServicoAgendamento();
    }


    async listarAgendamentos() {
        try {
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute(
                `SELECT a.id, a.data_hora, a.status, u.email as cliente_email, s.nome as servico_nome 
                 FROM agendamentos a 
                 JOIN usuarios u ON a.usuario_id = u.id 
                 JOIN servicos s ON a.servico_id = s.id 
                 ORDER BY a.data_hora ASC`
            );
            await connection.end();
            return new RespostaAPI(200, "Agenda carregada com sucesso", rows);
        } catch (error) {
            console.error("Erro ao listar agendamentos:", error);
            return new RespostaAPI(500, "Erro ao listar agenda");
        }
    }


    async cadastrarAgendamento(usuarioId, servicoId, dataHora) {
        return await this.servicoAgendamento.criarAgendamento(usuarioId, servicoId, dataHora, 'confirmado');
    }


    async alterarAgendamento(agendamentoId, novaDataHora, novoStatus) {
        try {
            const connection = await mysql.createConnection(dbConfig);
            const [resultado] = await connection.execute(
                'UPDATE agendamentos SET data_hora = COALESCE(?, data_hora), status = COALESCE(?, status) WHERE id = ?',
                [novaDataHora || null, novoStatus || null, agendamentoId]
            );
            await connection.end();


            if (resultado.affectedRows === 0) {
                return new RespostaAPI(404, "Agendamento não encontrado");
            }


            return new RespostaAPI(200, "Agendamento alterado com sucesso");
        } catch (error) {
            console.error("Erro ao alterar agendamento:", error);
            return new RespostaAPI(500, "Erro ao alterar agendamento");
        }
    }


    async cancelarAgendamento(agendamentoId) {
        return await this.servicoAgendamento.cancelarAgendamento(agendamentoId);
    }
}


class UsuarioCliente {
    constructor() {
        this.servicoAgendamento = new ServicoAgendamento();
    }


    async consultarServicos() {
        try {
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute('SELECT * FROM servicos');
            await connection.end();
            return new RespostaAPI(200, "Lista de serviços", rows);
        } catch (error) {
            console.error("Erro ao consultar serviços:", error);
            return new RespostaAPI(500, "Erro ao buscar serviços");
        }
    }


    async consultarHorarios(data) {
        try {
            const connection = await mysql.createConnection(dbConfig);
            const [rows] = await connection.execute(
                'SELECT data_hora FROM agendamentos WHERE DATE(data_hora) = ? AND status != "cancelado"',
                [data]
            );
            await connection.end();
            return new RespostaAPI(200, "Horários ocupados para esta data", rows);
        } catch (error) {
            console.error("Erro ao consultar horários:", error);
            return new RespostaAPI(500, "Erro ao consultar horários");
        }
    }


    async solicitarAgendamento(usuarioId, servicoId, dataHora) {
        return await this.servicoAgendamento.solicitarAgendamento(usuarioId, servicoId, dataHora);
    }


    async cancelarProprioAgendamento(agendamentoId, usuarioId) {
        return await this.servicoAgendamento.cancelarAgendamento(agendamentoId, usuarioId);
    }
}


class UsuarioRecepcao {
    constructor() {
        this.controleAgendamento = new ControleAgendamento();
    }


    async consultarAgenda() {
        return await this.controleAgendamento.listarAgendamentos();
    }


    async cadastrarAgendamento(usuarioId, servicoId, dataHora) {
        return await this.controleAgendamento.cadastrarAgendamento(usuarioId, servicoId, dataHora);
    }


    async alterarAgendamento(agendamentoId, novaDataHora, novoStatus) {
        return await this.controleAgendamento.alterarAgendamento(agendamentoId, novaDataHora, novoStatus);
    }


    async cancelarAgendamento(agendamentoId) {
        return await this.controleAgendamento.cancelarAgendamento(agendamentoId);
    }
}

const autenticacao = new Autenticacao();
const usuarioCliente = new UsuarioCliente();
const usuarioRecepcao = new UsuarioRecepcao();

// ---------------- ROTAS ----------------

// ve quem ta fazendo login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const resposta = await autenticacao.login(email, senha);
    res.status(resposta.statusCode).json(resposta);
});


app.post('/cadastrar', async (req, res) => {
    const { email, senha, permissao } = req.body;
    const resposta = await autenticacao.cadastrar(email, senha, permissao || 'cliente');
    res.status(resposta.statusCode).json(resposta);
});


// rotas do cliente
app.get('/cliente/servicos', async (req, res) => {
    const resposta = await usuarioCliente.consultarServicos();
    res.status(resposta.statusCode).json(resposta);
});


app.get('/cliente/horarios', async (req, res) => {
    const { data } = req.query;
    const resposta = await usuarioCliente.consultarHorarios(data);
    res.status(resposta.statusCode).json(resposta);
});


app.post('/cliente/solicitar-agendamento', async (req, res) => {
    const { usuario_id, servico_id, data_hora } = req.body;
    const resposta = await usuarioCliente.solicitarAgendamento(usuario_id, servico_id, data_hora);
    res.status(resposta.statusCode).json(resposta);
});


app.put('/cliente/cancelar-agendamento/:id', async (req, res) => {
    const agendamentoId = req.params.id;
    const { usuario_id } = req.body;
    const resposta = await usuarioCliente.cancelarProprioAgendamento(agendamentoId, usuario_id);
    res.status(resposta.statusCode).json(resposta);
});


// rotas da recepcao
app.get('/recepcao/agenda', async (req, res) => {
    const resposta = await usuarioRecepcao.consultarAgenda();
    res.status(resposta.statusCode).json(resposta);
});


app.post('/recepcao/cadastrar-agendamento', async (req, res) => {
    const { usuario_id, servico_id, data_hora } = req.body;
    const resposta = await usuarioRecepcao.cadastrarAgendamento(usuario_id, servico_id, data_hora);
    res.status(resposta.statusCode).json(resposta);
});


app.put('/recepcao/alterar-agendamento/:id', async (req, res) => {
    const agendamentoId = req.params.id;
    const { data_hora, status } = req.body;
    const resposta = await usuarioRecepcao.alterarAgendamento(agendamentoId, data_hora, status);
    res.status(resposta.statusCode).json(resposta);
});


app.delete('/recepcao/cancelar-agendamento/:id', async (req, res) => {
    const agendamentoId = req.params.id;
    const resposta = await usuarioRecepcao.cancelarAgendamento(agendamentoId);
    res.status(resposta.statusCode).json(resposta);
});


app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
