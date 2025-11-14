import ExcelJS from 'exceljs';

export type MemberExportRow = {
  name: string;
  gender?: string | null;
  phone?: string | null;
  membershipType?: string | null;
  expiresAt?: string | null; // dd/MM/yyyy
  status: 'Active' | 'Inactive';
  paymentStatus?: 'Paid' | 'Unpaid' | '';
  unpaidSubscriptionsCount?: number;
  unpaidSubscriptionsDetails?: string;
};

export async function buildMembersWorkbook(
  rows: MemberExportRow[],
  sheetName: string = 'Members',
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: 'Name', key: 'name', width: 28 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Membership Type', key: 'membershipType', width: 22 },
    { header: 'Expires At', key: 'expiresAt', width: 16 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Payment Status', key: 'paymentStatus', width: 16 },
    {
      header: 'Unpaid Subscriptions',
      key: 'unpaidSubscriptionsCount',
      width: 20,
    },
    {
      header: 'Unpaid Subscriptions Details',
      key: 'unpaidSubscriptionsDetails',
      width: 50,
    },
  ];

  for (const r of rows) {
    sheet.addRow({
      name: r.name,
      gender: r.gender ?? '',
      phone: r.phone ?? '',
      membershipType: r.membershipType ?? '',
      expiresAt: r.expiresAt ?? '',
      status: r.status,
      paymentStatus: r.paymentStatus ?? '',
      unpaidSubscriptionsCount: r.unpaidSubscriptionsCount ?? 0,
      unpaidSubscriptionsDetails: r.unpaidSubscriptionsDetails ?? '',
    });
  }

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export type TransactionExportRow = {
  date: string; // dd/MM/yyyy
  title?: string | null;
  memberName?: string | null;
  type: string;
  amount: number;
  currency: string;
  status: string;
  paidBy?: string | null;
  personalTrainer?: string | null;
  subscriptionType?: string | null;
  startDate?: string | null; // dd/MM/yyyy
  endDate?: string | null; // dd/MM/yyyy
};

export async function buildTransactionsWorkbook(
  rows: TransactionExportRow[],
  sheetName: string = 'Transactions',
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Member', key: 'memberName', width: 25 },
    { header: 'Type', key: 'type', width: 25 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Currency', key: 'currency', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Paid By', key: 'paidBy', width: 20 },
    { header: 'Personal Trainer', key: 'personalTrainer', width: 25 },
    { header: 'Subscription Type', key: 'subscriptionType', width: 20 },
    { header: 'Start Date', key: 'startDate', width: 16 },
    { header: 'End Date', key: 'endDate', width: 16 },
  ];

  for (const r of rows) {
    sheet.addRow({
      date: r.date ?? '',
      title: r.title ?? '',
      memberName: r.memberName ?? '',
      type: r.type ?? '',
      amount: r.amount ?? 0,
      currency: r.currency ?? '',
      status: r.status ?? '',
      paidBy: r.paidBy ?? '',
      personalTrainer: r.personalTrainer ?? '',
      subscriptionType: r.subscriptionType ?? '',
      startDate: r.startDate ?? '',
      endDate: r.endDate ?? '',
    });
  }

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export type UnpaidTransactionsByMemberExportRow = {
  memberName: string;
  unpaidItemsSummary: string; // e.g., "2 PT sessions, 3 subscriptions"
  totalAmountOwed: number;
  currency: string;
};

export async function buildUnpaidTransactionsByMemberWorkbook(
  rows: UnpaidTransactionsByMemberExportRow[],
  sheetName: string = 'Unpaid Transactions by Member',
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: 'Member Name', key: 'memberName', width: 30 },
    { header: 'Unpaid Items', key: 'unpaidItemsSummary', width: 50 },
    { header: 'Total Amount Owed', key: 'totalAmountOwed', width: 20 },
    { header: 'Currency', key: 'currency', width: 12 },
  ];

  for (const r of rows) {
    sheet.addRow({
      memberName: r.memberName ?? '',
      unpaidItemsSummary: r.unpaidItemsSummary ?? '',
      totalAmountOwed: r.totalAmountOwed ?? 0,
      currency: r.currency ?? '',
    });
  }

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
