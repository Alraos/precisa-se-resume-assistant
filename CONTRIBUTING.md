Contributing to PRECISA-SE Resume Assistant
Welcome! We are excited that you want to help us connect People to local opportunities. This project is a living laboratory, and your contribution—whether as a student, researcher, or developer—is essential.
🛡️ Strict Business Rules (No Exceptions)
To maintain our humanized and community-focused essence, you must follow these rules in any contribution:
Terminology: Never use the terms "candidate" or "user". Always use "Pessoa" (Person) in variables, comments, and UI strings (e.g., pessoaData, mensagemPessoa). The term "Pessoa" must remain in Portuguese even in English documentation to prioritize humanization.
Privacy (LGPD): All data collection must comply with the Brazilian General Data Protection Law (Law No. 13.709/2018). Sensitive data (CPF, precise address) must never be requested in the conversational flow.
Tone of Voice: The assistant must be welcoming, empathetic, and follow the motto: "O que te ajudaria hoje?" (What would help you today?).
🌍 Multi-language Support & Creation Incentive
We aim to be a global tool. If you want to contribute in your native language, please follow our structure:
Existing Languages: Check docs/prompts/[language-code]/ (e.g., pt-br, en, ja).
Create a New Language: If your language is not there, you are encouraged to create it!
Create a new folder using the ISO 639-1 standard (two letters).
Translate the Stage 0 (Gatekeeper) first to set the local tone.
Open a Pull Request with your new folder.
🧠 How Can You Help?
1. Prompt Engineering (Intelligence)
Help us refine the AI's "brain" in the docs/prompts/ subfolders:
Accessibility (PCD): Refine Stage 4 prompts to be more inclusive for neurodivergent people.1
Local Slang: Suggest regional terms or local professions for the skills examples in Stage 8.2
Trust Building: Improve the copy for requesting contacts (Stage 6) to increase trust.3
2. Manual Testing (Architect Test)
Before submitting a change, validate the prompt in an LLM (like Google Gemini):
Use the base prompt model.
Ensure the AI correctly handles "Generalizations" (e.g., "Any shift is fine").
Crucial: The output must be a Strict JSON format.
3. UI/UX Development
Improve the "Hybrid Interface" where the AI invites the Pessoa to interact with buttons and checkboxes for structured data (like Education Level).4
🚀 Pull Request Process
Fork the repository.
Branch: Create feature/your-contribution.
Standards: Use kebab-case for technical filenames.
Content: Ensure UI strings for the Pessoa are in the target folder's language, but technical documentation remains in English.
