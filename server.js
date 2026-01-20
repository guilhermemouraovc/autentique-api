const express = require('express');
const FormData = require('form-data');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const AUTENTIQUE_TOKEN = 'a8dadaf475c4c6c1360427c8e0c6dc89ee5895b13081d752d335efa78cd7df00';

app.post('/criar-termo', async (req, res) => {
  try {
    const {
      nome_titular,
      cpf_titular,
      rg_titular,
      ultimos_digitos,
      instituicao_cartao,
      valor_transacao,
      local_data,
      data_natureza,
      nome_beneficiario,
      cpf_beneficiario,
      evento
    } = req.body;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Termo de Autorização</title></head>
<body>
<p style="text-align: center;"><img style="width: 170px; margin-bottom: 20px;" src="https://i.postimg.cc/Y9Lws7sc/ticketlogo.png" height="77" /></p>
<p style="text-align: center;"><strong>TERMO DE AUTORIZAÇÃO PARA UTILIZAÇÃO DE CARTÃO DE TERCEIROS</strong></p>
<p style="text-align: left;">Pelo presente instrumento particular, o(a) abaixo identificado(a):</p>
<p style="text-align: left;"><strong>TITULAR DO CARTÃO:</strong></p>
<p style="text-align: left;">${nome_titular}, inscrito no CPF sob o nº ${cpf_titular}, portador da cédula de identidade ${rg_titular}, titular do cartão com final ${ultimos_digitos}, da instituição ${instituicao_cartao}, declara, para os devidos fins, que:</p>
<ol style="text-align: left;">
<li>É o legítimo titular do cartão de crédito acima identificado;</li>
<li>Autoriza expressamente a utilização de seu cartão de crédito para a aquisição de ingresso(s) por meio da plataforma TICKETPE, inscrita no CNPJ sob o nº 58.844.757/0001-41, em favor de:</li>
</ol>
<p style="text-align: left;"><strong>BENEFICIÁRIO DO INGRESSO:</strong></p>
<p style="text-align: left;">- Nome: ${nome_beneficiario}</p>
<p style="text-align: left;">- CPF: ${cpf_beneficiario}</p>
<ol style="text-align: left;" start="3">
<li>Declara estar ciente do valor de R$ ${valor_transacao} da transação, na data ${data_natureza} da natureza do serviço adquirido (${evento}) e das condições comerciais aplicáveis;</li>
<li>Reconhece que a presente autorização é concedida de forma livre, consciente e voluntária, não havendo qualquer vício de consentimento;</li>
<li>Declara estar ciente de que, uma vez autorizada a transação, eventuais contestações junto à operadora do cartão (chargeback) poderão ser analisadas com base neste termo, eximindo a plataforma TICKETPE de responsabilidade por alegação de uso indevido do cartão;</li>
<li>Assume integral responsabilidade pela autorização concedida, isentando a plataforma de revenda de ingressos de qualquer ônus decorrente de contestação infundada ou divergência entre o titular do cartão e o comprador do ingresso.</li>
</ol>
<p style="text-align: left;">Por ser verdade, firma o presente termo.</p>
<p style="text-align: center;">${local_data}</p>
<p style="text-align: center;">Assinatura do titular do cartão</p>
</body>
</html>`;

    const form = new FormData();
    
    // Query que retorna o link direto quando o signer tem NAME ao invés de EMAIL
    const operations = JSON.stringify({
      query: `mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
        createDocument(document: $document, signers: $signers, file: $file) {
          id
          name
          signatures {
            public_id
            name
            email
            link {
              short_link
            }
          }
        }
      }`,
      variables: {
        document: {
          name: `Termo de Autorizacao - ${nome_titular}`
        },
        signers: [
          {
            name: nome_titular,  // Usando NAME ao invés de EMAIL para pegar o link direto
            action: "SIGN"
          }
        ],
        file: null
      }
    });

    form.append('operations', operations);
    form.append('map', JSON.stringify({ "0": ["variables.file"] }));
    form.append('0', Buffer.from(html), {
      filename: 'termo.html',
      contentType: 'text/html'
    });

    const response = await axios.post(
      'https://api.autentique.com.br/v2/graphql',
      form,
      {
        headers: {
          'Authorization': `Bearer ${AUTENTIQUE_TOKEN}`,
          ...form.getHeaders()
        }
      }
    );

    console.log('=== Resposta completa ===');
    console.log(JSON.stringify(response.data, null, 2));

    const documento = response.data.data.createDocument;
    const signatureComLink = documento.signatures.find(sig => sig.link && sig.link.short_link);
    if (!signatureComLink) {
    throw new Error('Link de assinatura não encontrado');
    }

    const linkAssinatura = signatureComLink.link.short_link;
    res.json({
      success: true,
      message: "Documento criado com sucesso!",
      link_assinatura: linkAssinatura,
      documento_id: documento.id,
      signer_id: documento.signatures[0].public_id
    });

  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});