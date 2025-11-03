import ExcelJS from 'exceljs';

export interface PTSessionsExportRow {
  date?: string | null; // dd/MM/yyyy
  time?: string | null; // HH:mm or hh:mm a
  trainer?: string | null;
  members?: string | null;
  price?: string | number | null;
  status: 'Upcoming' | 'Completed' | 'No date' | 'Cancelled';
  createdAt?: string | null; // dd/MM/yyyy
}

export async function buildPtSessionsWorkbook(
  rows: PTSessionsExportRow[],
  sheetName: string = 'PT Sessions',
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 12 },
    { header: 'Trainer', key: 'trainer', width: 24 },
    { header: 'Members', key: 'members', width: 36 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Created At', key: 'createdAt', width: 16 },
  ];

  for (const r of rows) {
    sheet.addRow({
      date: r.date ?? '',
      time: r.time ?? '',
      trainer: r.trainer ?? '',
      members: r.members ?? '',
      price: r.price ?? '',
      status: r.status,
      createdAt: r.createdAt ?? '',
    });
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
