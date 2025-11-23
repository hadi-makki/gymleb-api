import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnModuleInit } from '@nestjs/common';
import { ManagerEntity, ManagerType } from 'src/manager/manager.entity';
import { Permissions } from 'src/decorators/roles/role.enum';

// Map entity names to their detailed permissions (from role.enum.ts)
const entityPermissionMap: Record<string, Permissions[]> = {
  members: [
    Permissions.read_members,
    Permissions.create_members,
    Permissions.update_members,
    Permissions.delete_members,
  ],
  'personal-trainers': [
    Permissions.read_personal_trainers,
    Permissions.create_personal_trainers,
    Permissions.update_personal_trainers,
    Permissions.delete_personal_trainers,
  ],
  gyms: [
    Permissions.read_gyms,
    Permissions.create_gyms,
    Permissions.update_gyms,
    Permissions.delete_gyms,
  ],
  subscriptions: [
    Permissions.read_subscriptions,
    Permissions.create_subscriptions,
    Permissions.update_subscriptions,
    Permissions.delete_subscriptions,
  ],
  transactions: [
    Permissions.read_transactions,
    Permissions.create_transactions,
    Permissions.update_transactions,
    Permissions.delete_transactions,
  ],
  products: [
    Permissions.read_products,
    Permissions.create_products,
    Permissions.update_products,
    Permissions.delete_products,
  ],
  revenue: [
    Permissions.read_revenue,
    Permissions.create_revenue,
    Permissions.update_revenue,
    Permissions.delete_revenue,
  ],
  expenses: [
    Permissions.read_expenses,
    Permissions.create_expenses,
    Permissions.update_expenses,
    Permissions.delete_expenses,
  ],
  dashboard: [
    Permissions.read_dashboard,
    Permissions.create_dashboard,
    Permissions.update_dashboard,
  ],
};

export class PersonalTrainersMigrationSeed implements OnModuleInit {
  constructor(
    @InjectRepository(ManagerEntity)
    private readonly personalTrainerModel: Repository<ManagerEntity>,
  ) {}

  async onModuleInit() {
    console.log('Starting permissions migration...');

    // Step 1: Migrate Personal Trainers
    // Get all managers with type PersonalTrainer
    const personalTrainers = await this.personalTrainerModel.find({
      where: { type: ManagerType.PersonalTrainer },
    });

    console.log(
      `Found ${personalTrainers.length} personal trainers to migrate`,
    );

    // Give PT session permissions and member read/write permissions to personal trainers
    const ptSessionPermissions = [
      Permissions.read_pt_sessions,
      Permissions.create_pt_sessions,
      Permissions.update_pt_sessions,
      Permissions.delete_pt_sessions,
    ];

    const memberReadWritePermissions = [
      Permissions.read_members,
      Permissions.create_members,
      Permissions.update_members,
      // Note: Not including delete_members as per "read and write" requirement
    ];

    for (const pt of personalTrainers) {
      const currentPermissions = pt.permissions || [];
      const newPermissions = [
        ...new Set([
          ...currentPermissions,
          ...ptSessionPermissions,
          ...memberReadWritePermissions,
        ]),
      ];

      await this.personalTrainerModel.update(pt.id, {
        permissions: newPermissions,
      });
    }

    console.log('Personal trainers migrated successfully');

    // Step 2: Expand permissions for all managers
    // Get all managers
    const allManagers = await this.personalTrainerModel.find();

    console.log(`Found ${allManagers.length} total managers to migrate`);

    for (const manager of allManagers) {
      const currentPermissions = manager.permissions || [];
      const expandedPermissions = new Set<Permissions>(currentPermissions);

      // Loop through current permissions
      for (const permission of currentPermissions) {
        // Check if this permission is an entity-level permission (not a detailed one)
        // Entity permissions are: members, personal-trainers, gyms, subscriptions, etc.
        if (entityPermissionMap[permission]) {
          // Add all detailed permissions for this entity
          entityPermissionMap[permission].forEach((detailedPerm) => {
            expandedPermissions.add(detailedPerm);
          });
        }
      }

      // Convert back to array and update if permissions changed
      const finalPermissions = Array.from(expandedPermissions);
      if (finalPermissions.length !== currentPermissions.length) {
        await this.personalTrainerModel.update(manager.id, {
          permissions: finalPermissions,
        });
        console.log(
          `Updated manager ${manager.id} (${manager.username}): ${currentPermissions.length} -> ${finalPermissions.length} permissions`,
        );
      }
    }

    console.log('Permissions migration completed successfully');
  }
}
