function validarCamposObrigatorios(campos, body) {
  for (let campo of campos) {
    if (
      !body[campo] || 
      body[campo].toString().trim() === ''
    ) {
      return `Campo obrigatório: ${campo}`;
    }
  }
  return null;
}

module.exports = validarCamposObrigatorios;