import { OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ManagerEntity } from './manager/manager.entity';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Manager } from './manager/manager.model';
import { Model } from 'mongoose';
import { OwnerSubscription } from './owner-subscriptions/owner-subscription.model';
import { OwnerSubscriptionEntity } from './owner-subscriptions/owner-subscription.entity';
import { OwnerSubscriptionType } from './owner-subscriptions/owner-subscription-type.model';
import { OwnerSubscriptionTypeEntity } from './owner-subscriptions/owner-subscription-type.entity';
import { Gym } from './gym/entities/gym.model';
import { GymEntity } from './gym/entities/gym.entity';
import Token from './token/token.model';
import { TokenEntity } from './token/token.entity';
import { Member } from './member/entities/member.model';
import { MemberEntity } from './member/entities/member.entity';
import { Media } from './media/media.model';
import { MediaEntity } from './media/media.entity';
import { Expense } from './expenses/expense.model';
import { ExpenseEntity } from './expenses/expense.entity';
import { Revenue } from './revenue/revenue.model';
import { RevenueEntity } from './revenue/revenue.entity';
import { Product } from './products/products.model';
import { ProductEntity } from './products/products.entity';
import { Subscription } from './subscription/entities/subscription.model';
import { SubscriptionEntity } from './subscription/entities/subscription.entity';
import { SubscriptionInstance } from './transactions/subscription-instance.model';
import { SubscriptionInstanceEntity } from './transactions/subscription-instance.entity';
import { Transaction } from './transactions/transaction.model';
import { TransactionEntity } from './transactions/transaction.entity';
import { PTSession } from './personal-trainers/entities/pt-sessions.model';
import { PTSessionEntity } from './personal-trainers/entities/pt-sessions.entity';

@Injectable()
export class DatabaseMigration implements OnModuleInit {
  // Helper method to safely find entities by mongoId
  private async safeFindEntity<T>(
    repository: Repository<T>,
    mongoId: any,
    entityName: string,
  ): Promise<T | null> {
    if (
      !mongoId ||
      mongoId.toString() === 'undefined' ||
      mongoId.toString() === 'null'
    ) {
      return null;
    }

    // Validate ObjectId format (24 character hex string)
    const mongoIdStr = mongoId.toString();
    if (!/^[0-9a-fA-F]{24}$/.test(mongoIdStr)) {
      console.warn(`Invalid ObjectId format for ${entityName}: ${mongoIdStr}`);
      return null;
    }

    try {
      return await repository.findOne({
        where: { mongoId: mongoIdStr } as any,
      });
    } catch (error) {
      console.error(
        `Error finding ${entityName} with mongoId ${mongoId}:`,
        error,
      );
      return null;
    }
  }
  constructor(
    // TypeORM Repositories
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

    // Mongoose Models
    @InjectModel(Manager.name)
    private readonly managerModel: Model<Manager>,
    @InjectModel(Gym.name)
    private readonly gymModel: Model<Gym>,
    @InjectModel(OwnerSubscription.name)
    private readonly ownerSubscriptionModel: Model<OwnerSubscription>,
    @InjectModel(OwnerSubscriptionType.name)
    private readonly ownerSubscriptionTypeModel: Model<OwnerSubscriptionType>,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<Token>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<Member>,
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<Expense>,
    @InjectModel(Revenue.name)
    private readonly revenueModel: Model<Revenue>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    @InjectModel(SubscriptionInstance.name)
    private readonly subscriptionInstanceModel: Model<SubscriptionInstance>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(PTSession.name)
    private readonly ptSessionModel: Model<PTSession>,
  ) {}

  async migrateOwnerSubscriptionTypes() {
    const ownerSubscriptionTypes = await this.ownerSubscriptionTypeModel.find(
      {},
    );
    for (const type of ownerSubscriptionTypes) {
      const typeEntity = this.ownerSubscriptionTypeRepository.create({
        title: type.title,
        price: type.price,
        durationDays: type.durationDays,
        description: type.description,
        mongoId: type.id,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
      });
      await this.ownerSubscriptionTypeRepository.save(typeEntity);
    }
  }

