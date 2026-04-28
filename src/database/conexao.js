const { MongoClient } = require('mongodb');
const logErro = require('../utils/logger');

class Conexao {
  constructor() {
    this.uri = 'mongodb://localhost:27017/mongo-blogging';
    this.client = new MongoClient(this.uri);
    this.db = null;
    this.conectando = false;
  }

  async conectar() {
    if (this.db) return this.db;

    if (this.conectando) {
      throw new Error('Conexão com banco em andamento');
    }

    this.conectando = true;

    try {
      await this.client.connect();

      this.db = this.client.db();
      console.log('Mongo conectado');

      return this.db;

    } catch (err) {
      logErro(err);

      this.db = null;

      throw new Error('Erro ao conectar com o banco de dados');

    } finally {
      this.conectando = false;
    }
  }
}

module.exports = new Conexao();