import requests
from bs4 import BeautifulSoup
import json

# URL da NFC-e
url = "https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=35250200063960001504655050000016881048579176|2|1|1|EFBA4B2A2B28486EE9817AE3125C6B8ECEF8CD05"

# Faz a requisição GET
response = requests.get(url)
html_content = response.content

# Parsea o HTML
soup = BeautifulSoup(html_content, "html.parser")

# Extrai as informações desejadas
estabelecimento = soup.find("div", {"id": "u20"}).text.strip() if soup.find("div", {"id": "u20"}) else "Não encontrado"
data = None

# Procura a data de emissão
for strong_tag in soup.find_all("strong"):
    if "Emissão:" in strong_tag.text:
        data_completa = strong_tag.next_sibling.strip()
        data = data_completa.split()[0]  # Pega apenas a data
        break

# Produtos
produtos = []
for item in soup.find_all("tr", {"id": lambda x: x and x.startswith("Item")}):
    descricao = item.find("span", {"class": "txtTit"})
    valor_total = item.find("span", {"class": "valor"})
    produto = {
        "data": data if data else "Não encontrado",
        "item": descricao.text.strip() if descricao else "Não encontrado",
        "preço": valor_total.text.strip() if valor_total else "Não encontrado"
    }
    produtos.append(produto)

# Objeto final
objeto_final = {
    "local_de_compra": estabelecimento,
    "itens": produtos
}

# Exibe o objeto final de forma legível
print(json.dumps(objeto_final, indent=4, ensure_ascii=False))
