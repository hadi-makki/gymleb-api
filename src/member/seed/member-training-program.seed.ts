import { OnModuleInit } from '@nestjs/common';
import { MemberTrainingProgramEntity } from '../entities/member-training-program.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class MemberTrainingProgramSeed implements OnModuleInit {
  constructor(
    @InjectRepository(MemberTrainingProgramEntity)
    private readonly memberTrainingProgramRepository: Repository<MemberTrainingProgramEntity>,
  ) {}

  async onModuleInit() {
    // await this.migrateTrainingProgramsSchema();
  }

  async migrateTrainingProgramsSchema() {
    console.log('Starting training programs schema migration...');

    const memberTrainingPrograms =
      await this.memberTrainingProgramRepository.find();

    if (memberTrainingPrograms.length === 0) {
      console.log('No training programs found to migrate.');
      return;
    }

    let migratedCount = 0;

    for (const program of memberTrainingPrograms) {
      let needsUpdate = false;
      const updatedExercises = program.exercises.map((exercise) => {
        // Check if this exercise is using the old schema (has reps/weight at exercise level)
        if (exercise.reps !== undefined || exercise.weight !== undefined) {
          needsUpdate = true;

          // Convert old schema to new schema
          const newSets = [];

          // If sets is a number (old schema), convert it
          if (typeof exercise.sets === 'number') {
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
        await this.memberTrainingProgramRepository.update(program.id, {
          exercises: updatedExercises,
        });
        migratedCount++;
        console.log(
          `Migrated training program: ${program.name} (ID: ${program.id})`,
        );
      }
    }

    console.log(
      `Migration completed. ${migratedCount} training programs migrated.`,
    );
  }
}
