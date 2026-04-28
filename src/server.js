const http = require('http');
const url = require('url');
const { ObjectId } = require('mongodb');

const Usuario = require('./models/Usuario');
const Post = require('./models/Post');
const Comentario = require('./models/Comentario');

const fs = require('fs');
const pathModule = require('path');

const logErro = require('./utils/logger');
const validarCampos = require('./utils/validador');

function getBody(req, callback) {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      const parsed = JSON.parse(body || '{}');
      callback(null, parsed);
    } catch (err) {
      callback(err, null);
    }
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  try {

    if (path === '/usuario' && req.method === 'POST') {
      getBody(req, async (err, body) => {
        if (err) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro: 'JSON inválido' }));
        }
        
        const erro = validarCampos(['nome', 'email'], body);
        if (erro) {
          logErro(erro)
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }
        
        const usuario = new Usuario(body.nome, body.email);
        const result = await usuario.salvar();

        res.end(JSON.stringify({
          message: 'Usuário criado',
          id: result.insertedId
        }));
      });
    }

    else if (path === '/usuario' && req.method === 'GET') {
      const usuarios = await Usuario.listar();
      res.end(JSON.stringify(usuarios));
    }

    else if (path === '/usuario' && req.method === 'PUT') {
      getBody(req, async (err, body) => {
        if (err) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro: 'JSON inválido' }));
        }

        const erro = validarCampos(['id', 'nome', 'email'], body);
        if (erro) {
          logErro(erro);
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }

        try {
          const result = await Usuario.atualizar(body.id, {
            nome: body.nome,
            email: body.email
          });

          res.end(JSON.stringify({
            message: 'Usuário atualizado',
            result
          }));
        } catch (error) {
          logErro(error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            erro: 'Erro ao atualizar usuário'
          }));
        }
      });
    }

    else if (path === '/usuario' && req.method === 'DELETE') {
      getBody(req, async (err, body) => {
        if (err) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro: 'JSON inválido' }));
        }

        const erro = validarCampos(['id'], body);
        if (erro) {
          logErro(erro);
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }

        try {
          const result = await Usuario.deletar(body.id);

          res.end(JSON.stringify({
            message: 'Usuário deletado',
            result
          }));
        } catch (error) {
          logErro(error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            erro: 'Erro ao deletar usuário'
          }));
        }
      });
    }

    else if (path === '/post' && req.method === 'POST') {
      getBody(req, async (err, body) => {

        const erro = validarCampos(['titulo', 'conteudo', 'usuarioId'], body);
        if (erro) {
          logErro(erro)
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }

        const post = new Post(body.titulo, body.conteudo, body.usuarioId);
        const result = await post.salvar();

        res.end(JSON.stringify({
          message: 'Post criado',
          id: result.insertedId
        }));
      });
    }

    else if (path === '/posts' && req.method === 'GET') {
      try {
        const posts = await Post.buscarComUsuario();
        res.end(JSON.stringify(posts));

      } catch (err) {
        logErro(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ erro: 'Erro ao buscar posts' }));
      }
    }

    else if (path === '/post' && req.method === 'PUT') {
      getBody(req, async (err, body) => {
        if (err) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro: 'JSON inválido' }));
        }

        const erro = validarCampos(['titulo', 'conteudo', 'id'], body);
        if (erro) {
          logErro(erro)
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }

        try {
          const result = await Post.atualizar(body.id, {
            titulo: body.titulo,
            conteudo: body.conteudo
          });

          res.end(JSON.stringify({
            message: 'Post atualizado',
            result
          }));
        } catch (error) {
          logErro(error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            erro: 'Erro ao atualizar post'
          }));
        }
      });
    }

    else if (path.startsWith('/post') && req.method === 'DELETE') {
      getBody(req, async (err, body) => {

        const erro = validarCampos(['id'], body);
        if (erro) {
          logErro(erro)
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }

        try {
          const result = await Post.deletar(body.id);

        res.end(JSON.stringify({
            message: 'Post deletado',
            result
          }));
        } catch (error) {
          logErro(error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            erro: 'Erro ao deletar usuário'
          }));
        }
      });
    }

    else if (path === '/comentario' && req.method === 'POST') {
      getBody(req, async (err, body) => {

        const erro = validarCampos(['texto', 'postId'], body);
        if (erro) {
          logErro(erro)
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }

        const comentario = new Comentario(body.texto, body.postId);
        const result = await comentario.salvar();

        res.end(JSON.stringify({
          message: 'Comentário criado',
          id: result.insertedId
        }));
      });
    }

    else if (path === '/comentario' && req.method === 'GET') {
      const comentarios = await Comentario.listar();
      res.end(JSON.stringify(comentarios));
    }

    else if (path === '/comentario' && req.method === 'PUT') {
      getBody(req, async (err, body) => {

        const erro = validarCampos(['texto', 'id'], body);
        if (erro) {
          logErro(erro)
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }


        try {
          const result = await Comentario.atualizar(body.id,{
            texto: body.texto
          });

        res.end(JSON.stringify({
            message: 'Comentario atualizado',
            result
          }));
        } catch (error) {
          logErro(error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            erro: 'Erro ao deletar Comentario'
          }));
        }
      });
    }

    else if (path === '/comentario' && req.method === 'DELETE') {
      getBody(req, async (err, body) => {

        const erro = validarCampos(['id',], body);
        if (erro) {
          logErro(erro)
          res.statusCode = 400;
          return res.end(JSON.stringify({ erro }));
        }

        try {
          const result = await Comentario.deletar(body.id);

        res.end(JSON.stringify({
            message: 'Comentario deletado',
            result
          }));
        } catch (error) {
          logErro(error);
          res.statusCode = 500;
          res.end(JSON.stringify({
            erro: 'Erro ao deletar Comentario'
          }));
        }
      });
    }

    else {
      res.statusCode = 404;
      res.end(JSON.stringify({ erro: 'Rota não encontrada' }));
    }

  } catch (err) {
    logErro(err);

    res.statusCode = 500;
    res.end(JSON.stringify({
      erro: 'Erro interno do servidor'
    }));
  }
});

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});