  async migrateManagers() {
    const managers = await this.managerModel
      .find({})
      .populate('gyms')
      .populate('ownerSubscription')
      .populate('tokens');

    for (const manager of managers) {
      console.log('this is the phone number', manager.phoneNumber);

      const createdManager = this.managerRepository.create({
        firstName: manager.firstName,
        createdAt: manager.createdAt,
        updatedAt: manager.updatedAt,
        email: manager.email,
        lastName: manager.lastName,
        password: manager.password,
        phoneNumber: manager.phoneNumber,
        username: manager.username,
        permissions: manager.roles,
        mongoId: manager.id,
      });

      await this.managerRepository.save(createdManager);
    }
  }

  async migrateGyms() {
    const gyms = await this.gymModel
      .find({})
      .populate('owner')
      .populate('personalTrainers');

    console.log(`Found ${gyms.length} gyms to migrate`);

    for (const gym of gyms) {
      console.log(`Migrating gym: ${gym.name}, owner:`, gym.owner);

      // Skip gyms with undefined IDs
      if (
        !gym.id ||
        gym.id.toString() === 'undefined' ||
        gym.id.toString() === 'null'
      ) {
        console.log(`Skipping gym ${gym.name} - invalid ID:`, gym.id);
        continue;
      }

      // Find the corresponding manager by mongoId
      let owner: ManagerEntity | null = null;
      if (gym.owner) {
        owner = await this.safeFindEntity(
          this.managerRepository,
          gym.owner,
          'Manager',
        );
        console.log(
          `Found owner for gym ${gym.name}:`,
          owner?.firstName || 'null',
        );
      } else {
        console.log(`Gym ${gym.name} has no owner reference`);
      }

      // Find personal trainers for the many-to-many relationship
      const personalTrainers: ManagerEntity[] = [];
      if (gym.personalTrainers && Array.isArray(gym.personalTrainers)) {
        for (const trainerId of gym.personalTrainers) {
          const trainer = await this.safeFindEntity(
            this.managerRepository,
            trainerId,
            'Manager',
          );
          if (trainer) {
            personalTrainers.push(trainer);
          }
        }
        console.log(
          `Found ${personalTrainers.length} personal trainers for gym ${gym.name}`,
        );
      }

      const gymEntity = this.gymRepository.create({
        address: gym.address,
        createdAt: gym.createdAt,
        updatedAt: gym.updatedAt,
        name: gym.name,
        mongoId: gym.id,
        finishedPageSetup: gym.finishedPageSetup,
        isDeactivated: gym.isDeactivated,
        note: gym.note,
        owner: owner,
        personalTrainers: personalTrainers,
        gymsPTSessionPercentage: gym.gymsPTSessionPercentage,
        gymDashedName: gym.gymDashedName,
        openingDays: gym.openingDays,
        offers: gym.offers,
        phone: gym.phone,
        membersNotified: gym.membersNotified,
        womensTimes: gym.womensTimes,
      });

      await this.gymRepository.save(gymEntity);
    }
  }

  async migrateOwnerSubscriptions() {
    const ownerSubscriptions = await this.ownerSubscriptionModel
      .find({})
      .populate('owner')
      .populate('type');

    for (const subscription of ownerSubscriptions) {
      // Find the corresponding manager and type by mongoId
      let owner = null;
      if (subscription.owner && subscription.owner.toString() !== 'undefined') {
        owner = await this.managerRepository.findOne({
          where: { mongoId: subscription.owner.toString() },
        });
      }

      let type = null;
      if (subscription.type && subscription.type.toString() !== 'undefined') {
        type = await this.ownerSubscriptionTypeRepository.findOne({
          where: { mongoId: subscription.type.toString() },
        });
      }

      const subscriptionEntity = this.ownerSubscriptionRepository.create({
        owner: owner,
        type: type,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        active: subscription.active,
        mongoId: subscription.id,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      });

      await this.ownerSubscriptionRepository.save(subscriptionEntity);
    }
  }

