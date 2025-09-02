// import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { GymEntity } from 'src/gym/entities/gym.entity';
// import { MemberEntity } from 'src/member/entities/member.entity';
// import { ProductEntity } from 'src/products/products.entity';
// import { Repository } from 'typeorm';
// import { TransactionEntity, TransactionType } from './transaction.entity';

// @Injectable({ scope: Scope.DEFAULT })
// export class TransactionSeeding implements OnModuleInit {
//   constructor(
//     @InjectRepository(TransactionEntity)
//     private transactionRepository: Repository<TransactionEntity>,
//     @InjectRepository(MemberEntity)
//     private memberRepository: Repository<MemberEntity>,
//     @InjectRepository(GymEntity)
//     private gymRepository: Repository<GymEntity>,
//     @InjectRepository(ProductEntity)
//     private productRepository: Repository<ProductEntity>,
//   ) {}

//   async onModuleInit() {
//     const transactions = await this.transactionRepository.find({
//       where: {
//         type: TransactionType.PERSONAL_TRAINER_SESSION,
//       },
//       relations: {
//         ptSession: true,
//       },
//     });

//     for (const transaction of transactions) {
//       transaction.relatedPtSession
//     }
//   }
// }
