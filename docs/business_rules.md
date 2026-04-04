# Especificação de Comportamento (BDD) - Plataforma PRECISA-SE.APP.BR

Este documento consolida as regras de negócio, jornadas e cenários de teste da plataforma, adotando a diretriz de UX Writing centrada na "Pessoa" e a estruturação O2O (Offline to Online).

---

## 1. MÓDULO ANÚNCIO

**Funcionalidade:** Controlo de Publicação e Ciclo de Crédito de Anúncios

**História da Pessoa a utilizar o sistema (A Jornada):**
**Como** uma pessoa a utilizar a plataforma (Anunciante Comum ou Representante Local),
**Eu quero** publicar e gerir anúncios de serviços, comerciais e vagas do meu bairro,
**Para que** eu possa divulgar serviços, compras e vendas de produtos na comunidade, respeitando as regras de gratuidade e os limites do meu perfil.

### Cenário 1: Pessoa Anunciante Comum a publicar o primeiro anúncio (Início do Ciclo)
**Dado** uma pessoa anunciante comum (perfil free) autenticada no sistema
**E** que ela não possui nenhum anúncio registado ou o seu último ciclo de 30 dias já expirou
**Quando** requisitar a publicação de um novo anúncio (seja de vaga, serviço ou comércio)
**Então** o sistema deve permitir a criação com sucesso
**E** o estado do anúncio deve ser definido automaticamente como "active" (ativo)
**E** um novo ciclo de crédito deve ser iniciado, definindo a data de expiração (`expiresAt`) para exatamente 30 dias a partir do momento da criação
**E** os contadores de métricas (`views`, `clicks`, `contacts`) devem ser inicializados a zero.

### Cenário 2: Conversão O2O via QR Code (O "Scan" do Cartaz)
**Dado** uma pessoa visitante que escaneia o QR Code do Cartaz Colaborativo na rua
**Quando** o sistema carregar a página pública do anúncio identificando o parâmetro `?origem=cartaz_impresso`
**Então** o sistema de telemetria deve registar `+1` na métrica de "Visualizações Offline/Cartaz" daquele anúncio
**E** processar a renderização da página da vaga, serviço ou comércio normalmente.

---

## 2. MÓDULO ADMINISTRAÇÃO

**Funcionalidade:** Moderação e Adoção de Anúncios da Comunidade

**História da Pessoa a utilizar o sistema (A Jornada):**
**Como** uma pessoa administradora ou moderadora,
**Eu quero** gerir os anúncios de vagas, serviços e comércio da comunidade,
**Para que** eu possa aprovar conteúdos válidos e "adotar" anúncios orgânicos para a minha gestão de representante local.

### Cenário 1: Pessoa Representante ou Admin a aprovar anúncio orgânico pendente (Adoção Segura)
**Dado** uma pessoa com perfil rep ou admin a operar o seu painel
**E** que existe um anúncio de terceiros a aguardar na fila com estado "pending" e sem representação atrelada (`source_rep_uid == null`)
**Quando** a pessoa moderadora acionar a ação de "Aprovar" no card do anúncio
**Então** o sistema deve iniciar uma transação atómica (`runTransaction`) na base de dados
**E** validar se o estado ainda é "pending"
**E** alterar o estado do anúncio para "active"
**E** preencher automaticamente o campo `source_rep_uid` com o ID da pessoa que fez a aprovação.

---

## 3. MÓDULO ASSISTENTE DE CURRÍCULO

**Funcionalidade:** Recolha Conversacional de Perfil Profissional (Interação Humano-IA)

**História da Pessoa a utilizar o sistema (A Jornada):**
**Como** uma pessoa da comunidade a procurar oportunidades locais,
**Eu quero** conversar com um assistente virtual acolhedor para fornecer os meus dados profissionais básicos,
**Para que** eu possa visualizar um Currículo Digital moderno sem a fricção de preencher formulários longos ou criar palavras-passe imediatamente.

### Cenário 1: Entrada Segura e Conformidade LGPD (Gatekeeper)
**Dado** uma pessoa que acede à página do assistente de currículo
**Quando** o chat for inicializado
**Então** o sistema deve renderizar de forma estática (sem envio à IA) a mensagem de conformidade com a LGPD
**E** solicitar unicamente o Primeiro Nome da pessoa
**E** validar no front-end para que apenas letras sejam aceites, bloqueando números ou caracteres especiais.

### Cenário 2: Tratamento de Acessibilidade (Captura Híbrida PCD)
**Dado** que a pessoa está na etapa de identificação de deficiência (PCD)
**Quando** a pessoa responder afirmativamente (ex: "Sim", "Sou PCD")
**Então** o motor do chat deve pausar o envio de texto
**E** o sistema deve renderizar um componente visual de múltipla escolha (Checkboxes: Auditiva, Física, Visual, Intelectual/Mental)
**E** gravar as opções selecionadas no estado local (`resumeData`) após a confirmação.

### Cenário 3: Renderização da Prévia Visual do Currículo
**Dado** que a pessoa forneceu o seu resumo de habilidades, concluindo o roteiro de perguntas
**Quando** o fluxo do assistente (`flow.js`) atingir a última etapa
**Então** o sistema deve compilar os dados do estado local
**E** renderizar um Card de "Prévia do Resumo" diretamente no chat
**E** exibir as tags coloridas de acessibilidade caso a pessoa se tenha identificado como PCD no cenário anterior
**E** fornecer as chamadas de ação (Botões) para "Ficou ótimo, avançar" ou "Quero editar".