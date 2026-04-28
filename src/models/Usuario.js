const conexao = require('../database/conexao');
const { ObjectId } = require('mongodb');

class Usuario {
  constructor(nome, email) {
    this.nome = nome;
    this.email = email;
  }

  async salvar() {
    const db = await conexao.conectar();
    return db.collection('usuario').insertOne(this);
  }

  static async listar() {
    const db = await conexao.conectar();
    return db.collection('usuario').find().toArray();
  }

  static async buscarPorId(id) {
    const db = await conexao.conectar();
    return db.collection('usuario').findOne({
      _id: new ObjectId(id)
    });
  }

  static async atualizar(id, data) {
    const db = await conexao.conectar();
    return db.collection('usuario').updateOne(
      { _id: new ObjectId(id) },
      { $set: data }
    );
  }

  static async deletar(id) {
    const db = await conexao.conectar();
    return db.collection('usuario').deleteOne({
      _id: new ObjectId(id)
    });
  }
}

module.exports = Usuario;