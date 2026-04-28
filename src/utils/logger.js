const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../../logs/errors.log');

function logErro(erro) {
  const mensagem = `[${new Date().toISOString()}] ${erro.stack || erro}\n`;

  fs.appendFile(logPath, mensagem, (err) => {
    if (err) console.error('Erro ao salvar log:', err);
  });
}

module.exports = logErro;