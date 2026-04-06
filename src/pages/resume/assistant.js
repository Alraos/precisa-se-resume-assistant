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

// src/pages/resume/assistant.js
import { resumeData, resumeFlow } from './flow.js';

/**
 * MODULE: Resume Assistant (PRECISA-SE)
 * Guidelines: LGPD (Law No. 13.709/2018) and Strict Nomenclature ("Pessoa").
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = import.meta.env.VITE_GEMINI_URL || `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// DOM Elements (Synchronized with resume.html)
const chatContainer = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const inputPessoa = document.getElementById('input-pessoa');
const btnEnviar = document.getElementById('btn-enviar');

// Conversation Memory for Gatekeeper
let historicoConversa = []; // Used for Gemini context

// In-Memory Prompt Cache (Latency Optimization)
const promptCache = {};

// Global state for the flow
let currentPessoaState = "START";

/**
 * Replaces placeholders like {nome} in messages.
 * @param {string} text 
 * @returns {string}
 */
function formatMessage(text) {
    return text.replace(/{nome}/g, resumeData.nome || 'pessoa');
}

async function carregarPromptDeArquivo(nomeFicheiro) {
    if (promptCache[nomeFicheiro]) return promptCache[nomeFicheiro];
    
    const url = `./docs/ai-prompts/${nomeFicheiro}`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Failed to load prompt: ${nomeFicheiro}`);
    
    const promptText = await resposta.text();
    promptCache[nomeFicheiro] = promptText;
    return promptText;
}

// Initialization: Static LGPD message (Gatekeeper Rule)
document.addEventListener('DOMContentLoaded', () => {
    renderCurrentState();
    inputPessoa.focus();
});

// Submit listener (form or click)
chatForm.addEventListener('submit', (evento) => {
    evento.preventDefault();
    processarEntradaPessoa();
});

/**
 * Manages the text input from the person and decides the next step in the flow.
 */
async function processarEntradaPessoa(buttonValue = null) {
    const textoOriginal = inputPessoa.value.trim();

    const state = resumeFlow.states[currentPessoaState];
    if (!state) {
        console.error("Unknown flow state:", currentPessoaState);
        return;
    }

    if (state.interaction.type === "buttons") {
        // This path is for button interactions, handled by renderButtons directly
        // The button click handler will call handleButtonInteraction
        return;
    }

    if (state.interaction.type === "checkbox") {
        // This path is for checkbox interactions, handled by renderCheckboxes directly
        return;
    }

    // For text input, ensure there's actual text
    if (!textoOriginal && state.interaction.type === "text") {
        return;
    }

    // Display person input for text interactions
    if (state.interaction.type === "text") {
        injetarConversaNaTela(textoOriginal, true);
        inputPessoa.value = '';
        congelarCampoTextoDaPessoa();
    }

    // Special handling for initial name collection (LGPD Gatekeeper)
    // This is still outside the state machine for now, as it involves Gemini validation.
    // The 'START' state is handled by buttons, 'COLLECT_NAME' is the first text input.
    if (currentPessoaState === "COLLECT_NAME") {
        await validarNomeComGemini(textoOriginal);
        return;
    }

    // Handle text input interaction
    if (state.interaction.type === "text") {
        const validationResult = state.interaction.validation ? state.interaction.validation(textoOriginal) : true;
        if (!validationResult) {
            injetarConversaNaTela(state.interaction.errorMsg || "Entrada inválida.", false);
            liberarCampoTextoDaPessoa();
            return;
        }

        if (state.interaction.saveTo) {
            resumeData[state.interaction.saveTo] = textoOriginal;
        }

        // Transition to next state
        currentPessoaState = state.interaction.nextState;
        renderCurrentState();
    } else {
        // If it's not a text input state, something is wrong or it's a button/checkbox state
        // where text input is not expected.
        injetarConversaNaTela("Por favor, use as opções fornecidas ou aguarde a próxima pergunta.", false);
        liberarCampoTextoDaPessoa();
    }
}

// Function to handle button interactions (called by renderButtons)
function handleButtonInteraction(value, action, nextState) {
    const state = resumeFlow.states[currentPessoaState];
    if (state.interaction.saveTo) {
        resumeData[state.interaction.saveTo] = value;
    }

    // Execute action if provided
    if (action) {
        action(resumeData); // Pass resumeData to the action function
    }

    // Display person's choice
    const optionLabel = resumeFlow.states[currentPessoaState].interaction.options.find(opt => opt.value === value)?.label;
    if (optionLabel) {
        injetarConversaNaTela(optionLabel, true);
    }

    // Transition to next state
    currentPessoaState = nextState;
    renderCurrentState();
}

/**
 * SEMANTIC VALIDATOR AGENT (GATEKEEPER - STEP 0)
 * Evaluates LGPD acceptance and extracts name via Gemini (Strict JSON output)
 */
async function validarNomeComGemini(textoDaPessoa) { // This is for COLLECT_NAME state
    injetarAguardeDigitacao();

    // Adds the person's speech to the history (Memory)
    historicoConversa.push({ role: "user", parts: [{ text: textoDaPessoa }] });

    let systemPromptBase = "";
    try {
        systemPromptBase = await carregarPromptDeArquivo('00-gatekeeper-lgpd.md');
    } catch (e) {
        console.error("Failed to load Gatekeeper manifest", e);
        systemPromptBase = 'Atue como Gatekeeper LGPD rigoroso. Avalie a resposta da pessoa.';
    }

    const systemPrompt = `
        DOCUMENTO DE GOVERNANÇA (DIRETRIZ DE PROMPT):
        ${systemPromptBase}
        
        ---------------------
        COMANDO ESTRITO DO SISTEMA MOTOR:
        Você DEVE retornar UM JSON válido e estrito conforme o esquema abaixo (sem formatar como markdown na string, apenas o JSON puro).
        A chave "avancar" só deve ser true se a pessoa der aceite inequívoco à LGPD E informar um primeiro nome válido.
        Se a pessoa fizer alguma pergunta, explique a governança, não avance (false).
        {
          "avancar": boolean,
          "dado_extraido": "string | null", 
          "dados_extras_buffer": "object | null", 
          "resposta_ia": "string"
        }
    `;

    try {
        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: historicoConversa,
            generationConfig: {
                responseMimeType: "application/json" // Native JSON Mitigation
            }
        };

        const respostaFetch = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const dados = await respostaFetch.json();
        
        if (!respostaFetch.ok) throw new Error(dados.error?.message || "Gemini API Error (Gatekeeper)");

        const jsonRespostaText = dados.candidates[0].content.parts[0].text;
        const analise = JSON.parse(jsonRespostaText);

        // Adds the AI response to the history
        historicoConversa.push({ role: "model", parts: [{ text: jsonRespostaText }] });

        removerAguardeDigitacao();

        if (analise.avancar && analise.dado_extraido) {
            // Success: Accepted LGPD and provided name
            injetarConversaNaTela(analise.resposta_ia, false);
            resumeData.nome = analise.dado_extraido;
            
            // Transition to the next state after name collection
            const state = resumeFlow.states[currentPessoaState];
            currentPessoaState = state.interaction.nextState; // Should be AGE_COLLECTION
            renderCurrentState();

            liberarCampoTextoDaPessoa();
        } else {
            // Refusal, doubt, or intercepted injection
            injetarConversaNaTela(analise.resposta_ia, false);
            liberarCampoTextoDaPessoa();
        }

    } catch (erro) {
        // Mitigation F: Resilience
        console.error("Resilience Failure in Gatekeeper:", erro);
        removerAguardeDigitacao();
        injetarConversaNaTela("Tivemos uma leve oscilação na nossa conexão local. Poderia repetir o que disse, por favor?", false);
        historicoConversa.pop(); // Removes the failed attempt from history
        liberarCampoTextoDaPessoa();
    }
}

// --- Premium UI Injection Functions ---

function injetarConversaNaTela(texto, isPessoa = false) {
    const msgDiv = document.createElement('div');
    const corBg = isPessoa ? 'bg-indigo-600 text-white rounded-tr-none self-end' : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-none self-start';
    msgDiv.className = `max-w-[85%] p-4 rounded-2xl ${corBg} break-words whitespace-pre-wrap text-sm md:text-base mb-5 animate-fade-in flex flex-col`;
    msgDiv.textContent = texto;
    
    const wrapper = document.createElement('div');
    wrapper.className = `flex flex-col w-full ${isPessoa ? 'items-end' : 'items-start'}`;
    wrapper.appendChild(msgDiv);
    
    chatContainer.appendChild(wrapper);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

function renderizarPreviaFinal() {
    const cardResumo = document.createElement('div');
    cardResumo.className = "bg-white p-7 rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.15)] border border-gray-100 w-full max-w-[420px] self-center my-8 animate-slide-up flex flex-col";
    
    const pcdSection = resumeData.isPCD ? `
        <div class="mb-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
            <span class="text-[10px] text-indigo-500 font-black uppercase tracking-widest block mb-2">Acessibilidade / PCD</span>
            <div class="flex flex-wrap gap-2">
                ${resumeData.tiposDeficiencia.map(t => `<span class="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">${t}</span>`).join('')}
            </div>
        </div>
    ` : '';

    cardResumo.innerHTML = `
        <header class="border-b border-gray-50 pb-5 mb-6">
            <h2 class="text-2xl font-black text-gray-900 leading-tight">Currículo <span class="text-indigo-600">Digital</span></h2>
            <p class="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest underline decoration-indigo-400 underline-offset-4">Visualização Antecipada</p>
        </header>

        <section class="space-y-6">
            <div>
                <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Nome Completo</span>
                <p class="text-lg font-extrabold text-gray-800">${resumeData.nome}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Idade</span>
                    <p class="text-gray-700 text-sm font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">${resumeData.idade}</p>
                </div>
                <div>
                    <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Escolaridade</span>
                    <p class="text-gray-700 text-sm font-bold bg-gray-50 p-3 rounded-xl border border-gray-100 break-words">${resumeData.escolaridade}</p>
                </div>
            </div>

            <div>
                <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Área de Atuação</span>
                <p class="text-gray-700 text-sm font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">${resumeData.areaAtuacao}</p>
            </div>

            <div class="grid grid-cols-1 gap-2 border-y border-gray-50 py-4 my-2">
                <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest block w-full">Local & Contacto</span>
                <p class="text-gray-700 text-sm flex items-center gap-2">📍 <b>Bairro:</b> ${resumeData.bairro}</p>
                <p class="text-gray-700 text-sm flex items-center gap-2">📱 <b>Tel:</b> ${resumeData.telefone}</p>
                ${resumeData.email && !resumeData.email.includes('não') ? `<p class="text-gray-700 text-sm flex items-center gap-2">✉️ <b>Email:</b> ${resumeData.email}</p>` : ''}
            </div>

            ${pcdSection}

            <div>
                <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-2">Resumo Profissional</span>
                <p class="text-gray-600 text-sm italic leading-relaxed bg-blue-50/30 p-4 rounded-3xl border-l-4 border-indigo-500">${resumeData.resumo}</p>
            </div>
        </section>

        <footer class="mt-8 space-y-3">
            <button id="finalizar-btn" class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition active:scale-95">Ficou ótimo, avançar</button>
            <button onclick="location.reload()" class="w-full bg-white text-gray-400 font-bold py-3 text-sm hover:text-gray-600 transition">Quero editar informações</button>
        </footer>
    `;

    // Clears the chat and shows only the final card
    chatContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.appendChild(cardResumo);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });

    document.getElementById('finalizar-btn').addEventListener('click', () => {
        alert("Excelente! Seu perfil profissional foi gerado e agora podemos seguir para o registo final. (Firebase integration incoming!)");
    });
}

// Control Helpers
function injetarAguardeDigitacao() {
    const digitando = document.createElement('div');
    digitando.id = 'typing-indicator';
    digitando.className = "text-[10px] text-gray-400 font-bold animate-pulse mb-6 ml-1 uppercase tracking-tighter";
    digitando.textContent = "O assistente está a escrever...";
    chatContainer.appendChild(digitando);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

function removerAguardeDigitacao() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function congelarCampoTextoDaPessoa() {
    inputPessoa.disabled = true;
    btnEnviar.disabled = true;
    inputPessoa.classList.add('opacity-50');
}

function liberarCampoTextoDaPessoa() {
    inputPessoa.disabled = false;
    btnEnviar.disabled = false;
    inputPessoa.classList.remove('opacity-50');
    inputPessoa.focus();
}

// --- Generic UI Functions (controlled by the State Machine) ---

function renderButtons(options) {
    const card = document.createElement('div');
    card.className = "bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 w-full md:max-w-[85%] my-4 animate-scale-up";

    const state = resumeFlow.states[currentPessoaState];
    const title = state.interaction.title || 'Escolha uma opção:';

    card.innerHTML = `
        <h4 class="text-indigo-800 font-extrabold mb-4 text-sm uppercase tracking-wider">${title}</h4>
        <div class="space-y-3 mb-2 flex flex-col">
            ${options.map(option => `
                <button type="button" class="btn-flow-option bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold py-3 px-4 rounded-xl shadow-sm transition-all border border-indigo-100 text-left w-full" 
                        data-value="${option.value}" 
                        data-next-state="${option.nextState}">
                    ${option.label}
                </button>
            `).join('')}
        </div>
    `;
    
    chatContainer.appendChild(card);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });

    document.querySelectorAll('.btn-flow-option').forEach(btn => {
        btn.addEventListener('click', (evento) => {
            const value = evento.target.getAttribute('data-value');
            const nextState = evento.target.getAttribute('data-next-state');
            
            // Find the action in the original options array
            const option = options.find(opt => opt.value === value);
            const action = option ? option.action : null;

            // Freeze the card visually
            card.classList.add('opacity-50', 'pointer-events-none');
            
            // Style the clicked button
            evento.target.classList.replace('bg-indigo-50', 'bg-indigo-600');
            evento.target.classList.replace('text-indigo-700', 'text-white');
            
            handleButtonInteraction(value, action, nextState);
        });
    });
}

function renderCheckboxes(options) {
    const card = document.createElement('div');
    card.className = "bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 w-full md:max-w-[85%] my-4 animate-scale-up";
    
    const state = resumeFlow.states[currentPessoaState];
    const title = state.interaction.title || 'Selecione as opções:';

    card.innerHTML = `
        <h4 class="text-indigo-800 font-extrabold mb-4 text-sm uppercase tracking-wider">${title}</h4>
        <div class="space-y-3 mb-6">
            ${options.map(option => `
                <label class="flex items-center space-x-3 cursor-pointer p-3 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100">
                    <input type="checkbox" value="${option.value}" class="cb-flow-option w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                    <span class="text-gray-700 font-medium">${option.label}</span>
                </label>
            `).join('')}
        </div>
        <button id="confirm-flow-options" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95">Confirmar Seleções</button>
    `;
    
    chatContainer.appendChild(card);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });

    document.getElementById('confirm-flow-options').addEventListener('click', () => {
        const selectedItems = Array.from(document.querySelectorAll('.cb-flow-option:checked')).map(cb => cb.value);
        if (selectedItems.length === 0) {
            alert("Por favor, selecione pelo menos uma opção para prosseguirmos.");
            return;
        }

        if (state.interaction.saveTo) {
            resumeData[state.interaction.saveTo] = selectedItems;
        }
        
        card.classList.add('opacity-50', 'pointer-events-none');
        injetarConversaNaTela(`Ok, selecionei: ${selectedItems.join(', ')}.`, true);
        
        currentPessoaState = state.interaction.nextState;
        renderCurrentState();
    });
}

// Function to render the current state messages and interaction
async function renderCurrentState() {
    if (currentPessoaState === 'FINAL_PREVIEW') {
        injetarConversaNaTela(formatMessage(resumeFlow.states.FINAL_PREVIEW.messages[0]), false);
        renderizarPreviaFinal();
        congelarCampoTextoDaPessoa();
        return;
    }

    const state = resumeFlow.states[currentPessoaState];
    if (!state) {
        console.error("Unknown flow state:", currentPessoaState);
        return;
    }

    removerAguardeDigitacao();

    // Display messages
    for (const msg of state.messages) {
        injetarConversaNaTela(formatMessage(msg), false);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate typing delay
    }

    // Handle interaction
    if (state.interaction) {
        switch (state.interaction.type) {
            case "buttons":
                renderButtons(state.interaction.options);
                congelarCampoTextoDaPessoa();
                break;
            case "text":
                liberarCampoTextoDaPessoa();
                inputPessoa.type = state.interaction.inputType || 'text';
                break;
            case "checkbox":
                renderCheckboxes(state.interaction.options);
                congelarCampoTextoDaPessoa();
                break;
            default:
                liberarCampoTextoDaPessoa();
        }
    } else {
        congelarCampoTextoDaPessoa(); // No interaction, likely an EXIT state
    }
}
