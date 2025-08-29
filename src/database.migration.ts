import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model, Types } from 'mongoose';
import { Repository } from 'typeorm';

// TypeORM Entities (Postgres)
import { ExpenseEntity } from './expenses/expense.entity';
import { GymEntity } from './gym/entities/gym.entity';
import { ManagerEntity } from './manager/manager.entity';
import { MediaEntity } from './media/media.entity';
import { MemberEntity } from './member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from './owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscriptionEntity } from './owner-subscriptions/owner-subscription.entity';
import { PTSessionEntity } from './personal-trainers/entities/pt-sessions.entity';
import { ProductEntity } from './products/products.entity';
import { RevenueEntity } from './revenue/revenue.entity';
import { SubscriptionEntity } from './subscription/entities/subscription.entity';
import { TokenEntity } from './token/token.entity';
import { SubscriptionInstanceEntity } from './transactions/subscription-instance.entity';
import {
  TransactionEntity,
  TransactionType,
} from './transactions/transaction.entity';

// Mongoose Models (Mongo)
import { Permissions } from './decorators/roles/role.enum';
import { BadRequestException } from './error/bad-request-error';
import { Expense } from './expenses/expense.model';
import { Gym } from './gym/entities/gym.model';
import { Manager } from './manager/manager.model';
import { Media } from './media/media.model';
import { Member } from './member/entities/member.model';
import { OwnerSubscriptionType } from './owner-subscriptions/owner-subscription-type.model';
import { OwnerSubscription } from './owner-subscriptions/owner-subscription.model';
import { PTSession } from './personal-trainers/entities/pt-sessions.model';
import { Product } from './products/products.model';
import { Revenue } from './revenue/revenue.model';
import { Subscription } from './subscription/entities/subscription.model';
import Token from './token/token.model';
import { SubscriptionInstance } from './transactions/subscription-instance.model';
import { Transaction } from './transactions/transaction.model';
import { User } from './user/user.model';

@Injectable()
export class DatabaseMigration implements OnModuleInit {
  constructor(
    // TypeORM repos
    @InjectRepository(ManagerEntity)
    private readonly managerRepository: Repository<ManagerEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
    @InjectRepository(OwnerSubscriptionEntity)
    private readonly ownerSubscriptionRepository: Repository<OwnerSubscriptionEntity>,
    @InjectRepository(OwnerSubscriptionTypeEntity)
    private readonly ownerSubscriptionTypeRepository: Repository<OwnerSubscriptionTypeEntity>,
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    @InjectRepository(RevenueEntity)
    private readonly revenueRepository: Repository<RevenueEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionInstanceEntity)
    private readonly subscriptionInstanceRepository: Repository<SubscriptionInstanceEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(PTSessionEntity)
    private readonly ptSessionRepository: Repository<PTSessionEntity>,

