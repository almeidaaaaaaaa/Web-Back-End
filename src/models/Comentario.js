const conexao = require('../database/conexao');
const { ObjectId } = require('mongodb');

class Comentario {
  constructor(texto, postId) {
    this.texto = texto;
    this.postId = new ObjectId(postId);
  }

  async salvar() {
    const db = await conexao.conectar();
    return db.collection('comentario').insertOne(this);
  }

  static async listar() {
    const db = await conexao.conectar();
    return db.collection('comentario').find().toArray();
  }

  static async buscarPorId(id) {
    const db = await conexao.conectar();
    return db.collection('comentario').findOne({
      _id: new ObjectId(id)
    });
  }

  static async atualizar(id, data) {
    const db = await conexao.conectar();
    return db.collection('comentario').updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
  }

  static async deletar(id) {
    const db = await conexao.conectar();
    return db.collection('comentario').deleteOne({
      _id: new ObjectId(id)
    });
  }
}

module.exports = Comentario;