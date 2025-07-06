#!/bin/bash

echo "Creating initial migration..."

# Create alembic directory if not exists
if [ ! -d "alembic" ]; then
    docker compose exec api alembic init alembic
fi

# Create initial migration
docker compose exec api alembic revision --autogenerate -m "Initial tables"

echo "Migration created. Running upgrade..."
docker compose exec api alembic upgrade head

echo "✅ Migration complete!"