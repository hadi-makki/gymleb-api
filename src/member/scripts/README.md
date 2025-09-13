# Training Programs Schema Migration

This directory contains scripts to migrate training program data from the old schema to the new schema.

## Schema Changes

### Old Schema

```typescript
{
  name: string;
  sets: number;        // Number of sets
  reps: number;        // Reps per set (same for all sets)
  weight?: number;     // Weight per set (same for all sets)
}
```

### New Schema

```typescript
{
  name: string;
  sets: {
    reps: number;
    weight?: number;
  }[];  // Array of individual sets
}
```

## Migration Process

The migration converts old data as follows:

- If an exercise had `sets: 3, reps: 10, weight: 50`, it becomes:
  ```typescript
  {
    name: "Exercise Name",
    sets: [
      { reps: 10, weight: 50 },
      { reps: 10, weight: 50 },
      { reps: 10, weight: 50 }
    ]
  }
  ```

## Running the Migration

### Option 1: Automatic Migration (Recommended)

The migration runs automatically when the application starts via the `MemberTrainingProgramSeed` class.

### Option 2: Manual Migration Script

Run the standalone migration script:

```bash
npm run migrate:training-programs
```

This will:

1. Connect to the database
2. Find all training programs
3. Convert old schema data to new schema
4. Update the database
5. Provide detailed logging of the process

## Migration Safety

- The migration is **idempotent** - it can be run multiple times safely
- Programs already in the new schema are skipped
- The migration preserves all existing data
- Detailed logging shows exactly what was migrated

## Rollback

If you need to rollback, you would need to:

1. Restore from a database backup taken before the migration
2. Or create a reverse migration script (not provided)

## Verification

After migration, verify the data by:

1. Checking the application logs for migration success messages
2. Testing the training program functionality in the UI
3. Verifying that exercises show individual sets with reps/weights