  async migrateTokens() {
    const tokens = await this.tokenModel.find({}).populate('manager');

    for (const token of tokens) {
      // Find the corresponding manager by mongoId
      let manager = null;
      if (token.manager && token.manager.toString() !== 'undefined') {
        manager = await this.managerRepository.findOne({
          where: { mongoId: token.manager.toString() },
        });
      }

      const tokenEntity = this.tokenRepository.create({
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        refreshExpirationDate: token.refreshExpirationDate,
        accessExpirationDate: token.accessExpirationDate,
        deviceId: token.deviceId,
        manager: manager,
        mongoId: token.id,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
      });

      await this.tokenRepository.save(tokenEntity);
    }
  }

  async migrateMembers() {
    const members = await this.memberModel
      .find({})
      .populate('gym')
      .populate('subscription')
      .populate('subscriptionInstances')
      .populate('transactions')
      .populate('sessions');

    for (const member of members) {
      // Find the corresponding gym and subscription by mongoId
      let gym = null;
      if (member.gym && member.gym.toString() !== 'undefined') {
        gym = await this.gymRepository.findOne({
          where: { mongoId: member.gym.toString() },
        });
      }

      let subscription = null;
      if (
        member.subscription &&
        member.subscription.toString() !== 'undefined'
      ) {
        subscription = await this.subscriptionRepository.findOne({
          where: { mongoId: member.subscription.toString() },
        });
      }

      const memberEntity = this.memberRepository.create({
        name: member.name,
        email: member.email,
        phone: member.phone,
        gym: gym,
        subscription: subscription,
        isNotified: member.isNotified,
        profileImage: member.profileImage,
        password: member.password,
        isWelcomeMessageSent: member.isWelcomeMessageSent,
        mongoId: member.id,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      });

      await this.memberRepository.save(memberEntity);
    }
  }

  async migrateMedia() {
    const media = await this.mediaModel.find({}).populate('manager');

    for (const mediaItem of media) {
      // Find the corresponding manager by mongoId
      let manager = null;
      if (mediaItem.manager && mediaItem.manager.toString() !== 'undefined') {
        manager = await this.managerRepository.findOne({
          where: { mongoId: mediaItem.manager.toString() },
        });
      }

      const mediaEntity = this.mediaRepository.create({
        s3Key: mediaItem.s3Key,
        originalName: mediaItem.originalName,
        fileName: mediaItem.fileName,
        size: mediaItem.size,
        mimeType: mediaItem.mimeType,
        manager: manager,
        mongoId: mediaItem.id,
      });

      await this.mediaRepository.save(mediaEntity);
    }
  }

  async migrateProducts() {
    // Get all products and filter out those with invalid gym references
    const allProducts = await this.productModel.find({});
    console.log(`Found ${allProducts.length} total products`);

    // Filter out products with invalid gym references
    const products = allProducts.filter((product) => {
      if (
        !product.gym ||
        product.gym.toString() === 'undefined' ||
        product.gym.toString() === 'null'
      ) {
        console.log(
          `Filtering out product ${product.name} - invalid gym reference:`,
          product.gym,
        );
        return false;
      }
      return true;
    });

    console.log(
      `Migrating ${products.length} products with valid gym references`,
    );

    for (const product of products) {
      console.log(`Migrating product: ${product.name}, gym ID:`, product.gym);

      // Find the corresponding gym by mongoId
      const gym = await this.safeFindEntity(
        this.gymRepository,
        product.gym,
        'Gym',
      );
      console.log(
        `Found gym for product ${product.name}:`,
        gym?.name || 'null',
      );

      // Skip if we couldn't find the gym
      if (!gym) {
        console.log(
          `Skipping product ${product.name} - gym not found in TypeORM`,
        );
        continue;
      }

      const productEntity = this.productRepository.create({
        name: product.name,
        stripeProductId: product.stripeProductId,
        price: product.price,
        description: product.description,
        maxDurationSeconds: product.maxDurationSeconds,
        gym: gym,
        stock: product.stock,
        mongoId: product.id,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });

      await this.productRepository.save(productEntity);
    }
  }

