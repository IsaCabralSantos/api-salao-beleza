CREATE DATABASE IF NOT EXISTS salao_db;
USE salao_db;


CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    permissao VARCHAR(50) NOT NULL
);


INSERT INTO usuarios (email, senha, permissao) VALUES
('recepcao@salao.com', '123456', 'recepção'),
('cliente@gmail.com', '123456', 'cliente');


select * from usuarios

USE salao_db;

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

INSERT INTO servicos (nome, preco) VALUES 
('Corte Masculino', 45.00),
('Corte Feminino', 70.00),
('Manicure', 35.00);
