# Training Programs Scripts

This directory contains scripts for training program management, including schema migration and default program generation.

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

---

# Default Training Programs Generation

This feature allows you to generate default training programs for members based on the predefined program keys.

## Program Keys

The system supports the following program keys:

- `traps` - Traps Training
- `chest` - Chest Training
- `shoulders` - Shoulders Training
- `back` - Back Training
- `biceps` - Biceps Training
- `triceps` - Triceps Training
- `legs` - Legs Training
- `abs` - Abs Training

## Default Programs

Each program key has a predefined set of exercises with appropriate sets and reps:

### Example: Chest Training

```typescript
{
  name: "Chest Training",
  exercises: [
    {
      name: "Bench Press",
      sets: [
        { reps: 12, weight: undefined },
        { reps: 10, weight: undefined },
        { reps: 8, weight: undefined }
      ]
    },
    {
      name: "Incline Dumbbell Press",
      sets: [
        { reps: 12, weight: undefined },
        { reps: 10, weight: undefined }
      ]
    },
    {
      name: "Push-ups",
      sets: [
        { reps: 15, weight: undefined },
        { reps: 12, weight: undefined }
      ]
    }
  ]
}
```

## Running the Generation

### Option 1: Generate for All Members

```bash
npm run generate:default-training-programs
```

This will:

1. Find all members in the database
2. Check which program keys are missing for each member
3. Generate default programs for missing keys only
4. Save the new programs to the database
5. Provide detailed logging

### Option 2: Generate for a Specific Member

```bash
npm run generate:default-training-programs-for-member <memberId>
```

Example:

```bash
npm run generate:default-training-programs-for-member 123e4567-e89b-12d3-a456-426614174000
```

### Option 3: API Endpoints

#### Manager Endpoint

```http
POST /member-training-program/manager/:gymId/:memberId/generate-defaults
```

#### Member Endpoint

```http
POST /member-training-program/member/:gymId/generate-defaults
```

## Generation Safety

- The generation is **idempotent** - it only creates missing programs
- Existing programs are never overwritten
- Members with all programs already present are skipped
- Detailed logging shows exactly what was generated

## Automatic Generation

You can enable automatic generation by uncommenting the line in `MemberTrainingProgramSeed.onModuleInit()`:

```typescript
async onModuleInit() {
  // await this.generateDefaultTrainingPrograms();
}
```

This will run the generation automatically when the application starts.

## Verification

After generation, verify the data by:

1. Checking the application logs for generation success messages
2. Testing the training program functionality in the UI
3. Verifying that all program keys are available for members
4. Checking that default exercises are properly populated
