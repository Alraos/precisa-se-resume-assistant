# Documentação do Assistente de Preenchimento — PRECISA-SE

## 1. Visão Geral
Este documento define as regras de negócio, o fluxo conversacional e a arquitetura de estado para o **Assistente de Preenchimento de Currículo** da plataforma PRECISA-SE.
O objetivo deste módulo é recolher dados básicos da pessoa de forma humanizada e interativa, gerando uma prévia visual (Card) ao final do processo, sem a necessidade de autenticação (login) ou geração de PDF nesta etapa.

**Lema da Plataforma:** "O que te ajudaria hoje?" (O assistente deve refletir este tom acolhedor, focado em conectar pessoas e comércio local, indo além de um simples quadro de anúncios).

---

## 2. Diretrizes Absolutas de Negócio

### 2.1. Regra de Nomenclatura (STRICT)
* **Obrigatório:** Utilizar exclusivamente o termo **"pessoa"** em todas as variáveis (`mensagemPessoa`), comentários de código, lógicas de interface e prompts de IA.
* **Proibido:** O uso dos termos "candidato(a)" ou "usuário(a)" é terminantemente proibido para garantir a humanização e o acolhimento local.

### 2.2. Privacidade desde a Concepção (LGPD)
* A primeira interação não passa pela Inteligência Artificial. Deve ser renderizada estaticamente pelo JavaScript.
* **Mensagem Inicial Obrigatória:** > *"Olá! Sou o assistente do PRECISA-SE. Seguiremos, a partir de agora, sob a LGPD (Lei nº 13.709/2018). Começaremos a preparar o seu currículo digital coletando estritamente os dados necessários para o seu perfil. Informe apenas o seu Primeiro Nome:"*
* **Isolamento de Dados:** Dados sensíveis de contacto (e-mail, telefone, CPF) não devem ser solicitados neste fluxo conversacional.

---

## 3. Arquitetura de Estado (State Machine)

O ficheiro `src/pages/resume/flow.js` deve controlar o fluxo de perguntas para evitar alucinações da IA. O objeto global de memória no navegador será:

```javascript
let resumeData = {
  nome: "",
  areaAtuacao: "",
  isPCD: null,
  tiposDeficiencia: [],
  resumo: ""
};