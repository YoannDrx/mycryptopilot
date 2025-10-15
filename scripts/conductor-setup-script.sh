#!/bin/bash

# Conductor setup script for MyCryptoPilot
# Runs when a workspace is created. Used for copying .env files and installing dependencies.

set -e

# Get the workspace name from environment variable
WORKSPACE_NAME="${CONDUCTOR_WORKSPACE_NAME}"

# Ensure workspace name is provided
if [ -z "$WORKSPACE_NAME" ]; then
    echo "Error: CONDUCTOR_WORKSPACE_NAME is not set"
    exit 1
fi

echo "Setting up MyCryptoPilot workspace: $WORKSPACE_NAME"

# Function to copy and update .env file with database URL replacement
update_env_file() {
    local env_path=$1
    local root_env_path="$CONDUCTOR_ROOT_PATH/$env_path"

    if [ -f "$root_env_path" ]; then
        cp "$root_env_path" "$env_path"
        echo "✅ Copied $env_path"

        # Update database URLs with workspace-specific names
        if grep -q "^DATABASE_URL=" "$env_path"; then
            NEW_DB_NAME="mycryptopilot-$WORKSPACE_NAME"

            # Update main database URL
            sed -i.bak "s|^DATABASE_URL=\"postgresql://yoannandrieux:@localhost:5432/mycryptopilot\"|DATABASE_URL=\"postgresql://yoannandrieux:@localhost:5432/$NEW_DB_NAME\"|" "$env_path"

            # Update unpooled database URL if it exists
            if grep -q "^DATABASE_URL_UNPOOLED=" "$env_path"; then
                sed -i.bak "s|^DATABASE_URL_UNPOOLED=\"postgresql://yoannandrieux:@localhost:5432/mycryptopilot\"|DATABASE_URL_UNPOOLED=\"postgresql://yoannandrieux:@localhost:5432/$NEW_DB_NAME\"|" "$env_path"
            fi

            echo "✅ Updated DATABASE_URLs in $env_path to use: $NEW_DB_NAME"
            rm -f "$env_path.bak"
        fi
    else
        echo "⚠️  Warning: $root_env_path not found"
    fi
}

# Copy and update .env files
echo "Copying .env files..."

# Update main .env file
update_env_file ".env"

# Copy .env-template if it exists
if [ -f "$CONDUCTOR_ROOT_PATH/.env-template" ]; then
    cp "$CONDUCTOR_ROOT_PATH/.env-template" ".env-template"
    echo "✅ Copied .env-template"
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

# Create the new database
NEW_DB_NAME="mycryptopilot-$WORKSPACE_NAME"

echo "Creating database: $NEW_DB_NAME"
createdb -h localhost -p 5432 -U yoannandrieux "$NEW_DB_NAME"

# Dump original database and import to new one
echo "Copying data from original database..."
ORIGINAL_DB="mycryptopilot"

# Check if original database exists and copy data
if psql -h localhost -p 5432 -U yoannandrieux -lqt | cut -d \| -f 1 | grep -qw "$ORIGINAL_DB"; then
    echo "Found original database '$ORIGINAL_DB', copying data..."

    # Dump original database and pipe directly to new database
    pg_dump -h localhost -p 5432 -U yoannandrieux --no-owner --no-privileges "$ORIGINAL_DB" | psql -h localhost -p 5432 -U yoannandrieux "$NEW_DB_NAME"

    echo "✅ Data copied from '$ORIGINAL_DB' to '$NEW_DB_NAME'"
else
    echo "⚠️  Original database '$ORIGINAL_DB' not found, running migrations instead..."
    # Run database migrations if no original database to copy from
    pnpm prisma migrate deploy
fi

echo "🎉 MyCryptoPilot workspace '$WORKSPACE_NAME' setup completed successfully!"
echo "Database: $NEW_DB_NAME"
echo "Ready to start development with: pnpm dev"