## Project Overview

## Key Components
- config/ - Configuration outside the code
- src/ - Structure source with modular logic
- data/ - Organized repository for various data types
- examples/ - Implementations for guidance
- notebooks - Interactive exploration and analysis

## Structure Folders
src/
├── core/                # Global configuration, logging, security, non-domain helpers
├── api/                 # Presentation layer: routers, deps, middleware, schema adapters
│   ├── v1/              #   - Endpoints theo version
│   └── middleware/      #   - CORS, rate limiting, tracing
├── domain/              # Pure business objects: ORM models, Pydantic schemas, enums
├── repositories/        # CRUD DB & vector stores, tách hẳn infra
├── services/            # Use-cases; repo + llm + worker combination
├── llm/                 # Prompt templates, embeddings, token_counter, model adapters
├── agents/              # LangGraph / crew-ai multi-step agent graphs
├── workers/             # Celery/RQ jobs (async jobs, scheduled tasks)
├── infrastructure/      # Kết nối DB, Redis, vectorstore, external APIs
└── utils/               # Extremely small general helper (telemetry, small string utils)


## Getting Started
1. Clone the repo 
2. Install via requirements.txt
3. Set up model configs
4. Check sample code
5. Begin in notebooks

## Core Files
- requirements.txt - Package dependencies
- README.md - Project overview and usage
- Dockerfile - Container build instructions

## GitHub - Healer