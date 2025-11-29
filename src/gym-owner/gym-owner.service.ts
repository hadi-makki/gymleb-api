import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator, paginate } from 'nestjs-paginate';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { ExpensesService } from 'src/expenses/expenses.service';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { RevenueService } from 'src/revenue/revenue.service';
import {
  SubscriptionEntity,
  SubscriptionType,
} from 'src/subscription/entities/subscription.entity';
import { ILike, In, Raw, Repository } from 'typeorm';
import { Permissions } from '../decorators/roles/role.enum';
import { GymService } from '../gym/gym.service';
import { MemberService } from '../member/member.service';
import { Days } from '../seeder/gym.seeding';
import { SubscriptionService } from '../subscription/subscription.service';
import { TransactionType } from '../transactions/transaction.entity';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { CreateGymToGymOwnerDto } from './dto/create-gym-to-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
export class GymOwnerService {
  constructor(
    @InjectRepository(ManagerEntity)
    private readonly gymOwnerModel: Repository<ManagerEntity>,
    @InjectRepository(GymEntity)
    private readonly gymModel: Repository<GymEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseModel: Repository<ExpenseEntity>,
    @InjectRepository(RevenueEntity)
    private readonly revenueModel: Repository<RevenueEntity>,
    private readonly subscriptionService: SubscriptionService,
    private readonly memberService: MemberService,
    private readonly gymService: GymService,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionModel: Repository<SubscriptionEntity>,
    private readonly expenseService: ExpensesService,
    private readonly revenueService: RevenueService,
  ) {}

  async create(createGymOwnerDto: CreateGymOwnerDto, manager: ManagerEntity) {
    const checkGymOwner = await this.gymOwnerModel.findOne({
      where: { email: createGymOwnerDto.email },
    });
    if (checkGymOwner) {
      throw new BadRequestException('Gym owner already exists');
    }

    let username =
      createGymOwnerDto.firstName.toLowerCase() +
      createGymOwnerDto.lastName.toLowerCase();

    const checkUsername = await this.gymOwnerModel.findOne({
      where: { username },
    });
    if (checkUsername) {
      username = username + Math.floor(1000 + Math.random() * 9000);
    }
    const gymOwnerModel = await this.gymOwnerModel.create({
      firstName: createGymOwnerDto.firstName,
      lastName: createGymOwnerDto.lastName,
      email: createGymOwnerDto.email,
      password: await ManagerEntity.hashPassword(createGymOwnerDto.password),
      address: createGymOwnerDto.address,
      phoneNumber: createGymOwnerDto.phone,
      username,
      permissions: [Permissions.GymOwner],
    });
    const gymOwner = await this.gymOwnerModel.save(gymOwnerModel);
    if (createGymOwnerDto.generateMockData) {
      let gymName =
        createGymOwnerDto.firstName + ' ' + createGymOwnerDto.lastName;
      const checkGymName = await this.gymModel.findOne({
        where: { name: gymName },
      });
      if (checkGymName) {
        gymName = gymName + Math.floor(1000 + Math.random() * 9000);
      }

      const gymModel = this.gymModel.create({
        name: gymName,
        address: createGymOwnerDto.address,
        phone: createGymOwnerDto.phone,
        email: createGymOwnerDto.email,
        // password: createGymOwnerDto.password,
        openingDays: Days,
        owner: gymOwner,
        gymDashedName: gymName.toLowerCase().split(' ').join('-'),
      });
      const gym = await this.gymModel.save(gymModel);
      gym.owner = gymOwner;
      await this.gymModel.save(gym);

      await this.subscriptionService
        .create(
          {
            title: 'Monthly Membership',
            type: SubscriptionType.MONTHLY_GYM,
            price: 50.0,
            duration: 1,
          },
          gymOwner,
          gym.id,
        )
        .catch(async (err) => {
          // remove the gym owner from the gym
          await this.gymModel.remove(gym);
          await this.gymOwnerModel.remove(gymOwner);
          throw new BadRequestException('Failed to create subscription', err);
        });

      // Generate mock data if requested
      if (createGymOwnerDto.generateMockData) {
        await this.generateMockDataForGym(gymOwner, gym);
      }
    }

    return {
      message: 'Gym owner created successfully',
    };
  }

