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