  async migrateSubscriptions() {
    const subscriptions = await this.subscriptionModel.find({}).populate('gym');

    for (const subscription of subscriptions) {
      // Find the corresponding gym by mongoId
      let gym = null;
      if (subscription.gym && subscription.gym.toString() !== 'undefined') {
        gym = await this.gymRepository.findOne({
          where: { mongoId: subscription.gym.toString() },
        });
      }

      const subscriptionEntity = this.subscriptionRepository.create({
        title: subscription.title,
        type: subscription.type,
        price: subscription.price,
        duration: subscription.duration,
        user: subscription.user?.toString(),
        gym: gym,
        mongoId: subscription.id,
      });

      await this.subscriptionRepository.save(subscriptionEntity);
    }
  }

  async migrateExpenses() {
    const expenses = await this.expenseModel
      .find({})
      .populate('gym')
      .populate('transaction');

    for (const expense of expenses) {
      // Find the corresponding gym by mongoId
      let gym = null;
      if (expense.gym && expense.gym.toString() !== 'undefined') {
        gym = await this.gymRepository.findOne({
          where: { mongoId: expense.gym.toString() },
        });
      }

      const expenseEntity = this.expenseRepository.create({
        title: expense.title,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        notes: expense.notes,
        gym: gym,
        mongoId: expense.id,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      });

      await this.expenseRepository.save(expenseEntity);
    }
  }

  async migrateRevenue() {
    const revenues = await this.revenueModel
      .find({})
      .populate('gym')
      .populate('transaction');

    for (const revenue of revenues) {
      // Find the corresponding gym by mongoId
      let gym = null;
      if (revenue.gym && revenue.gym.toString() !== 'undefined') {
        gym = await this.gymRepository.findOne({
          where: { mongoId: revenue.gym.toString() },
        });
      }

      const revenueEntity = this.revenueRepository.create({
        title: revenue.title,
        amount: revenue.amount,
        date: revenue.date,
        category: revenue.category,
        notes: revenue.notes,
        gym: gym,
        mongoId: revenue.id,
        createdAt: revenue.createdAt,
        updatedAt: revenue.updatedAt,
      });

      await this.revenueRepository.save(revenueEntity);
    }
  }

  async migrateTransactions() {
    const transactions = await this.transactionModel
      .find({})
      .populate('gym')
      .populate('subscription')
      .populate('member')
      .populate('owner')
      .populate('ownerSubscriptionType')
      .populate('product')
      .populate('revenue')
      .populate('expense')
      .populate('personalTrainer');

    for (const transaction of transactions) {
      // Find all related entities by mongoId
      let gym = null;
      if (transaction.gym && transaction.gym.toString() !== 'undefined') {
        gym = await this.gymRepository.findOne({
          where: { mongoId: transaction.gym.toString() },
        });
      }

      let subscription = null;
      if (
        transaction.subscription &&
        transaction.subscription.toString() !== 'undefined'
      ) {
        subscription = await this.subscriptionRepository.findOne({
          where: { mongoId: transaction.subscription.toString() },
        });
      }

      let member = null;
      if (transaction.member && transaction.member.toString() !== 'undefined') {
        member = await this.memberRepository.findOne({
          where: { mongoId: transaction.member.toString() },
        });
      }

      let owner = null;
      if (transaction.owner && transaction.owner.toString() !== 'undefined') {
        owner = await this.managerRepository.findOne({
          where: { mongoId: transaction.owner.toString() },
        });
      }

      let ownerSubscriptionType = null;
      if (
        transaction.ownerSubscriptionType &&
        transaction.ownerSubscriptionType.toString() !== 'undefined'
      ) {
        ownerSubscriptionType =
          await this.ownerSubscriptionTypeRepository.findOne({
            where: { mongoId: transaction.ownerSubscriptionType.toString() },
          });
      }

      let product = null;
      if (
        transaction.product &&
        transaction.product.toString() !== 'undefined'
      ) {
        product = await this.productRepository.findOne({
          where: { mongoId: transaction.product.toString() },
        });
      }

      let revenue = null;
      if (
        transaction.revenue &&
        transaction.revenue.toString() !== 'undefined'
      ) {
        revenue = await this.revenueRepository.findOne({
          where: { mongoId: transaction.revenue.toString() },
        });
      }

      let expense = null;
      if (
        transaction.expense &&
        transaction.expense.toString() !== 'undefined'
      ) {
        expense = await this.expenseRepository.findOne({
          where: { mongoId: transaction.expense.toString() },
        });
      }

      let personalTrainer = null;
      if (
        transaction.personalTrainer &&
        transaction.personalTrainer.toString() !== 'undefined'
      ) {
        personalTrainer = await this.managerRepository.findOne({
          where: { mongoId: transaction.personalTrainer.toString() },
        });
      }

      const transactionEntity = this.transactionRepository.create({
        title: transaction.title,
        type: transaction.type,
        subscriptionType: transaction.subscriptionType as any,
        endDate: transaction.endDate,
        startDate: transaction.startDate,
        paidAmount: transaction.paidAmount,
        currency: transaction.currency,
        gym: gym,
        subscription: subscription,
        member: member,
        owner: owner,
        ownerSubscriptionType: ownerSubscriptionType,
        isOwnerSubscriptionAssignment:
          transaction.isOwnerSubscriptionAssignment,
        paidBy: transaction.paidBy,
        isInvalidated: transaction.isInvalidated,
        invalidatedAt: transaction.invalidatedAt,
        product: product,
        numberSold: transaction.numberSold,
        revenue: revenue,
        expense: expense,
        date: transaction.date,
        personalTrainer: personalTrainer,
        gymsPTSessionPercentage: transaction.gymsPTSessionPercentage,
        mongoId: transaction.id,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      });

      await this.transactionRepository.save(transactionEntity);
    }
  }

