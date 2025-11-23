import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { MarkBillPaidDto } from './dto/mark-bill-paid.dto';
import { BillEntity, BillType } from './entities/bill.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ExpensesService } from 'src/expenses/expenses.service';
import { Permissions } from 'src/decorators/roles/role.enum';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(BillEntity)
    private billRepository: Repository<BillEntity>,
    @InjectRepository(GymEntity)
    private gymRepository: Repository<GymEntity>,
    @InjectRepository(ManagerEntity)
    private managerRepository: Repository<ManagerEntity>,
    private readonly expensesService: ExpensesService,
  ) {}

  async create(manager: ManagerEntity, createBillDto: CreateBillDto) {
    // Validate gym exists and manager has access to it
    const gym = await this.gymRepository.findOne({
      where: { id: createBillDto.gymId },
      relations: ['owner'],
    });
    if (!gym) throw new NotFoundException('Gym not found');

    // Check if manager owns the gym
    const isOwner = gym.owner?.id === manager.id;
    
    // Check if manager is a staff member in the gym
    const managerInGym = await this.managerRepository.findOne({
      where: { id: manager.id, gyms: { id: createBillDto.gymId } },
    });
    const isStaffInGym = !!managerInGym;
    
    // Check if manager is super admin
    const isSuperAdmin = manager.permissions?.includes(
      Permissions.SuperAdmin,
    );

    if (!isOwner && !isStaffInGym && !isSuperAdmin) {
      throw new ForbiddenException(
        'You do not have permission to create bills for this gym',
      );
    }

    // For fixed bills, amount is required
    if (createBillDto.billType === BillType.FIXED && !createBillDto.amount) {
      throw new BadRequestException('Amount is required for fixed bills');
    }

    const bill = this.billRepository.create({
      ...createBillDto,
      amount: createBillDto.amount ?? 0, // Default to 0 for dynamic bills
      gym: { id: createBillDto.gymId },
    });

    return await this.billRepository.save(bill);
  }

  async findAll(manager: ManagerEntity, gymId: string) {
    const gym = await this.gymRepository.findOne({
      where: { id: gymId },
    });
    if (!gym) throw new NotFoundException('Gym not found');

    return this.billRepository.find({
      where: { gym: { id: gymId } },
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(manager: ManagerEntity, id: string) {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['gym'],
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async update(
    manager: ManagerEntity,
    id: string,
    updateBillDto: UpdateBillDto,
  ) {
    const bill = await this.billRepository.findOne({
      where: { id },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    await this.billRepository.update(id, {
      ...updateBillDto,
      ...(updateBillDto.gymId ? { gym: { id: updateBillDto.gymId } } : {}),
    });

    return await this.billRepository.findOne({ where: { id } });
  }

  async remove(manager: ManagerEntity, id: string) {
    const bill = await this.billRepository.findOne({
      where: { id },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    await this.billRepository.delete(id);
    return { success: true };
  }

  async markAsPaid(
    manager: ManagerEntity,
    id: string,
    markBillPaidDto: MarkBillPaidDto,
  ) {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['gym'],
    });
    if (!bill) throw new NotFoundException('Bill not found');

    // For dynamic bills, amount is required
    if (bill.billType === BillType.DYNAMIC && !markBillPaidDto.amount) {
      throw new BadRequestException('Amount is required for dynamic bills');
    }

    const amountToUse =
      bill.billType === BillType.DYNAMIC
        ? markBillPaidDto.amount!
        : bill.amount;

    const now = new Date();
    const lastMonthPaidAt = bill.paidAt || bill.lastMonthPaidAt;

    // Update bill payment status
    bill.lastMonthPaidAt = bill.paidAt || bill.lastMonthPaidAt;
    bill.paidAt = now;

    await this.billRepository.save(bill);

    // Create expense automatically
    await this.expensesService.create(manager, {
      title: bill.title,
      amount: amountToUse,
      currency: bill.currency,
      date: now.toISOString(),
      gymId: bill.gymId!,
      category: 'Bill Payment',
      notes: `Bill payment for ${bill.title}`,
    });

    return await this.billRepository.findOne({
      where: { id },
      relations: ['gym'],
    });
  }

  async getUpcomingBill(manager: ManagerEntity, gymId: string) {
    const gym = await this.gymRepository.findOne({
      where: { id: gymId },
    });
    if (!gym) throw new NotFoundException('Gym not found');

    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get all bills for the gym
    const bills = await this.billRepository.find({
      where: { gym: { id: gymId } },
      order: { dueDate: 'ASC' },
    });

    // Find all unpaid bills and calculate their next due dates
    const unpaidBillsWithDueDates: Array<{
      bill: BillEntity;
      nextDueDate: Date;
    }> = [];

    for (const bill of bills) {
      const isPaidThisMonth = this.isBillPaidThisMonth(bill);
      if (!isPaidThisMonth) {
        // Calculate next due date (handles months with different lengths)
        const nextDueDate = this.getNextDueDate(
          bill.dueDate,
          currentDay,
          currentMonth,
          currentYear,
        );

        unpaidBillsWithDueDates.push({
          bill,
          nextDueDate,
        });
      }
    }

    if (unpaidBillsWithDueDates.length === 0) {
      return null;
    }

    // Sort by next due date
    unpaidBillsWithDueDates.sort(
      (a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime(),
    );

    // Get the earliest due date
    const earliestDueDate = unpaidBillsWithDueDates[0].nextDueDate;

    // Check if this due date is today
    const isDueToday =
      earliestDueDate.getDate() === currentDay &&
      earliestDueDate.getMonth() === currentMonth &&
      earliestDueDate.getFullYear() === currentYear;

    // Find all bills with the same next due date
    const billsWithSameDueDate = unpaidBillsWithDueDates.filter(
      (item) => item.nextDueDate.getTime() === earliestDueDate.getTime(),
    );

    // Calculate total amount (group by currency)
    const totalsByCurrency: Record<string, number> = {};
    billsWithSameDueDate.forEach(({ bill }) => {
      const currency = bill.currency || 'USD';
      totalsByCurrency[currency] =
        (totalsByCurrency[currency] || 0) + (bill.amount || 0);
    });

    // Get the primary currency (first one or USD)
    const primaryCurrency =
      billsWithSameDueDate[0]?.bill.currency || ('USD' as any);

    const totalAmount = totalsByCurrency[primaryCurrency] || 0;

    return {
      bills: billsWithSameDueDate.map(({ bill, nextDueDate }) => ({
        ...bill,
        nextDueDate: nextDueDate.toISOString(),
      })),
      totalAmount,
      currency: primaryCurrency,
      nextDueDate: earliestDueDate.toISOString(),
      isDueToday,
    };
  }

  private getNextDueDate(
    billDueDate: number,
    currentDay: number,
    currentMonth: number,
    currentYear: number,
  ): Date {
    let dueDateMonth = currentMonth;
    let dueDateYear = currentYear;

    if (billDueDate < currentDay) {
      // Due date has passed this month, next due date is next month
      dueDateMonth = currentMonth + 1;
      if (dueDateMonth > 11) {
        dueDateMonth = 0;
        dueDateYear = currentYear + 1;
      }
    }

    // Get the last day of the target month
    const lastDayOfMonth = new Date(dueDateYear, dueDateMonth + 1, 0).getDate();

    // If bill is due on day 31 but month has fewer days, use last day of month
    const actualDueDate = Math.min(billDueDate, lastDayOfMonth);

    return new Date(dueDateYear, dueDateMonth, actualDueDate);
  }

  private isBillPaidThisMonth(bill: BillEntity): boolean {
    if (!bill.paidAt && !bill.lastMonthPaidAt) {
      return false;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check if paidAt is in current month
    if (bill.paidAt) {
      const paidAtDate = new Date(bill.paidAt);
      if (
        paidAtDate.getMonth() === currentMonth &&
        paidAtDate.getFullYear() === currentYear
      ) {
        return true;
      }
    }

    // Check if lastMonthPaidAt is recent (within last 30 days)
    if (bill.lastMonthPaidAt) {
      const lastPaidDate = new Date(bill.lastMonthPaidAt);
      const daysSinceLastPaid =
        (now.getTime() - lastPaidDate.getTime()) / (1000 * 60 * 60 * 24);

      // If paid within last 30 days and no newer payment, consider it paid
      if (daysSinceLastPaid <= 30 && !bill.paidAt) {
        return true;
      }
    }

    return false;
  }
}
