# sophron-bot

A philosophical debate bot powered by OpenAI that engages users in structured logical arguments. sophron-bot helps users develop critical thinking skills through rigorous debate and argument analysis.

## Features

### Core Functionality
- **Philosophical Debates**: Engage with an AI trained in logical reasoning
- **Predefined Topics**: Quick-start debates on classic philosophical questions
- **Multiple Debate Styles**: Choose from Socratic method, Formal Logic, or Devil's Advocate approaches

### Advanced Features
- **🆕 Steel-Manning Mode**: Bot first helps strengthen your argument before debating it
- **Fallacy Detection**: Real-time identification of logical fallacies in arguments
- **Structured Reasoning**: Responses use formal logical structures and reference major philosophical positions

## Steel-Manning Mode

This unique feature helps users develop stronger arguments by:
1. Analyzing claims for weak points and missing premises
2. Suggesting more precise formulations
3. Recommending supporting evidence
4. Then switching to debate the strengthened argument

See [STEEL_MANNING_FEATURE.md](./STEEL_MANNING_FEATURE.md) for detailed documentation.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sophron-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp example.env .env
   
   # Edit .env and add your OpenAI API key
   # OPENAI_API_KEY=your_actual_api_key_here
   ```

4. **Start the application**
   ```bash
   # This runs both frontend and backend concurrently
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/api/health

### Development Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run client` - Start only the frontend (Vite dev server)
- `npm run server` - Start only the backend (Express server)
- `npm run build` - Build the frontend for production
- `npm run lint` - Run ESLint

## Architecture

### Frontend
- **React** with Vite for fast development
- **Tailwind CSS + DaisyUI** for styling
- **React Markdown** for formatted chat responses

### Backend
- **Express.js** server for API endpoints
- **OpenAI API integration** with secure key handling
- **CORS enabled** for frontend communication

### Security
- API keys are stored server-side only
- Environment variables for configuration
- No sensitive data exposed to the browser

## API Endpoints

- `POST /api/chat` - Send chat messages and receive AI responses
- `GET /api/health` - Server health check
- `GET /` - API information

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + DaisyUI
- **Backend**: Express.js + Node.js
- **AI**: OpenAI GPT-4o-mini
- **Development**: Nodemon + Concurrently for hot reloading
