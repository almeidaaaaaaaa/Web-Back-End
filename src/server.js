const express = require('express');
const session = require('express-session');

const Usuario = require('./models/Usuario');
const Post = require('./models/Post');
const Comentario = require('./models/Comentario');

const logErro = require('./utils/logger');
const validarCampos = require('./utils/validador');

const app = express();


app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-blog',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24h
}));


function autenticado(req, res, next) {
  if (!req.session?.usuarioId) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  next();
}

app.post('/login', async (req, res) => {
  const erro = validarCampos(['email'], req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const db = await require('./database/conexao').conectar();
    const usuario = await db.collection('usuario').findOne({ email: req.body.email });

    if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado' });

    req.session.usuarioId = usuario._id.toString();
    req.session.usuarioNome = usuario.nome;

    res.json({ message: 'Login realizado', usuarioId: req.session.usuarioId });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao realizar login' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(400).json({ erro: 'Erro ao encerrar sessão' });
    res.json({ message: 'Logout realizado' });
  });
});


app.post('/usuario', async (req, res) => {
  const erro = validarCampos(['nome', 'email'], req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const usuario = new Usuario(req.body.nome, req.body.email);
    const result = await usuario.salvar();
    res.status(201).json({ message: 'Usuário criado', id: result.insertedId });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao salvar usuário' });
  }
});

app.get('/usuario', async (req, res) => {
  try {
    const usuarios = await Usuario.listar();
    res.json(usuarios);
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao listar usuários' });
  }
});

app.get('/usuario/:id', async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.params.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao buscar usuário' });
  }
});

app.put('/usuario/:id', async (req, res) => {
  const erro = validarCampos(['nome', 'email'], req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const result = await Usuario.atualizar(req.params.id, { nome: req.body.nome, email: req.body.email });
    res.json({ message: 'Usuário atualizado', result });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao atualizar usuário' });
  }
});

app.delete('/usuario/:id', async (req, res) => {
  try {
    const result = await Usuario.deletar(req.params.id);
    res.json({ message: 'Usuário deletado', result });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao deletar usuário' });
  }
});

app.post('/post', autenticado, async (req, res) => {
  const erro = validarCampos(['titulo', 'conteudo'], req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const post = new Post(req.body.titulo, req.body.conteudo, req.session.usuarioId);
    const result = await post.salvar();
    res.status(201).json({ message: 'Post criado', id: result.insertedId });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao criar post' });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.buscarComUsuario();
    res.json(posts);
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao buscar posts' });
  }
});

app.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.buscarPorId(req.params.id);
    if (!post) return res.status(404).json({ erro: 'Post não encontrado' });
    res.json(post);
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao buscar post' });
  }
});

app.get('/post/usuario/:usuarioId', async (req, res) => {
  try {
    const posts = await Post.listarPorUsuario(req.params.usuarioId);
    res.json(posts);
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao listar posts do usuário' });
  }
});

app.put('/post/:id', autenticado, async (req, res) => {
  const erro = validarCampos(['titulo', 'conteudo'], req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const result = await Post.atualizar(req.params.id, { titulo: req.body.titulo, conteudo: req.body.conteudo });
    res.json({ message: 'Post atualizado', result });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao atualizar post' });
  }
});

app.delete('/post/:id', autenticado, async (req, res) => {
  try {
    const result = await Post.deletar(req.params.id);
    res.json({ message: 'Post deletado', result });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao deletar post' });
  }
});

app.post('/comentario', autenticado, async (req, res) => {
  const erro = validarCampos(['texto', 'postId'], req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const comentario = new Comentario(req.body.texto, req.body.postId);
    comentario.usuarioId = req.session.usuarioId; // vincula ao usuário logado
    const result = await comentario.salvar();
    res.status(201).json({ message: 'Comentário criado', id: result.insertedId });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao criar comentário' });
  }
});

app.get('/comentario', async (req, res) => {
  try {
    const comentarios = await Comentario.listar();
    res.json(comentarios);
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao listar comentários' });
  }
});

app.get('/comentario/:id', async (req, res) => {
  try {
    const comentario = await Comentario.buscarPorId(req.params.id);
    if (!comentario) return res.status(404).json({ erro: 'Comentário não encontrado' });
    res.json(comentario);
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao buscar comentário' });
  }
});

app.put('/comentario/:id', autenticado, async (req, res) => {
  const erro = validarCampos(['texto'], req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const result = await Comentario.atualizar(req.params.id, { texto: req.body.texto });
    res.json({ message: 'Comentário atualizado', result });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao atualizar comentário' });
  }
});

app.delete('/comentario/:id', autenticado, async (req, res) => {
  try {
    const result = await Comentario.deletar(req.params.id);
    res.json({ message: 'Comentário deletado', result });
  } catch (e) {
    logErro(e);
    res.status(400).json({ erro: 'Erro ao deletar comentário' });
  }
});

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
