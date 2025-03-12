import axios from "axios";
import cheerio from "cheerio";

export async function processNfeData(qrCodeUrl) {
  try {
    // Faz a requisição GET para a URL
    const response = await axios.get(qrCodeUrl);
    const htmlContent = response.data;

    // Utiliza cheerio para parsear o HTML
    const $ = cheerio.load(htmlContent);

    // Extrai as informações desejadas
    const estabelecimento = $("#u20").text().trim() || "Não encontrado";
    let data = null;

    // Procura a data de emissão
    $("strong").each((_, element) => {
      const text = $(element).text();
      if (text.includes("Emissão:")) {
        data = $(element).next().text().trim().split(" ")[0];
      }
    });

    // Extrai os produtos
    const produtos = [];
    $('tr[id^="Item"]').each((_, element) => {
      const descricao =
        $(element).find(".txtTit").text().trim() || "Não encontrado";
      const valorTotal =
        $(element).find(".valor").text().trim() || "Não encontrado";
      produtos.push({
        data: data || "Não encontrado",
        item: descricao,
        preço: valorTotal,
      });
    });

    // Objeto final com os dados extraídos
    return {
      local_de_compra: estabelecimento,
      itens: produtos,
    };
  } catch (error) {
    console.error("Erro ao processar os dados da URL:", error);
    throw new Error("Erro ao processar os dados da URL");
  }
}
