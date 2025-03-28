# 🎯 JK - AI-Powered Habit Formation Assistant

JK is a desktop application built with Tauri and SvelteKit that helps people with ADHD build better habits through AI-verified task completion and computer access management.

## 🌟 Key Features

- 🔄 Visual workflow builder for creating daily routines and habits
- 📸 Image-based task verification using local LLaVA AI model
- 🔒 Configurable system access controls based on task completion
- 🚀 Fast and lightweight desktop app built with Tauri
- 🎨 Modern UI with Tailwind CSS and Shadcn components
- 🌙 Dark/Light mode support

## 🤖 AI Integration Details

### Local AI Model Support

- Primary Model: LLaVA (default: llava:7b) for image analysis
- Compatible with any Ollama multimodal models that support image analysis
- Alternative models you can use:
  - `llava:13b` - Larger model, potentially more accurate
  - `bakllava` - Alternative model with similar capabilities

### Image Verification Features

- Real-time task verification through image analysis
- Local processing - all images are analyzed on your machine
- Customizable prompts for different types of tasks
- Fast response times (typically under 2 seconds)
- Privacy-focused: No data leaves your computer

### Customization Options

You can modify the AI integration by:

1. Changing the model in `src/lib/ollama.ts`
2. Adjusting the verification prompt
3. Adding additional analysis parameters
4. Implementing custom verification logic

## 🛠️ Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **Desktop Framework**: Tauri
- **AI Model**: Ollama (LLaVA)
- **Styling**: Tailwind CSS + Shadcn
- **State Management**: Svelte Runes
- **Flow Visualization**: @xyflow/svelte

## 📋 Prerequisites

- Node.js 22+
- Rust toolchain
- [Ollama](https://ollama.ai) installed with LLaVA model
- pnpm (recommended)

## 🚀 Getting Started

1. Clone the repository

```bash
git clone https://github.com/khalilselyan/jk.git
cd jk
```

2. Install dependencies

```bash
pnpm install
```

3. Start Ollama and pull LLaVA model

```bash
ollama pull llava
```

4. Run the development server

```bash
pnpm tauri dev
```

## 📝 Todo List

- [x] Add persistent storage for workflows using Dexie.js
- [x] Add separate workflow canvases for each day of the week (Mon-Sun) with IndexedDB persistence
- [x] Implement system-wide keyboard shortcuts/mouse blocking during locked state (with password fallback)
- [ ] Add notification system for task reminders
- [ ] Create different verification methods beyond image proof (optional for now) -- could be literally emailing friend or messaging on telegram to keep me accountable
- [ ] Add statistics and progress tracking (potential gamification with levels and other stuff to make it more friendly)
- [ ] Add customizable time windows for tasks
- [ ] Create mobile companion app for image uploads
- [ ] Add export/import of workflow templates
- [ ] Implement backup/restore functionality

## 🏗️ Project Structure

The project follows a standard Tauri + SvelteKit structure:

```markdown
/
├── src/ # SvelteKit frontend
│ ├── lib/ # Shared components and utilities
│ ├── routes/ # SvelteKit routes
│ └── app.html # HTML template
├── src-tauri/ # Tauri backend
├── static/ # Static assets
└── build/ # Production build output
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app) for the amazing desktop framework
- [Ollama](https://ollama.ai) for making local AI accessible
- [Shadcn-Svelte](https://www.shadcn-svelte.com/) for the beautiful UI components
- [XYFlow](https://xy.flow) for the workflow visualization

---

Built with ❤️ for the self-diagnosed ADHD person being me (but really anybody who might think this is useful can fork and integrate as needed)
