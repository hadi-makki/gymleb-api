import { OnModuleInit } from '@nestjs/common';
import {
  MemberTrainingProgramEntity,
  ProgramKey,
} from '../entities/member-training-program.entity';
import { MemberEntity, WelcomeMessageStatus } from '../entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlyReminderStatus } from 'src/transactions/transaction.entity';

export class MemberTrainingProgramSeed implements OnModuleInit {
  constructor(
    @InjectRepository(MemberTrainingProgramEntity)
    private readonly memberTrainingProgramRepository: Repository<MemberTrainingProgramEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async onModuleInit() {}

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

  async generateDefaultTrainingPrograms() {
    console.log('Starting default training programs generation...');

    // Get all members
    const members = await this.memberRepository.find({
      relations: ['trainingPrograms'],
    });

    if (members.length === 0) {
      console.log('No members found to generate training programs for.');
      return;
    }

    let generatedCount = 0;
    const programKeys = Object.values(ProgramKey);

    for (const member of members) {
      // Get existing program keys for this member
      const existingProgramKeys =
        member.trainingPrograms?.map((program) => program.programKey) || [];

      // Find missing program keys
      const missingProgramKeys = programKeys.filter(
        (key) => !existingProgramKeys.includes(key),
      );

      if (missingProgramKeys.length === 0) {
        console.log(
          `Member ${member.name} (ID: ${member.id}) already has all training programs.`,
        );
        continue;
      }

      // Generate default training programs for missing keys
      const newPrograms = missingProgramKeys.map((programKey) => {
        return this.memberTrainingProgramRepository.create({
          member: member,
          programKey: programKey,
          name: programKey,
          exercises: [],
        });
      });

      // Save the new programs
      await this.memberTrainingProgramRepository.save(newPrograms);
      generatedCount += newPrograms.length;

      console.log(
        `Generated ${newPrograms.length} training programs for member ${member.name} (ID: ${member.id})`,
      );
    }

    console.log(
      `Default training programs generation completed. ${generatedCount} programs generated for ${members.length} members.`,
    );
  }

  async generateDefaultTrainingProgramsForMember(memberId: string) {
    console.log(
      `Generating default training programs for member ID: ${memberId}`,
    );

    // Get the specific member
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['trainingPrograms'],
    });

    if (!member) {
      console.log(`Member with ID ${memberId} not found.`);
      return;
    }

    // Get existing program keys for this member
    const existingProgramKeys =
      member.trainingPrograms?.map((program) => program.programKey) || [];

    // Find missing program keys
    const programKeys = Object.values(ProgramKey);
    const missingProgramKeys = programKeys.filter(
      (key) => !existingProgramKeys.includes(key),
    );

    if (missingProgramKeys.length === 0) {
      console.log(
        `Member ${member.name} (ID: ${member.id}) already has all training programs.`,
      );
      return;
    }

    // Generate default training programs for missing keys
    const newPrograms = missingProgramKeys.map((programKey) => {
      return this.memberTrainingProgramRepository.create({
        member: member,
        programKey: programKey,
        name: programKey,
        exercises: [],
      });
    });

    // Save the new programs
    await this.memberTrainingProgramRepository.save(newPrograms);

    console.log(
      `Generated ${newPrograms.length} training programs for member ${member.name} (ID: ${member.id})`,
    );

    return newPrograms;
  }
}