  async generateMockDataForGym(gymOwner: ManagerEntity, gym: GymEntity) {
    try {
      // Get available subscriptions from the database
      const subscriptions = await this.subscriptionModel.find({
        where: { gym: gym },
      });

      if (subscriptions.length === 0) {
        console.log(
          'No subscriptions found in database, skipping mock member creation',
        );
        return;
      }

      // Generate 3 mock members
      const mockMembers = [
        {
          name: 'Ali Haddad',
          email: 'ali.haddad@example.com',
          phone: `+96170${Math.floor(100000 + Math.random() * 900000)}`,
        },
        {
          name: 'Nour El-Khoury',
          email: 'nour.elkhoury@example.com',
          phone: `+96171${Math.floor(100000 + Math.random() * 900000)}`,
        },
        {
          name: 'Jad Chami',
          email: 'jad.chami@example.com',
          phone: `+96176${Math.floor(100000 + Math.random() * 900000)}`,
        },
      ];

      // Create members with random subscriptions
      for (const memberData of mockMembers) {
        const randomSubscription =
          subscriptions[Math.floor(Math.random() * subscriptions.length)];

        await this.memberService.create(
          {
            name: memberData.name,
            email: memberData.email,
            phoneNumber: memberData.phone,
            phoneNumberISOCode: 'LB',
            subscriptionId: randomSubscription.id,
          },
          gymOwner,
          gym.id,
        );
      }

      // Generate random gym note
      const gymNotes = [
        'Welcome to our state-of-the-art fitness facility! We offer premium equipment and expert guidance.',
      ];

      const randomNote = gymNotes[Math.floor(Math.random() * gymNotes.length)];
      gym.note = randomNote;
      await this.gymModel.save(gym);

      // Generate mock expenses
      const mockExpenses = [
        {
          title: 'Equipment Maintenance',
          amount: 250.0,
          category: 'Maintenance',
          notes: 'Monthly equipment servicing and repairs',
          date: new Date(
            Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
          ),
        },
        {
          title: 'Electricity Bill',
          amount: 200.0,
          category: 'Utilities',
          notes: 'Monthly electricity charges for gym operations',
          date: new Date(
            Date.now() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000,
          ),
        },
      ];

      for (const expenseData of mockExpenses) {
        await this.expenseService.create(gymOwner, {
          title: expenseData.title,
          amount: expenseData.amount,
          category: expenseData.category,
          notes: expenseData.notes,
          date: expenseData.date.toISOString(),
          gymId: gym.id,
        });
      }

      // Generate mock revenues (additional income sources)
      const mockRevenues = [
        {
          title: 'Personal Training Sessions',
          amount: 180.0,
          category: 'Training',
          notes: 'Individual training sessions with certified trainers',
          date: new Date(
            Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
          ),
        },
        {
          title: 'Protein Shake Sales',
          amount: 85.0,
          category: 'Retail',
          notes: 'Sales of protein shakes and supplements',
          date: new Date(
            Date.now() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000,
          ),
        },
        {
          title: 'Yoga Class Fees',
          amount: 150.0,
          category: 'Classes',
          notes: 'Additional fees for specialized yoga classes',
          date: new Date(
            Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000,
          ),
        },
        {
          title: 'Equipment Rental',
          amount: 75.0,
          category: 'Rental',
          notes: 'Rental of specialized fitness equipment',
          date: new Date(
            Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000,
          ),
        },
        {
          title: 'Nutrition Consultation',
          amount: 120.0,
          category: 'Consultation',
          notes: 'Professional nutrition and diet planning services',
          date: new Date(
            Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000,
          ),
        },
      ];

      for (const revenueData of mockRevenues) {
        await this.revenueService.create(
          gymOwner,
          {
            ...revenueData,
            date: revenueData.date.toISOString(),
          },
          gym.id,
        );
      }

      const mockNote =
        'Welcome to our state-of-the-art fitness facility! We offer premium equipment and expert guidance.';
      const mockOffers = {
        offers: [
          {
            description: 'Get a 10% discount on all products',
          },
        ],
      };

      const mockWomensTimes = [
        {
          day: 'Monday',
          from: '10:00',
          to: '12:00',
        },
      ];
      await this.gymService.addGymOffer(gym.id, mockOffers);
      await this.gymService.updateGymNote(gym.id, mockNote);
      await this.gymService.setWomensTimes(gym.id, mockWomensTimes);

      console.log(`Mock data generated successfully for gym: ${gym.name}`);
      console.log(`- Created ${mockMembers.length} members`);
      console.log(`- Created ${mockExpenses.length} expenses`);
      console.log(`- Created ${mockRevenues.length} revenue entries`);
      console.log(`- Updated gym offers`);
      console.log(`- Updated gym note`);
    } catch (error) {
      console.error('Error generating mock data:', error);
      throw error;
    }
  }

  async generateMockData() {
    const gymOwners = await this.gymOwnerModel.find();
    for (const gymOwner of gymOwners) {
      const gymModel = this.gymModel.create({
        name: gymOwner.firstName + ' ' + gymOwner.lastName,
      });
      const gym = await this.gymModel.save(gymModel);
      gym.owner = gymOwner;
      await this.gymModel.save(gym);
    }
  }

