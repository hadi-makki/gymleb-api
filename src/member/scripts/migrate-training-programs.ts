import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MemberTrainingProgramEntity } from '../entities/member-training-program.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

async function migrateTrainingPrograms() {
  console.log('🚀 Starting training programs schema migration...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const trainingProgramRepository = app.get<
    Repository<MemberTrainingProgramEntity>
  >(getRepositoryToken(MemberTrainingProgramEntity));

  try {
    const memberTrainingPrograms = await trainingProgramRepository.find();

    if (memberTrainingPrograms.length === 0) {
      console.log('✅ No training programs found to migrate.');
      return;
    }

    console.log(
      `📊 Found ${memberTrainingPrograms.length} training programs to check...`,
    );
    let migratedCount = 0;

    for (const program of memberTrainingPrograms) {
      let needsUpdate = false;
      const updatedExercises = program.exercises.map((exercise) => {
        // Check if this exercise is using the old schema (has reps/weight at exercise level)
        if (exercise.reps !== undefined || exercise.weight !== undefined) {
          needsUpdate = true;

          console.log(
            `🔄 Migrating exercise: ${exercise.name} in program: ${program.name}`,
          );

          // Convert old schema to new schema
          const newSets = [];

          // If sets is a number (old schema), convert it
          if (typeof exercise.sets === 'number') {
            console.log(
              `   Converting ${exercise.sets} sets with ${exercise.reps} reps each`,
            );
            // Create sets based on the number
            for (let i = 0; i < exercise.sets; i++) {
              newSets.push({
                reps: exercise.reps || 1,
                weight: exercise.weight,
              });
            }
          } else if (Array.isArray(exercise.sets)) {
            // If sets is already an array, keep it as is
            newSets.push(...exercise.sets);
          } else {
            // Fallback: create a single set with the exercise-level reps/weight
            console.log(`   Creating single set with ${exercise.reps} reps`);
            newSets.push({
              reps: exercise.reps || 1,
              weight: exercise.weight,
            });
          }

          // Return the exercise with new schema (remove old fields)
          return {
            name: exercise.name,
            sets: newSets,
          };
        }

        // Exercise is already in new schema, return as is
        return exercise;
      });

      if (needsUpdate) {
        await trainingProgramRepository.update(program.id, {
          exercises: updatedExercises,
        });
        migratedCount++;
        console.log(
          `✅ Migrated training program: ${program.name} (ID: ${program.id})`,
        );
      } else {
        console.log(
          `⏭️  Skipped training program: ${program.name} (already in new schema)`,
        );
      }
    }

    console.log(
      `🎉 Migration completed! ${migratedCount} training programs migrated.`,
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateTrainingPrograms()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateTrainingPrograms };
