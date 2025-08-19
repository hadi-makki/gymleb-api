import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GymService } from '../gym/gym.service';
import { MemberService } from '../member/member.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { Transaction } from '../transactions/transaction.entity';
import { Role } from '../decorators/roles/role.enum';
import { Expense } from '../expenses/expense.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Manager } from '../manager/manager.entity';
import { Revenue } from '../revenue/revenue.entity';
import { Days } from '../seeder/gym.seeding';
import {
  Subscription,
  SubscriptionType,
} from '../subscription/entities/subscription.entity';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
import { ExpensesService } from 'src/expenses/expenses.service';
import { RevenueService } from 'src/revenue/revenue.service';
export class GymOwnerService {
  constructor(
    @InjectModel(Manager.name)
    private readonly gymOwnerModel: Model<Manager>,
    @InjectModel(Gym.name)
    private readonly gymModel: Model<Gym>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<Expense>,
    @InjectModel(Revenue.name)
    private readonly revenueModel: Model<Revenue>,
    private readonly subscriptionService: SubscriptionService,
    private readonly memberService: MemberService,
    private readonly gymService: GymService,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    private readonly expenseService: ExpensesService,
    private readonly revenueService: RevenueService,
  ) {}

  async create(createGymOwnerDto: CreateGymOwnerDto, manager: Manager) {
    console.log('createGymOwnerDto', createGymOwnerDto);
    const checkGymOwner = await this.gymOwnerModel.findOne({
      email: createGymOwnerDto.email,
    });
    if (checkGymOwner) {
      throw new BadRequestException('Gym owner already exists');
    }

    let username =
      createGymOwnerDto.firstName.toLowerCase() +
      createGymOwnerDto.lastName.toLowerCase();

    const checkUsername = await this.gymOwnerModel.findOne({
      username,
    });
    if (checkUsername) {
      username = username + Math.floor(1000 + Math.random() * 9000);
    }
    const gymOwner = await this.gymOwnerModel.create({
      firstName: createGymOwnerDto.firstName,
      lastName: createGymOwnerDto.lastName,
      email: createGymOwnerDto.email,
      password: await Manager.hashPassword(createGymOwnerDto.password),
      address: createGymOwnerDto.address,
      phone: createGymOwnerDto.phone,
      username,
      roles: [Role.GymOwner],
    });
    let gymName =
      createGymOwnerDto.firstName + ' ' + createGymOwnerDto.lastName;
    const checkGymName = await this.gymModel.findOne({
      name: gymName,
    });
    if (checkGymName) {
      gymName = gymName + Math.floor(1000 + Math.random() * 9000);
    }

    const checkGym = await this.gymModel.create({
      name: gymName,
      address: createGymOwnerDto.address,
      phone: createGymOwnerDto.phone,
      email: createGymOwnerDto.email,
      password: createGymOwnerDto.password,
      openingDays: Days,
      owner: gymOwner.id,
      gymDashedName: gymName.toLowerCase().split(' ').join('-'),
    });
    gymOwner.gym = checkGym.id;
    await gymOwner.save();

    const gym = await this.gymModel.findById(checkGym.id).populate('owner');

    await this.subscriptionService
      .create(
        {
          title: 'Monthly Membership',
          type: SubscriptionType.MONTHLY_GYM,
          price: 50.0,
          duration: 1,
        },
        gymOwner,
      )
      .catch(async (err) => {
        // remove the gym owner from the gym
        await this.gymModel.findByIdAndDelete(gym.id);
        await this.gymOwnerModel.findByIdAndDelete(gymOwner.id);
        console.log('this is the error', err);
        throw new BadRequestException('Failed to create subscription', err);
      });

    // Generate mock data if requested
    if (createGymOwnerDto.generateMockData) {
      await this.generateMockDataForGym(gymOwner, gym);
    }

    return gym;
  }

  async generateMockDataForGym(gymOwner: Manager, gym: Gym) {
    try {
      // Get available subscriptions from the database
      const subscriptions = await this.subscriptionModel.find().limit(10);

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
            phone: memberData.phone,
            subscriptionId: randomSubscription.id,
          },
          gymOwner,
        );
      }

      // Generate random gym note
      const gymNotes = [
        'Welcome to our state-of-the-art fitness facility! We offer premium equipment and expert guidance.',
      ];

      const randomNote = gymNotes[Math.floor(Math.random() * gymNotes.length)];
      gym.note = randomNote;
      await gym.save();

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
        await this.revenueService.create(gymOwner, {
          ...revenueData,
          date: revenueData.date.toISOString(),
        });
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
      await this.gymService.addGymOffer(gymOwner, mockOffers);
      await this.gymService.updateGymNote(gymOwner, mockNote);
      await this.gymService.setWomensTimes(gymOwner, mockWomensTimes);

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
      const gym = await this.gymModel.create({
        name: gymOwner.firstName + ' ' + gymOwner.lastName,
      });
    }
  }

  async findAll() {
    const gymOwners = await this.gymOwnerModel.find();
    return gymOwners;
  }

  async findOne(id: string) {
    const gymOwner = await this.gymOwnerModel.findById(id);
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }

  async update(id: string, updateGymOwnerDto: UpdateGymOwnerDto) {
    const gymOwner = await this.gymOwnerModel.findByIdAndUpdate(
      id,
      updateGymOwnerDto,
      {
        new: true,
      },
    );
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }

  async remove(id: string) {
    const gymOwner = await this.gymOwnerModel.findByIdAndDelete(id);
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }
}
