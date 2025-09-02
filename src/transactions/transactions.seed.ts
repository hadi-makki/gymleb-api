// import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { GymEntity } from 'src/gym/entities/gym.entity';
// import { MemberEntity } from 'src/member/entities/member.entity';
// import { ProductEntity } from 'src/products/products.entity';
// import { Repository } from 'typeorm';
// import { SubscriptionInstanceEntity } from './subscription-instance.entity';
// import { TransactionEntity, TransactionType } from './transaction.entity';

// @Injectable({ scope: Scope.DEFAULT })
// export class TransactionSeeding implements OnModuleInit {
//   constructor(
//     @InjectRepository(TransactionEntity)
//     private transactionRepository: Repository<TransactionEntity>,
//     @InjectRepository(SubscriptionInstanceEntity)
//     private subscriptionInstanceRepository: Repository<SubscriptionInstanceEntity>,
//     @InjectRepository(MemberEntity)
//     private memberRepository: Repository<MemberEntity>,
//     @InjectRepository(GymEntity)
//     private gymRepository: Repository<GymEntity>,
//     @InjectRepository(ProductEntity)
//     private productRepository: Repository<ProductEntity>,
//   ) {}

//   async migrateTransactions() {
//     // move transactions to subscription instances
//     const getSubscriptionInstances =
//       await this.subscriptionInstanceRepository.find();
//     for (const subscriptionInstance of getSubscriptionInstances) {
//       const existingTransaction = await this.transactionRepository.findOne({
//         where: { id: subscriptionInstance.id },
//       });

//       if (!existingTransaction) {
//         await this.transactionRepository.create({
//           id: subscriptionInstance.id,
//           type: TransactionType.SUBSCRIPTION,
//           endDate: subscriptionInstance.endDate,
//           startDate: subscriptionInstance.startDate,
//           paidAmount: subscriptionInstance.paidAmount,
//           gym: subscriptionInstance.gym,
//           subscription: subscriptionInstance.subscription,
//           member: subscriptionInstance.member,
//           owner: subscriptionInstance.owner,
//           ownerSubscriptionType: subscriptionInstance.ownerSubscriptionType,
//           isOwnerSubscriptionAssignment:
//             subscriptionInstance.isOwnerSubscriptionAssignment,
//           paidBy: subscriptionInstance.paidBy,
//           isInvalidated: subscriptionInstance.isInvalidated,
//           createdAt: subscriptionInstance.createdAt,
//           updatedAt: subscriptionInstance.updatedAt,
//         });
//       }
//     }

//     // move member subscription instances to transactions
//     const getMembers = await this.memberRepository.find({
//       relations: { transactions: true, subscriptionInstances: true },
//     });

//     for (const member of getMembers) {
//       const transactions = member.transactions || [];
//       console.log('transactions', transactions);
//       const transactionsIds = [
//         ...transactions?.map((transaction) => transaction?.id),
//         ...member.subscriptionInstances.map(
//           (subscriptionInstance) => subscriptionInstance?.id,
//         ),
//       ];
//       let checkTransactions: TransactionEntity[] = [];
//       for (const transactionId of transactionsIds) {
//         const transaction = await this.transactionRepository.findOne({
//           where: { id: transactionId },
//         });
//         if (transaction) {
//           checkTransactions.push(transaction);
//         }
//       }
//       member.transactions = checkTransactions;
//       await this.memberRepository.save(member);
//     }

//     const getGyms = await this.gymRepository.find({
//       relations: { transactions: true },
//     });
//     for (const gym of getGyms) {
//       const transactions = gym.transactions || [];
//       const transactionsIds = [
//         ...transactions?.map((transaction) => transaction?.id),
//       ];
//       let checkTransactions: TransactionEntity[] = [];
//       for (const transactionId of transactionsIds) {
//         const transaction = await this.transactionRepository.findOne({
//           where: { id: transactionId },
//         });
//         checkTransactions.push(transaction);
//       }
//       gym.transactions = checkTransactions;
//       await this.gymRepository.save(gym);
//     }

//     const getProducts = await this.productRepository.find({
//       relations: { transactions: true },
//     });
//     for (const product of getProducts) {
//       const transactions = product.transactions || [];
//       const transactionsIds = [
//         ...transactions.map((transaction) => transaction.id),
//       ];
//       let checkTransactions: TransactionEntity[] = [];
//       for (const transactionId of transactionsIds) {
//         const transaction = await this.transactionRepository.findOne({
//           where: { id: transactionId },
//         });
//         checkTransactions.push(transaction);
//       }
//       product.transactions = checkTransactions;
//       await this.productRepository.save(product);
//     }
//   }

//   async onModuleInit() {
//     // await this.migrateTransactions();
//   }
// }