    // Mongoose models
    @InjectModel(Manager.name) private readonly managerModel: Model<Manager>,
    @InjectModel(Gym.name) private readonly gymModel: Model<Gym>,
    @InjectModel(OwnerSubscription.name)
    private readonly ownerSubscriptionModel: Model<OwnerSubscription>,
    @InjectModel(OwnerSubscriptionType.name)
    private readonly ownerSubscriptionTypeModel: Model<OwnerSubscriptionType>,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
    @InjectModel(Member.name) private readonly memberModel: Model<Member>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Revenue.name) private readonly revenueModel: Model<Revenue>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    @InjectModel(SubscriptionInstance.name)
    private readonly subscriptionInstanceModel: Model<SubscriptionInstance>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(PTSession.name)
    private readonly ptSessionModel: Model<PTSession>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async onModuleInit() {
    console.log('[Migration] Starting migration bootstrap...');
    const mongoManager = await this.managerModel.findOne({
      username: 'demogym',
    });
    if (!mongoManager) {
      throw new BadRequestException('Manager not found');
    }
    console.log('[Migration] Manager found in Mongo:', mongoManager.id);
    // for (const manager of mongoManagers) {
    const createManager = this.managerRepository.create({
      firstName: mongoManager.firstName,
      lastName: mongoManager.lastName,
      email: mongoManager.email,
      phoneNumber: mongoManager.phoneNumber,
      permissions: mongoManager.roles,
      createdAt: mongoManager.createdAt,
      updatedAt: mongoManager.updatedAt,
      mongoId: mongoManager.id,
      username: mongoManager.username,
      password: mongoManager.password,
    });
    const createdManager = await this.managerRepository.save(createManager);
    console.log('[Migration] Manager created in Postgres:', createdManager.id);

    const getUserGyms = await this.gymModel.find({
      _id: { $in: mongoManager.gyms },
    });
    const getAllMedia = await this.mediaModel.find();

    // console.log(getUserGyms);
    console.log('[Migration] Gyms to migrate:', getUserGyms.length);

    for (const gym of getUserGyms) {
      console.log('[Migration] Migrating gym:', gym.name, gym.id);
      const createGym = this.gymRepository.create({
        name: gym.name,
        address: gym.address,
        createdAt: gym.createdAt,
        updatedAt: gym.updatedAt,
        mongoId: gym.id,
        owner: createdManager,
        finishedPageSetup: gym.finishedPageSetup,
        membersNotified: gym.membersNotified,
        note: gym.note,
        offers: gym.offers,
        phone: gym.phone,
        gymDashedName: gym.gymDashedName,
        womensTimes: gym.womensTimes,
        openingDays: gym.openingDays,

        // newly created gym
        // gym: gym
      });
      const createdGym = await this.gymRepository.save(createGym);
      console.log('[Migration] Created gym in Postgres:', createdGym.id);
      // migrate subscriptions
      const subscriptions = await this.subscriptionModel.find({ gym: gym.id });
      const subscriptionMap = new Map<string, SubscriptionEntity>();
      console.log(
        '[Migration] Subscriptions found for gym',
        gym.id,
        ':',
        subscriptions.length,
      );
      for (const subscription of subscriptions) {
        const createSubscription = this.subscriptionRepository.create({
          title: subscription.title,
          type: subscription.type,
          price: subscription.price,
          // newly created gym
          gym: createdGym,
          duration: subscription.duration,
          mongoId: subscription.id,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        });
        const createdSubscription =
          await this.subscriptionRepository.save(createSubscription);
        subscriptionMap.set(subscription.id.toString(), createdSubscription);
      }

      // migrate members
      const members = await this.memberModel.find({ gym: gym.id });
      console.log(
        '[Migration] Members found for gym',
        gym.id,
        ':',
        members.length,
      );
      for (const member of members) {
        console.log('this is the member subscription', member.subscription);
        const memberSubMongoId = member?.subscription
          ? member.subscription.toString()
          : null;
        let getSubscription: SubscriptionEntity | null = null;
        if (memberSubMongoId) {
          getSubscription = subscriptionMap.get(memberSubMongoId) ?? null;
          if (!getSubscription) {
            getSubscription = await this.subscriptionRepository.findOne({
              where: { mongoId: memberSubMongoId },
            });
          }
        }
        if (!getSubscription) {
          console.warn(
            '[Migration] Subscription not found for member',
            member.id,
            'subId=',
            memberSubMongoId,
            '— continuing without subscription',
          );
        }
        const getProfileImage = getAllMedia.find(
          (media) => media.id.toString() === member.profileImage?.toString(),
        );
        console.log('getProfileImage', getProfileImage);
        let profileImage: MediaEntity | null = null;
        if (getProfileImage) {
          const createProfileImage = this.mediaRepository.create({
            mongoId: getProfileImage._id.toString(),
            fileName: getProfileImage.fileName,
            size: getProfileImage.size,
            createdAt: getProfileImage.createdAt,
            updatedAt: getProfileImage.updatedAt,
            s3Key: getProfileImage.s3Key,
            originalName: getProfileImage.originalName,
            mimeType: getProfileImage.mimeType,
          });
          profileImage = await this.mediaRepository.save(createProfileImage);
          console.log('profileImage', profileImage);
        }
        const createMember = this.memberRepository.create({
          email: member.email,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          isNotified: member.isNotified,
          isWelcomeMessageSent: member.isWelcomeMessageSent,
          mongoId: member.id,
          password: member.password,
          phone: member.phone,
          name: member.name,
          profileImage: profileImage,
          // newly created gym
          gym: createdGym,
          subscription: getSubscription ?? undefined,
        });
        const createdMember = await this.memberRepository.save(createMember);

        console.log(
          '[Migration] Member created:',
          createdMember.id,
          'for gym',
          createdGym.id,
        );

        // migrate subscription transactions
        const subscriptionTransactions = await this.transactionModel.find({
          member: member._id,
          // gym: new Types.ObjectId(gym.id),
          type: TransactionType.SUBSCRIPTION,
        });
        console.log(
          '[Migration] Subscription transactions for member',
          createdMember.id,
          ':',
          subscriptionTransactions.length,
        );
        for (const subscriptionTransaction of subscriptionTransactions) {
          const createSubscriptionTransaction =
            this.transactionRepository.create({
              currency: subscriptionTransaction?.currency,
              date: subscriptionTransaction?.date,
              createdAt: subscriptionTransaction?.createdAt,
              endDate: subscriptionTransaction?.endDate,
              startDate: subscriptionTransaction?.startDate,
              type: subscriptionTransaction?.type,
              gym: createdGym,
              isPaid: subscriptionTransaction?.isPaid,
              member: createdMember,
              isInvalidated: subscriptionTransaction?.isInvalidated,
              invalidatedAt: subscriptionTransaction?.invalidatedAt,
              gymsPTSessionPercentage:
                subscriptionTransaction?.gymsPTSessionPercentage,
              mongoId: subscriptionTransaction?.id,
              isSubscription: true,
              paidBy: subscriptionTransaction?.paidBy,
              paidAmount: subscriptionTransaction?.paidAmount,
              numberSold: subscriptionTransaction?.numberSold,
              subscription: getSubscription,
              owner: createdManager,
              isOwnerSubscriptionAssignment:
                subscriptionTransaction?.isOwnerSubscriptionAssignment,
            });
          await this.transactionRepository.save(createSubscriptionTransaction);
        }
      }

      const products = await this.productModel.find({ gym: gym.id });
      console.log(
        '[Migration] Products found for gym',
        gym.id,
        ':',
        products.length,
      );
      for (const product of products) {
        // migrate media
        const media = await this.mediaModel.findOne({
          _id: product.image,
        });
        const createProduct = this.productRepository.create({
          name: product.name,
          price: product.price,
          description: product.description,
          maxDurationSeconds: product.maxDurationSeconds,
          mongoId: product.id,
          stock: product.stock,
          stripeProductId: product.stripeProductId,
          updatedAt: product.updatedAt,
          createdAt: product.createdAt,
          // newly created gym
          gym: createdGym,
        });
        const createdProduct = await this.productRepository.save(createProduct);

        const createMedia = this.mediaRepository.create({
          mongoId: media._id.toString(),
          fileName: media.fileName,
          size: media.size,
          createdAt: media.createdAt,
          updatedAt: media.updatedAt,
          s3Key: media.s3Key,
          originalName: media.originalName,
          mimeType: media.mimeType,
          product: createdProduct,
        });
        const createdMedia = await this.mediaRepository.save(createMedia);
      }

      //   const personalTrainers = await this.personalTrainerEntity
      //   .find({
      //     gyms: { $in: [gym._id] },
      //     roles: { $in: [Permissions.personalTrainers] },
      //   })
      //   .populate({
      //     path: 'gyms',
      //   });

      // const sessionsResult: { personalTrainer: Manager; clientsCount: number }[] =
      //   [];

      // for (const personalTrainer of personalTrainers) {
      //   const sessions = await this.sessionEntity
      //     .find({
      //       personalTrainer: personalTrainer._id,
      //     })
      //     .populate({
      //       path: 'member',
      //     });
      //   const clients = sessions.map((session) => session.member?.id);
      //   // filter out duplicates
      //   const uniqueClients = [...new Set(clients)];
      //   sessionsResult.push({
      //     personalTrainer,
      //     clientsCount: uniqueClients.length,
      //   });
      // }

      // migrate personal trainers
      const personalTrainers = await this.managerModel.find({
        gyms: { $in: [gym._id] },
        roles: { $in: [Permissions.personalTrainers] },
      });
      console.log(
        '[Migration] PTs found for gym',
        gym.id,
        ':',
        personalTrainers.length,
      );
      for (const personalTrainer of personalTrainers) {
        console.log('this is the gym', createdGym.id);
        const createPersonalTrainer = this.managerRepository.create({
          firstName: personalTrainer.firstName,
          lastName: personalTrainer.lastName,
          email: personalTrainer.email,
          phoneNumber: personalTrainer.phoneNumber,
          createdAt: personalTrainer.createdAt,
          updatedAt: personalTrainer.updatedAt,
          mongoId: personalTrainer.id,
          permissions: personalTrainer.roles,
          username: personalTrainer.username,
          password: personalTrainer.password,
        });
        const createdPersonalTrainer = await this.managerRepository.save(
          createPersonalTrainer,
        );

        createdPersonalTrainer.gyms = [createdGym];
        await this.managerRepository.save(createdPersonalTrainer);

        // migrate personal trainer sessions
        const personalTrainerSessions = await this.ptSessionModel.find({
          personalTrainer: new Types.ObjectId(personalTrainer.id),
        });
        console.log(
          '[Migration] PT sessions found for PT',
          personalTrainer.id,
          ':',
          personalTrainerSessions.length,
        );
        for (const personalTrainerSession of personalTrainerSessions) {
          const getMember = await this.memberRepository.findOne({
            where: {
              mongoId: personalTrainerSession.member.toString(),
            },
          });
          if (!getMember) {
            throw new BadRequestException('Member not found');
          }
          const createPersonalTrainerSession = this.ptSessionRepository.create({
            mongoId: personalTrainerSession.id,
            cancelledAt: personalTrainerSession.cancelledAt,
            cancelledReason: personalTrainerSession.cancelledReason,
            createdAt: personalTrainerSession.createdAt,
            updatedAt: personalTrainerSession.updatedAt,
            member: getMember,
            personalTrainer: createdPersonalTrainer,
            gym: createdGym,
            sessionDate: personalTrainerSession.sessionDate,
            isCancelled: personalTrainerSession.isCancelled,
            sessionPrice: personalTrainerSession.sessionPrice,
          });
          const createdPersonalTrainerSession =
            await this.ptSessionRepository.save(createPersonalTrainerSession);
        }
        // create personal trainer session transactions
        const personalTrainerSessionTransactions =
          await this.transactionModel.find({
            personalTrainer: new Types.ObjectId(personalTrainer.id),
            type: TransactionType.PERSONAL_TRAINER_SESSION,
          });
        console.log(
          '[Migration] PT session tx for session',
          personalTrainer.id,
          ':',
          personalTrainerSessionTransactions.length,
        );
        for (const personalTrainerSessionTransaction of personalTrainerSessionTransactions) {
          const getMember = await this.memberRepository.findOne({
            where: {
              mongoId: personalTrainerSessionTransaction.member.toString(),
            },
          });
          if (!getMember) {
            throw new BadRequestException('Member not found');
          }
          const createPersonalTrainerSessionTransaction =
            this.transactionRepository.create({
              title: personalTrainerSessionTransaction?.title,
              currency: personalTrainerSessionTransaction?.currency,
              date: personalTrainerSessionTransaction?.date,
              createdAt: personalTrainerSessionTransaction?.createdAt,
              endDate: personalTrainerSessionTransaction?.endDate,
              startDate: personalTrainerSessionTransaction?.startDate,
              type: personalTrainerSessionTransaction?.type,
              gym: createdGym,
              isPaid: personalTrainerSessionTransaction?.isPaid,
              member: getMember,
              isInvalidated: personalTrainerSessionTransaction?.isInvalidated,
              invalidatedAt: personalTrainerSessionTransaction?.invalidatedAt,
              gymsPTSessionPercentage:
                personalTrainerSessionTransaction?.gymsPTSessionPercentage,
              mongoId: personalTrainerSessionTransaction?.id,
              isSubscription: false,
              paidBy: personalTrainerSessionTransaction?.paidBy,
              paidAmount: personalTrainerSessionTransaction?.paidAmount,
              numberSold: personalTrainerSessionTransaction?.numberSold,
              owner: createdManager,
              isOwnerSubscriptionAssignment:
                personalTrainerSessionTransaction?.isOwnerSubscriptionAssignment,
            });
          await this.transactionRepository.save(
            createPersonalTrainerSessionTransaction,
          );
        }
      }
      const expenses = await this.expenseModel.find({
        gym: new Types.ObjectId(gym.id),
      });
      console.log(
        '[Migration] Expenses found for gym',
        gym.id,
        ':',
        expenses.length,
      );
      for (const expense of expenses) {
        const createExpense = this.expenseRepository.create({
          date: expense.date,
          amount: expense.amount,
          mongoId: expense.id,
          category: expense.category,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
          title: expense.title,
          notes: expense.notes,
          gym: createdGym,
        });
        const createdExpense = await this.expenseRepository.save(createExpense);

        // create expense transactions
        const expenseTransactions = await this.transactionModel.find({
          expense: new Types.ObjectId(expense.id),
          type: TransactionType.EXPENSE,
        });
        console.log(
          '[Migration] Expense transactions for expense',
          createdExpense.id,
          ':',
          expenseTransactions.length,
        );
        for (const expenseTransaction of expenseTransactions) {
          console.log('expenseTransaction', expenseTransaction);
          const getExpense = await this.expenseRepository.findOne({
            where: {
              mongoId: expenseTransaction.expense.toString(),
            },
          });
          if (!getExpense) {
            throw new BadRequestException('Expense not found');
          }
          console.log('getExpense', getExpense);
          const createExpenseTransaction = this.transactionRepository.create({
            currency: expenseTransaction?.currency,
            date: expenseTransaction?.date,
            createdAt: expenseTransaction?.createdAt,
            endDate: expenseTransaction?.endDate,
            startDate: expenseTransaction?.startDate,
            type: expenseTransaction?.type,
            gym: createdGym,
            isPaid: expenseTransaction?.isPaid,
            // member: createdMember,
            isInvalidated: expenseTransaction?.isInvalidated,
            invalidatedAt: expenseTransaction?.invalidatedAt,
            gymsPTSessionPercentage:
              expenseTransaction?.gymsPTSessionPercentage,
            mongoId: expenseTransaction?.id,
            isSubscription: false,
            paidBy: expenseTransaction?.paidBy,
            paidAmount: expenseTransaction?.paidAmount,
            numberSold: expenseTransaction?.numberSold,
            expense: getExpense,
            owner: createdManager,
            isOwnerSubscriptionAssignment:
              expenseTransaction?.isOwnerSubscriptionAssignment,
          });
          await this.transactionRepository.save(createExpenseTransaction);
        }
      }
      const getOtherRevenueTransactions = await this.transactionModel.find({
        gym: new Types.ObjectId(gym.id),
        type: TransactionType.REVENUE,
      });
      console.log(
        '[Migration] Other revenue transactions for gym',
        gym.id,
        ':',
        getOtherRevenueTransactions.length,
      );
      for (const otherRevenueTransaction of getOtherRevenueTransactions) {
        let product: ProductEntity | null = null;
        if (otherRevenueTransaction.product) {
          product = await this.productRepository.findOne({
            where: {
              mongoId: otherRevenueTransaction.product.toString(),
            },
          });
        }
        const createOtherRevenueTransaction = this.transactionRepository.create(
          {
            title: otherRevenueTransaction?.title,
            currency: otherRevenueTransaction?.currency,
            date: otherRevenueTransaction?.date,
            createdAt: otherRevenueTransaction?.createdAt,
            endDate: otherRevenueTransaction?.endDate,
            startDate: otherRevenueTransaction?.startDate,
            type: otherRevenueTransaction?.type,
            gym: createdGym,
            isPaid: otherRevenueTransaction?.isPaid,
            isInvalidated: otherRevenueTransaction?.isInvalidated,
            invalidatedAt: otherRevenueTransaction?.invalidatedAt,
            gymsPTSessionPercentage:
              otherRevenueTransaction?.gymsPTSessionPercentage,
            mongoId: otherRevenueTransaction?.id,
            isSubscription: false,
            paidBy: otherRevenueTransaction?.paidBy,
            paidAmount: otherRevenueTransaction?.paidAmount,
            numberSold: otherRevenueTransaction?.numberSold,
            owner: createdManager,
            isOwnerSubscriptionAssignment:
              otherRevenueTransaction?.isOwnerSubscriptionAssignment,
            product: product,
          },
        );
        await this.transactionRepository.save(createOtherRevenueTransaction);
      }
    }
    // }
    console.log('[Migration] Migration bootstrap finished.');
  }
}
