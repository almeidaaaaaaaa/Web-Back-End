const conexao = require('../database/conexao');
const { ObjectId } = require('mongodb');

class Post {
  constructor(titulo, conteudo, usuarioId) {
    this.titulo = titulo;
    this.conteudo = conteudo;
    this.usuarioId =  new ObjectId(usuarioId);
  }

  async salvar() {
    const db = await conexao.conectar();
    return db.collection('post').insertOne(this);
  }

  static async listar() {
    const db = await conexao.conectar();
    return db.collection('post').find().toArray();
  }

  static async buscarPorId(id) {
    const db = await conexao.conectar();
    return db.collection('post').findOne({
      _id: new ObjectId(id)
    });
  }

  static async atualizar(id, data) {
    const db = await conexao.conectar();
    return db.collection('post').updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
  }

  static async deletar(id) {
    const db = await conexao.conectar();
    return db.collection('post').deleteOne({
      _id: new ObjectId(id)
    });
  }

  static async listarPorUsuario(usuarioId) {
    const db = await conexao.conectar();

    return db.collection('post').find({
      usuarioId: new ObjectId(usuarioId)
    }).toArray();
  }

  static async buscarComUsuario() {
    const db = await conexao.conectar();

    return db.collection('post').aggregate([
      {
        $lookup: {
          from: 'usuario',
          localField: 'usuarioId',
          foreignField: '_id',
          as: 'usuario'
        }
      },
      {
        $unwind: '$usuario'
      },
      {
        $project: {
          titulo: 1,
          conteudo: 1,
          nomeUsuario: '$usuario.nome'
        }
      }
    ]).toArray();
  }
}

module.exports = Post;