  async migrateSubscriptionInstances() {
    const subscriptionInstances = await this.subscriptionInstanceModel
      .find({})
      .populate('gym')
      .populate('subscription')
      .populate('member')
      .populate('owner')
      .populate('ownerSubscriptionType');

    for (const instance of subscriptionInstances) {
      // Find all related entities by mongoId
      let gym = null;
      if (instance.gym && instance.gym.toString() !== 'undefined') {
        gym = await this.gymRepository.findOne({
          where: { mongoId: instance.gym.toString() },
        });
      }

      let subscription = null;
      if (
        instance.subscription &&
        instance.subscription.toString() !== 'undefined'
      ) {
        subscription = await this.subscriptionRepository.findOne({
          where: { mongoId: instance.subscription.toString() },
        });
      }

      let member = null;
      if (instance.member && instance.member.toString() !== 'undefined') {
        member = await this.memberRepository.findOne({
          where: { mongoId: instance.member.toString() },
        });
      }

      let owner = null;
      if (instance.owner && instance.owner.toString() !== 'undefined') {
        owner = await this.managerRepository.findOne({
          where: { mongoId: instance.owner.toString() },
        });
      }

      let ownerSubscriptionType = null;
      if (
        instance.ownerSubscriptionType &&
        instance.ownerSubscriptionType.toString() !== 'undefined'
      ) {
        ownerSubscriptionType =
          await this.ownerSubscriptionTypeRepository.findOne({
            where: { mongoId: instance.ownerSubscriptionType.toString() },
          });
      }

      const instanceEntity = this.subscriptionInstanceRepository.create({
        endDate: instance.endDate,
        startDate: instance.startDate,
        paidAmount: instance.paidAmount,
        gym: gym,
        subscription: subscription,
        member: member,
        owner: owner,
        ownerSubscriptionType: ownerSubscriptionType,
        isOwnerSubscriptionAssignment: instance.isOwnerSubscriptionAssignment,
        paidBy: instance.paidBy,
        isInvalidated: instance.isInvalidated,
        mongoId: instance.id,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
      });

      await this.subscriptionInstanceRepository.save(instanceEntity);
    }
  }

