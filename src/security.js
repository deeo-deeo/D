const escapeHTML = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const validateMessage = (content) => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Conteúdo da mensagem inválido.' };
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'A mensagem não pode estar vazia.' };
  }

  if (trimmed.length > 2000) {
    return { isValid: false, error: 'A mensagem excede o limite de 2000 caracteres.' };
  }

  const sanitizedContent = escapeHTML(trimmed);

  return {
    isValid: true,
    sanitizedContent
  };
};
