# Deep-Think - Crisis Decision Training Simulator

A fully open-source, web-based crisis decision training simulator that helps users develop rapid decision-making skills under high-stakes, chaotic conditions.

## Features

- **Realistic Crisis Scenarios**: AI-generated scenarios across various domains (cybersecurity, healthcare, aerospace, etc.)
- **Branching Decision Paths**: Each choice leads to different narrative outcomes
- **Real-time Feedback**: Comprehensive scoring and learning resources
- **Interactive Visualizations**: Decision trees and outcome timelines using D3.js
- **Progress Tracking**: Monitor improvement over time
- **Modular Scenarios**: Domain experts can contribute new scenarios

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **AI Integration**: Google Gemini API
- **Visualizations**: D3.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd deep-think
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `GEMINI_API_KEY`: Your Google Gemini API key

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── scenario/          # Scenario interface
│   ├── history/           # Training history
│   └── contribute/        # Scenario contribution
├── components/            # Reusable React components
│   ├── ui/               # Basic UI components
│   └── visualizations/   # D3.js visualization components
└── lib/                  # Utility libraries
    ├── scenario-engine/  # Scenario state machine
    ├── ai-generator/     # Gemini API integration
    ├── scoring/          # Decision scoring system
    └── auth/             # Authentication utilities
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

This project follows a spec-driven development approach. See the `.kiro/specs/deep-think/` directory for detailed requirements, design, and implementation tasks.

## License

MIT License - see LICENSE file for details.