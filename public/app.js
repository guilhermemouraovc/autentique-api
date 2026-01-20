const form = document.getElementById('termo-form');
const resultCard = document.getElementById('result-card');
const resultContent = document.getElementById('result-content');
const submitBtn = document.getElementById('submit-btn');
const fillBtn = document.getElementById('fill-btn');

const examplePayload = {
  nome_titular: 'João Silva',
  cpf_titular: '123.456.789-00',
  rg_titular: '12.345.678-9',
  ultimos_digitos: '1234',
  instituicao_cartao: 'Banco do Brasil',
  valor_transacao: '150,00',
  local_data: 'Salvador, 20 de Janeiro de 2026',
  data_natureza: '20/01/2026',
  nome_beneficiario: 'Maria Santos',
  cpf_beneficiario: '987.654.321-00',
  evento: 'Show do Ivete Sangalo'
};

fillBtn.addEventListener('click', () => {
  Object.entries(examplePayload).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      input.value = value;
    }
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resultCard.hidden = true;
  resultContent.innerHTML = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Gerando...';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/criar-termo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Não foi possível gerar o termo.');
    }

    resultContent.innerHTML = `
      <p class="status success">✅ Documento criado com sucesso</p>
      <p><strong>ID do documento:</strong> ${data.documento_id}</p>
      <p><strong>ID do assinante:</strong> ${data.signer_id}</p>
      <p><strong>Link de assinatura:</strong> <a href="${data.link_assinatura}" target="_blank" rel="noopener">${data.link_assinatura}</a></p>
    `;
  } catch (error) {
    resultContent.innerHTML = `
      <p class="status error">❌ Erro ao gerar termo</p>
      <p>${error.message}</p>
    `;
  } finally {
    resultCard.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Gerar termo';
  }
});
