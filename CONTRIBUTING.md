Contributing to PRECISA-SE Resume Assistant
Welcome! We are excited that you want to help us connect People to local opportunities. This project is a living laboratory, and your contribution—whether as a student, researcher, or developer—is essential.
🛡️ Strict Business Rules (No Exceptions)
To maintain our humanized and community-focused essence, you must follow these rules in any contribution:23
Terminology: Never use the terms "candidate" or "user". Always use "Pessoa" (Person) in variables, comments, and UI strings (e.g., pessoaData, mensagemPessoa).24
Privacy (LGPD): All data collection must comply with the Brazilian General Data Protection Law (Law No. 13.709/2018). Sensitive data (CPF, precise address) must never be requested in the conversational flow.25
Tone of Voice: The assistant must be welcoming, empathetic, and follow the motto: "O que te ajudaria hoje?" (What would help you today?).2
🧠 How Can You Help?
1. Prompt Engineering (Intelligence)
Help us refine the AI's "brain" in the docs/prompts/ folder:62
Accessibility (PCD): Refine Stage 4 prompts to be more inclusive for neurodivergent people.37
Local Slang: Suggest regional terms or local professions to be included in the skills examples (Stage 8).8
Trust Building: Improve the copy for requesting contacts (Stage 6) to increase user trust.9
2. Manual Testing (Architect Test)
Before submitting a change to a prompt, follow our Practical Script:23
Use the base prompt model.
Test the logic in an LLM (like Google Gemini).
Validate if the output is a Strict JSON.
Check if the AI correctly handles "Generalizations" (e.g., "Any shift is fine").
3. UI/UX Development
Improve the "Hybrid Interface" where the AI invites the Pessoa to interact with buttons and checkboxes instead of free text for structured data (like Education Level).62
🚀 Pull Request Process
Fork the repository.
Create a branch for your feature (git checkout -b feature/new-prompt-stage).
Follow the i18n standard for technical file names (kebab-case).
Ensure all strings for the Pessoa are in Portuguese (PT-BR).
Submit your Pull Request explaining the impact of your change.1
