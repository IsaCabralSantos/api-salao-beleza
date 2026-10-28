CREATE DATABASE IF NOT EXISTS salao_db;
USE salao_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    permissao VARCHAR(50) NOT NULL
);

-- Inserir utilizadores de teste
INSERT INTO usuarios (email, senha, permissao) VALUES
('recepcao@salao.com', '123456', 'recepção'),
('cliente@gmail.com', '123456', 'cliente');

select * from usuarios