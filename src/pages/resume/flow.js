/*
 * Copyright 2026 PRECISA-SE (CONCP)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-8.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// src/pages/resume/flow.js

/**
 * MODULE: Resume Assistant (PRECISA-SE)
 * This file defines the data structure and flow logic for the digital resume assistant.
 */

// 1. State Object (Session Memory)
export let resumeData = {
  nome: "",
  idade: "",
  escolaridade: "",
  areaAtuacao: "",
  isPCD: null,
  respondenteTipo: "", 
  tiposDeficiencia: [],
  bairro: "",
  telefone: "",
  email: "",
  resumo: "",
  lgpdAccepted: false
};

// 2. State Machine (Flow Intelligence)
export const resumeFlow = {
  states: {
    START: {
      messages: [
        "Olá! A equipe do PRECISA-SE deseja que tudo esteja bem ;)",
        "Sou assistente virtual e te ajudarei na preparação do seu currículo digital.",
        "Farei perguntas visando te ajudar passo a passo no preenchimento do seu currículo para empresas poderem conhecer o seu perfil profissional.",
        "Antes de começarmos devemos cumprir a Lei Geral de Proteção de Dados (LGPD) para nossa segurança! Esses dados utilizados aqui serão apenas para conectar seu perfil profissional com vagas de trabalho, se ficou claro e aceitar essa regra podemos continuar.",
      ],
      interaction: {
        type: "buttons",
        title: "Termo de Consentimento (LGPD)",
        options: [
          { label: "Concordo e quero começar", value: "agree", nextState: "SCREENING" },
          { label: "Não concordo", value: "disagree", nextState: "EXIT" }
        ]
      }
    },

    SCREENING: {
      messages: [
        "Para podermos te orientar melhor, responda:"
      ],
      interaction: {
        type: "buttons",
        title: "Quem está respondendo?",
        options: [
          { 
            label: "Sou Pessoa com Deficiência", 
            value: "pcd_self", 
            action: (data) => { 
              data.isPCD = true; 
              data.respondenteTipo = "proprio";
            },
            nextState: "PCD_DETAILS" 
          },
          { 
            label: "Estou ajudando Pessoa com Deficiência", 
            value: "pcd_help", 
            action: (data) => { 
              data.isPCD = true; 
              data.respondenteTipo = "ajudante";
            },
            nextState: "PCD_DETAILS" 
          },
          { 
            label: "Sou Pessoa sem Deficiência", 
            value: "no_pcd", 
            action: (data) => { 
              data.isPCD = false; 
              data.respondenteTipo = "proprio";
            },
            nextState: "COLLECT_NAME" 
          }
        ]
      }
    },

    COLLECT_NAME: {
      messages: [
        "Continuando, responda o seu primeiro nome."
      ],
      interaction: {
        type: "text",
        validation: (input) => {
          const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/;
          return regex.test(input) && !input.includes(' ');
        },
        errorMsg: "Por favor, informe apenas o seu primeiro nome, sem espaços ou números.",
        saveTo: "nome",
        nextState: "AGE_COLLECTION"
      }
    },

    PCD_DETAILS: {
      messages: [
        "Entendido. Acessibilidade é prioridade para nós.",
        "Poderia me indicar qual o tipo de deficiência? (Você pode marcar mais de uma opção)"
      ],
      interaction: {
        type: "checkbox",
        title: "Detalhes de Acessibilidade",
        options: [
          { label: "Auditiva", value: "auditiva" },
          { label: "Física", value: "fisica" },
          { label: "Visual", value: "visual" },
          { label: "Intelectual/Mental", value: "intelectual" }
        ],
        saveTo: "tiposDeficiencia",
        nextState: "COLLECT_NAME"
      }
    },

    AGE_COLLECTION: {
      messages: [
        "Prazer em te conhecer, {nome}! Agora, qual a sua idade?"
      ],
      interaction: {
        type: "text",
        inputType: "number",
        validation: (input) => /^\d{1,2}$/.test(input) && parseInt(input) >= 14,
        errorMsg: "Por favor, informe uma idade válida (a partir de 14 anos).",
        saveTo: "idade",
        nextState: "EDUCATION_LEVEL"
      }
    },

    EDUCATION_LEVEL: {
      messages: [
        "Obrigado! E sobre seus estudos, qual o seu nível de escolaridade?"
      ],
      interaction: {
        type: "buttons",
        title: "Nível de Escolaridade",
        saveTo: "escolaridade",
        options: [
          { label: "Pós-graduação", value: "Pós-graduação", nextState: "DESIRED_ROLE" },
          { label: "Superior", value: "Superior", nextState: "DESIRED_ROLE" },
          { label: "Técnico", value: "Técnico", nextState: "DESIRED_ROLE" },
          { label: "Ensino Médio", value: "Ensino Médio", nextState: "DESIRED_ROLE" },
          { label: "Ensino Fundamental", value: "Ensino Fundamental", nextState: "DESIRED_ROLE" }
        ]
      }
    },

    DESIRED_ROLE: {
      messages: [
        "Entendido. E em qual área ou tipo de trabalho você tem mais interesse em atuar?"
      ],
      interaction: {
        type: "text",
        saveTo: "areaAtuacao",
        nextState: "NEIGHBORHOOD_LOCATION"
      }
    },

    NEIGHBORHOOD_LOCATION: {
      messages: [
        "Certo. Para te conectar com vagas próximas, em qual bairro você mora?"
      ],
      interaction: {
        type: "text",
        saveTo: "bairro",
        nextState: "PHONE_CONTACT"
      }
    },

    PHONE_CONTACT: {
      messages: [
        "Estamos quase lá! Qual o seu número de telefone com DDD para que as empresas possam te contatar?"
      ],
      interaction: {
        type: "text",
        inputType: "tel",
        validation: (input) => /^\(?[1-9]{2}\)? ?9?[0-9]{4,5}-?[0-9]{4}$/.test(input),
        errorMsg: "O formato do telefone parece inválido. Tente algo como (11) 98888-7777.",
        saveTo: "telefone",
        nextState: "PROFESSIONAL_SUMMARY"
      }
    },

    PROFESSIONAL_SUMMARY: {
      messages: [
        "Para finalizar, fale um pouco sobre você. Pode ser sobre suas experiências, o que gosta de fazer ou no que você é bom. Isso ajuda muito as empresas a te conhecerem melhor!"
      ],
      interaction: {
        type: "text",
        saveTo: "resumo",
        nextState: "FINAL_PREVIEW"
      }
    },

    FINAL_PREVIEW: {
      messages: [
        "Prontinho, {nome}! Com base no que conversamos, preparei uma prévia do seu currículo. Veja como ficou:"
      ],
      interaction: null
    },

    EXIT: {
      messages: [
        "Compreendemos. Por questões de segurança e privacidade (LGPD), não podemos prosseguir sem o seu aceite.",
        "Caso mude de ideia, o PRECISA-SE estará aqui para te ajudar a encontrar oportunidades locais quando desejar. Tudo de bom!"
      ],
      interaction: null // Ends the flow
    }
  }
};