  async findAll() {
    const gymOwners = await this.gymOwnerModel.find({
      select: ['id', 'firstName', 'lastName', 'email', 'createdAt'],
      relations: ['gyms'],
      order: { createdAt: 'DESC' },
    });
    return gymOwners;
  }

  async findOne(id: string) {
    const gymOwner = await this.gymOwnerModel.findOne({
      where: { id },
    });
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }

  async update(id: string, updateGymOwnerDto: UpdateGymOwnerDto) {
    const gymOwner = await this.gymOwnerModel.update(id, updateGymOwnerDto);
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }

  async remove(id: string) {
    const gymOwner = await this.gymOwnerModel.delete(id);
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }

  async createGymToGymOwner({
    gymOwnerId,
    address,
    name,
    phone,
  }: CreateGymToGymOwnerDto) {
    console.log('this is passed', gymOwnerId, address, name, phone);
    const gymOwner = await this.gymOwnerModel.findOne({
      where: { id: gymOwnerId },
    });
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    const checkGym = await this.gymModel.findOne({
      where: { name },
    });
    if (checkGym) {
      throw new BadRequestException('Gym already exists');
    }
    let gymName = name ? name : gymOwner.firstName + ' ' + gymOwner.lastName;
    const checkGymName = await this.gymModel.findOne({
      where: { name: gymName },
    });
    if (checkGymName) {
      gymName = gymName + Math.floor(1000 + Math.random() * 9000);
    }

    const gym = this.gymModel.create({
      name: gymName,
      address,
      phone,
      email: gymOwner.email,
      openingDays: Days,
      owner: gymOwner,
      gymDashedName: gymName.toLowerCase().split(' ').join('-'),
    });

    const savedGym = await this.gymModel.save(gym);

    return savedGym;
  }

  async getAllGymOwners(
    limit: number,
    page: number,
    search?: string,
  ): Promise<any> {
    // Build custom where clause for gym name search
    let whereClause: any = {
      permissions: Raw(
        (alias) => `${alias} @> '["${Permissions.GymOwner}"]'::jsonb`,
      ),
    };

    // If search is provided, add gym name search condition
    if (search && search.trim()) {
      whereClause = [
        {
          ...whereClause,
          ownedGyms: {
            name: ILike(`%${search}%`),
          },
        },
        {
          ...whereClause,
        },
      ];
    }

    // Get paginated gym owners without loading expensive transactions relation
    const res = await paginate(
      {
        limit,
        page,
        search,
        path: 'firstName',
      },
      this.gymOwnerModel,
      {
        relations: {
          ownedGyms: true, // Only load gyms, not transactions
        },
        sortableColumns: [
          'createdAt',
          'updatedAt',
          'firstName',
          'lastName',
          'email',
        ],
        searchableColumns: ['firstName', 'lastName', 'email', 'phoneNumber'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: whereClause,
        filterableColumns: {
          firstName: [FilterOperator.ILIKE],
          lastName: [FilterOperator.ILIKE],
          email: [FilterOperator.ILIKE],
          phoneNumber: [FilterOperator.ILIKE],
        },
        maxLimit: 100,
      },
    );

    // Collect all gym IDs from all gym owners in the current page
    const allGymIds = res.data.flatMap(
      (gymOwner: any) =>
        gymOwner.ownedGyms?.map((gym: GymEntity) => gym.id) || [],
    );

    // Batch load all gyms with their transactions in a single query
    // Only query if there are gym IDs to avoid empty query
    const gymsWithTransactions =
      allGymIds.length > 0
        ? await this.gymModel.find({
            where: { id: In(allGymIds) },
            relations: {
              transactions: {
                ownerSubscriptionType: true,
              },
            },
          })
        : [];

    // Create a map of gym ID to active subscription status for O(1) lookup
    const gymActiveStatusMap = new Map<string, boolean>();
    const now = new Date();

    for (const gym of gymsWithTransactions) {
      const hasActiveSubscription = gym.transactions?.some(
        (transaction) =>
          transaction.type === TransactionType.OWNER_SUBSCRIPTION_ASSIGNMENT &&
          new Date(transaction.endDate) > now,
      );
      gymActiveStatusMap.set(gym.id, !!hasActiveSubscription);
    }

    // Process each gym owner to add expired/active gym counts using the map
    const items = res.data.map((gymOwner: any) => {
      let expiredGymsCount = 0;
      let activeGymsCount = 0;

      if (gymOwner.ownedGyms) {
        for (const gym of gymOwner.ownedGyms) {
          const isActive = gymActiveStatusMap.get(gym.id) ?? false;
          if (isActive) {
            activeGymsCount++;
          } else {
            expiredGymsCount++;
          }
        }
      }

      return {
        ...gymOwner,
        expiredGymsCount,
        activeGymsCount,
      };
    });

    return {
      ...res,
      data: items,
    };
  }
}