  async migratePTSessions() {
    const ptSessions = await this.ptSessionModel
      .find({})
      .populate('personalTrainer')
      .populate('member')
      .populate('gym');

    for (const session of ptSessions) {
      // Find all related entities by mongoId
      let personalTrainer = null;
      if (
        session.personalTrainer &&
        session.personalTrainer.toString() !== 'undefined'
      ) {
        personalTrainer = await this.managerRepository.findOne({
          where: { mongoId: session.personalTrainer.toString() },
        });
      }

      let member = null;
      if (session.member && session.member.toString() !== 'undefined') {
        member = await this.memberRepository.findOne({
          where: { mongoId: session.member.toString() },
        });
      }

      let gym = null;
      if (session.gym && session.gym.toString() !== 'undefined') {
        gym = await this.gymRepository.findOne({
          where: { mongoId: session.gym.toString() },
        });
      }

      const sessionEntity = this.ptSessionRepository.create({
        personalTrainer: personalTrainer,
        member: member,
        sessionDate: session.sessionDate,
        isCancelled: session.isCancelled,
        cancelledReason: session.cancelledReason,
        cancelledAt: session.cancelledAt,
        gym: gym,
        sessionPrice: session.sessionPrice,
        mongoId: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });

      await this.ptSessionRepository.save(sessionEntity);
    }
  }

  async migrateManagerGymRelationships() {
    console.log('Migrating manager-gym many-to-many relationships...');

    const managers = await this.managerModel.find({}).populate('gyms');

    for (const manager of managers) {
      if (!manager.gyms || !Array.isArray(manager.gyms)) {
        continue;
      }

      // Find the manager entity in TypeORM
      const managerEntity = await this.managerRepository.findOne({
        where: { mongoId: manager.id },
      });

      if (!managerEntity) {
        console.log(`Manager entity not found for mongoId: ${manager.id}`);
        continue;
      }

      // Find all gym entities that this manager should be associated with
      const gymEntities: GymEntity[] = [];
      for (const gymId of manager.gyms) {
        const gymEntity = await this.gymRepository.findOne({
          where: { mongoId: gymId.toString() },
        });
        if (gymEntity) {
          gymEntities.push(gymEntity);
        }
      }

      // Update the manager's gyms relationship
      managerEntity.gyms = gymEntities;
      await this.managerRepository.save(managerEntity);

      console.log(
        `Updated manager ${managerEntity.firstName} with ${gymEntities.length} gyms`,
      );
    }
  }

  async onModuleInit() {
    console.log('Starting database migration...');

    try {
      // Migrate in order to maintain referential integrity
      console.log('Step 1: Migrating OwnerSubscriptionTypes...');
      await this.migrateOwnerSubscriptionTypes();
      console.log('✓ OwnerSubscriptionTypes migrated');

      console.log('Step 2: Migrating Managers...');
      await this.migrateManagers();
      console.log('✓ Managers migrated');

      console.log('Step 3: Migrating Gyms...');
      await this.migrateGyms();
      console.log('✓ Gyms migrated');

      console.log('Step 4: Migrating OwnerSubscriptions...');
      await this.migrateOwnerSubscriptions();
      console.log('✓ OwnerSubscriptions migrated');

      console.log('Step 5: Migrating Tokens...');
      await this.migrateTokens();
      console.log('✓ Tokens migrated');

      console.log('Step 6: Migrating Members...');
      await this.migrateMembers();
      console.log('✓ Members migrated');

      console.log('Step 7: Migrating Media...');
      await this.migrateMedia();
      console.log('✓ Media migrated');

      console.log('Step 8: Migrating Products...');
      await this.migrateProducts();
      console.log('✓ Products migrated');

      console.log('Step 9: Migrating Subscriptions...');
      await this.migrateSubscriptions();
      console.log('✓ Subscriptions migrated');

      console.log('Step 10: Migrating Expenses...');
      await this.migrateExpenses();
      console.log('✓ Expenses migrated');

      console.log('Step 11: Migrating Revenue...');
      await this.migrateRevenue();
      console.log('✓ Revenue migrated');

      console.log('Step 12: Migrating Transactions...');
      await this.migrateTransactions();
      console.log('✓ Transactions migrated');

      console.log('Step 13: Migrating SubscriptionInstances...');
      await this.migrateSubscriptionInstances();
      console.log('✓ SubscriptionInstances migrated');

      console.log('Step 14: Migrating PTSessions...');
      await this.migratePTSessions();
      console.log('✓ PTSessions migrated');

      console.log('Step 15: Migrating Manager-Gym Relationships...');
      await this.migrateManagerGymRelationships();
      console.log('✓ Manager-Gym Relationships migrated');

      console.log('✅ Database migration completed successfully!');
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
