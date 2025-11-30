import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user.entity';
import { Repository } from 'typeorm';
import { OnModuleInit } from '@nestjs/common';
import { MemberEntity } from 'src/member/entities/member.entity';

export class SeedUserMember implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async onModuleInit() {
    await this.seedUsersFromMembers();
  }

  async seedUsersFromMembers() {
    // Get all members
    const members = await this.memberRepository.find({
      where: {},
      relations: ['user'],
    });

    console.log(`Found ${members.length} members to process`);

    // Group members by phone number and phoneNumberISOCode
    const membersByPhone = new Map<string, MemberEntity[]>();

    for (const member of members) {
      // Skip members that already have a user assigned
      if (member.user) {
        continue;
      }

      // Skip members without phone numbers
      if (!member.phone || !member.phoneNumberISOCode) {
        continue;
      }

      // Create a unique key from phone and phoneNumberISOCode
      const phoneKey = `${member.phone}_${member.phoneNumberISOCode}`;

      if (!membersByPhone.has(phoneKey)) {
        membersByPhone.set(phoneKey, []);
      }

      membersByPhone.get(phoneKey)!.push(member);
    }

    console.log(`Found ${membersByPhone.size} unique phone numbers`);

    // Process all groups in parallel
    const results = await Promise.all(
      Array.from(membersByPhone.entries()).map(
        async ([phoneKey, membersWithSamePhone]) => {
          if (membersWithSamePhone.length === 0) {
            return { usersCreated: 0, membersUpdated: 0 };
          }

          // Get the first member's phone info to use for the user
          const firstMember = membersWithSamePhone[0];
          const phone = firstMember.phone!;
          const phoneNumberISOCode = firstMember.phoneNumberISOCode!;

          // Find or create a user with this phone number
          let user = await this.userRepository.findOne({
            where: {
              phone,
              phoneNumberISOCode,
            },
          });

          let usersCreated = 0;
          if (!user) {
            // Create a new user
            // Use the first member's name as the user name, or combine names if multiple
            const userName =
              membersWithSamePhone.length === 1 ? firstMember.name : null;

            user = this.userRepository.create({
              name: userName,
              phone,
              phoneNumberISOCode,
            });

            user = await this.userRepository.save(user);
            usersCreated = 1;
            console.log(`Created user ${user.id} for phone ${phone}`);
          }

          // Associate all members with this phone number to the user in parallel
          const membersToUpdate = membersWithSamePhone.filter(
            (member) => member.userId !== user.id,
          );

          await Promise.all(
            membersToUpdate.map(async (member) => {
              member.user = user;
              member.userId = user.id;
              await this.memberRepository.save(member);
            }),
          );

          return {
            usersCreated,
            membersUpdated: membersToUpdate.length,
          };
        },
      ),
    );

    // Sum up the results
    const totalUsersCreated = results.reduce(
      (sum, result) => sum + result.usersCreated,
      0,
    );
    const totalMembersUpdated = results.reduce(
      (sum, result) => sum + result.membersUpdated,
      0,
    );

    console.log(
      `Seed completed: ${totalUsersCreated} users created, ${totalMembersUpdated} members updated`,
    );
  }
}
